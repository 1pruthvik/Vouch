import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "./components/Header";
import { MemberDashboard, AvailableCircle } from "./components/MemberDashboard";
import { CircleWorkspace } from "./components/CircleWorkspace";
import { AuctionBidding } from "./components/AuctionBidding";
import { RiskAdvisorCard } from "./components/RiskAdvisorCard";
import { LedgerView, LedgerEvent } from "./components/LedgerView";
import { VouchOverview } from "./components/VouchOverview";
import { CreateGroupModal } from "./components/CreateGroupModal";
import { JoinGroupModal } from "./components/JoinGroupModal";
import { ConnectWalletModal } from "./components/ConnectWalletModal";
import { MandateModal } from "./components/MandateModal";
import { AccountModal } from "./components/AccountModal";
import { BlockchainNetwork3D } from "./components/BlockchainNetwork3D";
import { useWallet } from "./hooks/useWallet";
import { useLenis } from "./hooks/useLenis";
import { ContractService, GroupDetails, MemberDetails } from "./services/contractService";
import { fetchRiskAdvisory, RiskPredictionResponse } from "./services/aiService";
import { fetchLedgerEvents, fetchIndexedGroups } from "./services/indexerService";
import { CircleLifecycleService, CircleData } from "./services/circleLifecycleService";
import { UserPlus, Shield, CheckCircle2, AlertCircle, Sparkles, Home, Box, History, LayoutDashboard } from "lucide-react";
import gsap from "gsap";

export type AppTab = "overview" | "home" | "circle_workspace" | "draw" | "standing" | "network" | "history";

export function App() {
  // Initialize Lenis smooth scroll
  useLenis();

  const {
    account,
    balance,
    isConnecting,
    isCorrectNetwork,
    provider,
    signer,
    detectedProviders,
    error: walletError,
    connectWallet,
    connectWithPrivateKey,
    clearError,
  } = useWallet();

  const [contractService, setContractService] = useState<ContractService | null>(null);

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isMandateModalOpen, setIsMandateModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Progressive Disclosure: Technical Pro Mode Toggle
  const [isTechnicalMode, setIsTechnicalMode] = useState<boolean>(false);

  // Active Circle Identifier (e.g. slug or address)
  const [activeCircleId, setActiveCircleId] = useState<string>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.startsWith("/circle/")) return decodeURIComponent(path.replace("/circle/", ""));
    if (hash.startsWith("#circle/")) return decodeURIComponent(hash.replace("#circle/", ""));
    return localStorage.getItem("vouch_active_circle_id") || "alpha-savings-circle";
  });

  // Active Tab & Routing State
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.startsWith("/circle/") || hash.startsWith("#circle/")) return "circle_workspace";
    if (path === "/draw" || hash === "#draw") return "draw";
    if (path === "/standing" || hash === "#standing") return "standing";
    if (path === "/network" || hash === "#network") return "network";
    if (path === "/history" || hash === "#history") return "history";
    if (path === "/home" || hash === "#home") return "home";
    return "overview";
  });

  // State
  const [activeGroupAddress, setActiveGroupAddress] = useState<string>(() => {
    return localStorage.getItem("vouch_active_group") || "0xAf378D33B037A6668fOd128c4BBA28bb65974D9b";
  });
  const [availableGroups, setAvailableGroups] = useState<AvailableCircle[]>([]);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>([]);
  const [riskAdvisory, setRiskAdvisory] = useState<RiskPredictionResponse | null>(null);

  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isMandateActive, setIsMandateActive] = useState<boolean>(() => {
    return localStorage.getItem("vouch_autopay_active") === "true";
  });

  const tabContentRef = useRef<HTMLDivElement>(null);

  const showNotification = (message: string, isError: boolean = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  // Browser Navigation & History Synchronization
  const navigateTo = (tab: AppTab, circleId?: string) => {
    setActiveTab(tab);
    if (circleId) {
      setActiveCircleId(circleId);
      localStorage.setItem("vouch_active_circle_id", circleId);
      const circleData = CircleLifecycleService.getCircleByIdOrAddress(circleId);
      if (circleData) {
        setActiveGroupAddress(circleData.address);
      }
      window.history.pushState({ tab, circleId }, "", `/circle/${circleId}`);
    } else {
      window.history.pushState({ tab }, "", tab === "overview" ? "/" : `/${tab}`);
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion && tabContentRef.current) {
      gsap.fromTo(
        tabContentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
      );
    }
  };

  // Handle Browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith("/circle/") || hash.startsWith("#circle/")) {
        const id = path.startsWith("/circle/")
          ? decodeURIComponent(path.replace("/circle/", ""))
          : decodeURIComponent(hash.replace("#circle/", ""));
        setActiveCircleId(id);
        setActiveTab("circle_workspace");
      } else if (path === "/draw" || hash === "#draw") {
        setActiveTab("draw");
      } else if (path === "/standing" || hash === "#standing") {
        setActiveTab("standing");
      } else if (path === "/network" || hash === "#network") {
        setActiveTab("network");
      } else if (path === "/history" || hash === "#history") {
        setActiveTab("history");
      } else if (path === "/home" || hash === "#home") {
        setActiveTab("home");
      } else {
        setActiveTab("overview");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load available groups dynamically from backend and localStorage
  const loadAvailableGroups = useCallback(async () => {
    try {
      const allStoreCircles = CircleLifecycleService.getAllCircles();
      const indexed = await fetchIndexedGroups();

      const combinedMap = new Map<string, AvailableCircle>();

      // Load from CircleLifecycleStore
      allStoreCircles.forEach((c) => {
        combinedMap.set(c.address.toLowerCase(), {
          address: c.address,
          name: c.name,
          memberCount: c.memberCount,
          installmentAmount: c.installmentAmount,
        });
      });

      if (Array.isArray(indexed)) {
        indexed.forEach((g: any) => {
          if (g.address) {
            combinedMap.set(g.address.toLowerCase(), {
              address: g.address,
              name: g.group_name || g.name || "Community Pool",
              memberCount: g.member_count || g.memberCount || 5,
              installmentAmount: g.installment_amount || g.installmentAmount || "5.0",
            });
          }
        });
      }

      setAvailableGroups(Array.from(combinedMap.values()));
    } catch (err) {
      console.warn("Could not load available groups:", err);
    }
  }, []);

  useEffect(() => {
    loadAvailableGroups();
  }, [loadAvailableGroups]);

  // Persist activeGroupAddress
  useEffect(() => {
    if (activeGroupAddress) {
      localStorage.setItem("vouch_active_group", activeGroupAddress);
    }
  }, [activeGroupAddress]);

  // Persist AutoPay state
  useEffect(() => {
    localStorage.setItem("vouch_autopay_active", isMandateActive ? "true" : "false");
  }, [isMandateActive]);

  // Initialize ContractService
  useEffect(() => {
    const srv = new ContractService((provider as any) || undefined);
    if (signer) {
      srv.setSigner(signer);
    }
    setContractService(srv);
  }, [provider, signer]);

  // Refresh Group and Member state from on-chain / indexer
  const refreshData = useCallback(async () => {
    if (!activeGroupAddress || !contractService) return;
    try {
      const gDetails = await contractService.getGroupDetails(activeGroupAddress);
      setGroupDetails(gDetails);

      if (account) {
        const mDetails = await contractService.getMemberDetails(activeGroupAddress, account);
        setMemberDetails(mDetails);

        // Fetch AI risk prediction
        const aiResult = await fetchRiskAdvisory({
          member: account,
          term_length: gDetails.memberCount,
          months_remaining: Math.max(0, gDetails.memberCount - gDetails.currentRound),
          has_won: mDetails.hasWon,
          win_round: mDetails.winRound,
          payment_streak: mDetails.paidInstallments,
        });
        setRiskAdvisory(aiResult);
      }

      // Fetch indexer events
      const events = await fetchLedgerEvents(activeGroupAddress);
      setLedgerEvents(events);
    } catch (err: any) {
      console.warn("Could not load group details from chain:", err);
    }
  }, [activeGroupAddress, contractService, account]);

  const handleSelectGroup = async (addrOrId: string) => {
    const circle = CircleLifecycleService.getCircleByIdOrAddress(addrOrId);
    if (circle) {
      navigateTo("circle_workspace", circle.id);
    } else {
      setActiveGroupAddress(addrOrId);
      navigateTo("circle_workspace", addrOrId);
    }
  };

  useEffect(() => {
    if (activeGroupAddress) {
      refreshData();
    }
  }, [activeGroupAddress, refreshData]);

  // Handler: Create Group (Launches Circle, starts with 0/N members, navigates to dedicated route)
  const handleCreateGroup = async (params: {
    groupName: string;
    memberCount: number;
    installmentAmount: string;
    cycleDuration: number;
    discountCapBps: number;
    reserveFeeBps: number;
  }) => {
    try {
      showNotification("Deploying Savings Circle to MST Blockchain...");
      let deployedAddress: string | undefined;
      let txHash: string | undefined;

      if (contractService && account) {
        try {
          const result = await contractService.createGroup(params);
          txHash = result.txHash;
          deployedAddress = result.groupAddress;
        } catch (e: any) {
          console.warn("Factory contract deployment notice:", e);
        }
      }

      // Create new circle in repository starting with strictly 0 members!
      const newCircle = CircleLifecycleService.createNewCircle({
        name: params.groupName,
        memberCount: params.memberCount,
        installmentAmount: params.installmentAmount,
        cycleDurationSeconds: params.cycleDuration,
        discountCapBps: params.discountCapBps,
        reserveFeeBps: params.reserveFeeBps,
        creatorAddress: account || undefined,
        deployedContractAddress: deployedAddress,
        txHash,
      });

      // Register with indexer
      if (deployedAddress) {
        fetch("http://localhost:4000/api/groups/index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: deployedAddress }),
        }).catch(() => {});
      }

      loadAvailableGroups();
      showNotification(`Circle "${params.groupName}" created! Invite participants to activate.`);

      // Navigate directly to the dedicated circle route!
      navigateTo("circle_workspace", newCircle.id);
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Failed to create group", true);
    }
  };

  // Handler: Join Group
  const handleJoinGroup = async (groupAddr: string, bufferDeposit: string) => {
    if (!contractService || !account) {
      setIsConnectModalOpen(true);
      return;
    }
    try {
      showNotification("Depositing collateral and joining group...");
      await contractService.joinGroup(groupAddr, bufferDeposit);
      setActiveGroupAddress(groupAddr);
      showNotification("Successfully joined the group!");
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Failed to join group", true);
    }
  };

  // Handler: Pay Monthly Contribution
  const handlePayInstallment = async () => {
    if (!contractService || !activeGroupAddress || !groupDetails) return;
    try {
      showNotification(`Processing monthly installment of ${groupDetails.installmentAmount} tMSTC...`);
      await contractService.payInstallment(activeGroupAddress, groupDetails.installmentAmount);
      showNotification("Monthly contribution confirmed on blockchain!");
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Payment failed", true);
    }
  };

  // Handler: Commit Early Payout Request
  const handleCommitBid = async (bidAmountMST: string) => {
    if (!contractService || !activeGroupAddress) return;
    try {
      showNotification("Anchoring commitment hash on MST Testnet...");
      await contractService.commitBid(activeGroupAddress, bidAmountMST);
      showNotification("Encrypted bid commitment confirmed on-chain!");
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Commit failed", true);
    }
  };

  // Handler: Reveal Plaintext Bid
  const handleRevealBid = async (bidAmountMST: string) => {
    if (!contractService || !activeGroupAddress) return;
    try {
      showNotification("Submitting plaintext bid & salt for verification...");
      await contractService.revealBid(activeGroupAddress, bidAmountMST);
      showNotification("Bid revealed and cryptographically verified!");
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Reveal failed", true);
    }
  };

  // Handler: Settle Round
  const handleSettleRound = async () => {
    if (!contractService || !activeGroupAddress) return;
    try {
      showNotification("Executing round settlement & dividend distribution...");
      await contractService.settleRound(activeGroupAddress);
      showNotification("Round settled! Pot paid and dividends distributed.");
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Settlement failed", true);
    }
  };

  // Secondary tabs list
  const tabs = [
    { id: "home" as const, label: "Circle Directory", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: "draw" as const, label: "Monthly Draw", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: "standing" as const, label: "Trust & Risk", icon: <Shield className="w-3.5 h-3.5" /> },
    { id: "history" as const, label: "Audit Ledger", icon: <History className="w-3.5 h-3.5" /> },
    { id: "network" as const, label: "3D Network", icon: <Box className="w-3.5 h-3.5" /> },
  ];

  // Get active circle display name for header
  const currentCircleData = CircleLifecycleService.getCircleByIdOrAddress(activeCircleId || activeGroupAddress);
  const activeCircleName = currentCircleData ? currentCircleData.name : groupDetails?.name || "Alpha Savings Circle";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#121316] font-sans antialiased selection:bg-[#E9B949]/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#E9B949]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          account={account}
          balance={balance}
          isConnecting={isConnecting}
          groupName={activeCircleName}
          isTechnicalMode={isTechnicalMode}
          activeTab={activeTab === "circle_workspace" ? "home" : activeTab}
          onTabChange={(tabId) => navigateTo(tabId as AppTab)}
          onToggleTechnicalMode={() => setIsTechnicalMode(!isTechnicalMode)}
          onOpenAccountModal={() => {
            clearError();
            if (!account) {
              setIsConnectModalOpen(true);
            } else {
              setIsAccountModalOpen(true);
            }
          }}
          onOpenCreateGroupModal={() => setIsCreateModalOpen(true)}
          onSwitchGroup={() => navigateTo("home")}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full mx-auto px-4 sm:px-8 lg:px-12 py-6 space-y-6">
          {/* Secondary Sub-navigation Pill Bar for Workspace Tabs */}
          {activeTab !== "overview" && (
            <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar bg-black/[0.02] p-1 rounded-full border border-black/[0.04]">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => navigateTo(tab.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? "bg-[#121316] text-white shadow-sm font-semibold"
                        : "text-[#5F6368] hover:text-[#121316] hover:bg-black/[0.04]"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(true)}
                  className="btn-pill-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#121316]" />
                  Join Circle
                </button>
              </div>
            </div>
          )}

          {/* Tab Content Container */}
          <div ref={tabContentRef}>
            {/* Tab 0: Editorial Overview (Landing Experience) */}
            {activeTab === "overview" && (
              <VouchOverview
                account={account}
                groupDetails={groupDetails}
                memberDetails={memberDetails}
                riskAdvisory={riskAdvisory}
                onOpenDrawTab={() => navigateTo("draw")}
                onOpenStandingTab={() => navigateTo("standing")}
                onOpenLedgerTab={() => navigateTo("history")}
                onOpenDashboardTab={() => navigateTo("home")}
                onOpenConnectModal={() => {
                  clearError();
                  setIsConnectModalOpen(true);
                }}
                onOpenCreateGroupModal={() => setIsCreateModalOpen(true)}
              />
            )}

            {/* Dedicated Route: Specific Circle Workspace (Complete Chit Fund Lifecycle) */}
            {activeTab === "circle_workspace" && (
              <CircleWorkspace
                circleIdOrAddress={activeCircleId || activeGroupAddress}
                account={account}
                balance={balance}
                isTechnicalMode={isTechnicalMode}
                onBackToDirectory={() => navigateTo("home")}
                onOpenConnectModal={() => {
                  clearError();
                  setIsConnectModalOpen(true);
                }}
                onShowNotification={showNotification}
              />
            )}

            {/* Tab 1: Group Directory & Dashboard */}
            {activeTab === "home" && (
              <div className="space-y-5 anim-fade-up">
                <MemberDashboard
                  account={account}
                  groupDetails={groupDetails}
                  memberDetails={memberDetails}
                  riskAdvisory={riskAdvisory}
                  isTechnicalMode={isTechnicalMode}
                  isMandateActive={isMandateActive}
                  availableGroups={availableGroups}
                  onSelectGroup={handleSelectGroup}
                  onPayInstallment={handlePayInstallment}
                  onOpenMandateModal={() => setIsMandateModalOpen(true)}
                  onOpenDrawTab={() => navigateTo("draw")}
                  onJoinGroup={() => setIsJoinModalOpen(true)}
                  onCreateGroup={() => setIsCreateModalOpen(true)}
                />

                {groupDetails && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                      <LedgerView
                        events={ledgerEvents.slice(0, 4)}
                        isTechnicalMode={isTechnicalMode}
                      />
                    </div>
                    <div>
                      <RiskAdvisorCard
                        memberAddress={account || ""}
                        riskAdvisory={riskAdvisory}
                        isTechnicalMode={isTechnicalMode}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Reverse Auction */}
            {activeTab === "draw" && (
              <div className="space-y-5 anim-fade-up">
                <AuctionBidding
                  currentRound={groupDetails?.currentRound || 1}
                  totalPot={groupDetails?.currentPot || "0"}
                  minBidAllowed={groupDetails?.minBid || "0"}
                  phase={groupDetails?.currentState || "Forming"}
                  hasCommitted={false}
                  hasRevealed={false}
                  hasWonPreviously={memberDetails?.hasWon || false}
                  isTechnicalMode={isTechnicalMode}
                  groupDetails={groupDetails}
                  onCommitBid={handleCommitBid}
                  onRevealBid={handleRevealBid}
                  onSettleRound={handleSettleRound}
                />
              </div>
            )}

            {/* Tab 3: Solvency & Standing */}
            {activeTab === "standing" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 anim-fade-up">
                <div className="lg:col-span-2">
                  <MemberDashboard
                    account={account}
                    groupDetails={groupDetails}
                    memberDetails={memberDetails}
                    riskAdvisory={riskAdvisory}
                    isTechnicalMode={isTechnicalMode}
                    isMandateActive={isMandateActive}
                    availableGroups={availableGroups}
                    onSelectGroup={handleSelectGroup}
                    onPayInstallment={handlePayInstallment}
                    onOpenMandateModal={() => setIsMandateModalOpen(true)}
                    onOpenDrawTab={() => navigateTo("draw")}
                    onJoinGroup={() => setIsJoinModalOpen(true)}
                    onCreateGroup={() => setIsCreateModalOpen(true)}
                  />
                </div>
                <div>
                  <RiskAdvisorCard
                    memberAddress={account || ""}
                    riskAdvisory={riskAdvisory}
                    isTechnicalMode={isTechnicalMode}
                  />
                </div>
              </div>
            )}

            {/* Tab 4: 3D Blockchain Network */}
            {activeTab === "network" && (
              <div className="space-y-5 anim-fade-up">
                <BlockchainNetwork3D
                  currentAccount={account}
                  groupDetails={groupDetails}
                  memberDetails={memberDetails}
                  onPayDues={handlePayInstallment}
                  onCommitBid={handleCommitBid}
                />
              </div>
            )}

            {/* Tab 5: Ledger History */}
            {activeTab === "history" && (
              <div className="space-y-5 anim-fade-up">
                <LedgerView
                  events={ledgerEvents}
                  isTechnicalMode={isTechnicalMode}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals (Viewport Overlay Layer via React Portals) */}
      <ConnectWalletModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnectExtension={connectWallet}
        onConnectPrivateKey={connectWithPrivateKey}
        onClearError={clearError}
        detectedProviders={detectedProviders}
        error={walletError}
      />

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
        isTechnicalMode={isTechnicalMode}
      />

      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        defaultGroupAddress={activeGroupAddress}
        defaultDepositINR={groupDetails ? Math.round(parseFloat(groupDetails.installmentAmount) * 1000) : 5000}
        onJoin={handleJoinGroup}
        isTechnicalMode={isTechnicalMode}
      />

      <MandateModal
        isOpen={isMandateModalOpen}
        onClose={() => setIsMandateModalOpen(false)}
        groupName={groupDetails?.name || ""}
        installmentAmount={groupDetails?.installmentAmount || "0"}
        cycleDurationSeconds={groupDetails?.cycleDuration || 0}
        totalMembers={groupDetails?.memberCount || 0}
        isMandateActive={isMandateActive}
        onActivateMandate={async () => {
          setIsMandateActive(true);
          showNotification("Auto-Debit Mandate authorized.");
        }}
        onCancelMandate={() => {
          setIsMandateActive(false);
          showNotification("Auto-Debit Mandate cancelled.");
        }}
        isTechnicalMode={isTechnicalMode}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        account={account}
        balance={balance}
        isCorrectNetwork={isCorrectNetwork}
        isTechnicalMode={isTechnicalMode}
        onToggleTechnicalMode={() => setIsTechnicalMode(!isTechnicalMode)}
        detectedProviders={detectedProviders}
        onConnectExtension={connectWallet}
        onConnectPrivateKey={connectWithPrivateKey}
      />

      {/* Fixed Viewport Toast Notifications */}
      {notification && (
        <div className="v-toast-container" role="status" aria-live="polite">
          <div className={`v-toast ${notification.isError ? "v-toast-error" : "v-toast-success"}`}>
            <div className="flex items-center gap-2.5">
              {notification.isError ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-inherit opacity-60 hover:opacity-100 ml-3 p-1 transition-opacity"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
