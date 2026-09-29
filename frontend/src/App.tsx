import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "./components/Header";
import { MemberDashboard, AvailableCircle } from "./components/MemberDashboard";
import { AuctionBidding } from "./components/AuctionBidding";
import { RiskAdvisorCard } from "./components/RiskAdvisorCard";
import { LedgerView, LedgerEvent } from "./components/LedgerView";
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
import { UserPlus, Shield, CheckCircle2, AlertCircle, Sparkles, Home, Box, History } from "lucide-react";
import gsap from "gsap";

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

  // Tabs
  const [activeTab, setActiveTab] = useState<"home" | "draw" | "standing" | "network" | "history">("home");

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

  // Load available groups dynamically from backend and localStorage
  const loadAvailableGroups = useCallback(async () => {
    try {
      const indexed = await fetchIndexedGroups();
      const customSaved: AvailableCircle[] = JSON.parse(localStorage.getItem("vouch_custom_groups") || "[]");

      const combinedMap = new Map<string, AvailableCircle>();

      // Base active circles
      const baseCircles: AvailableCircle[] = [
        {
          address: "0xAf378D33B037A6668fOd128c4BBA28bb65974D9b",
          name: "Alpha Savings Circle",
          memberCount: 5,
          installmentAmount: "5.0",
        },
        {
          address: "0xb794f5ea0ba39494ce839613fffba74279579268",
          name: "Bangalore Techies Chit",
          memberCount: 4,
          installmentAmount: "10.0",
        },
        {
          address: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
          name: "Family Emergency Pool",
          memberCount: 5,
          installmentAmount: "2.0",
        },
      ];

      baseCircles.forEach((c) => combinedMap.set(c.address.toLowerCase(), c));
      customSaved.forEach((c) => combinedMap.set(c.address.toLowerCase(), c));

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

  const tabContentRef = useRef<HTMLDivElement>(null);

  const showNotification = (message: string, isError: boolean = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  // Initialize ContractService
  useEffect(() => {
    const srv = new ContractService((provider as any) || undefined);
    if (signer) {
      srv.setSigner(signer);
    }
    setContractService(srv);
  }, [provider, signer]);

  // Tab switch GSAP animation
  const handleTabChange = (tab: "home" | "draw" | "standing" | "network" | "history") => {
    setActiveTab(tab);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion && tabContentRef.current) {
      gsap.fromTo(
        tabContentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
      );
    }
  };

  // Refresh Group and Member state
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

  const handleSelectGroup = async (addr: string) => {
    setActiveGroupAddress(addr);
    const srv = contractService || new ContractService((provider as any) || undefined);
    try {
      const g = await srv.getGroupDetails(addr);
      setGroupDetails(g);
      if (account) {
        const m = await srv.getMemberDetails(addr, account);
        setMemberDetails(m);
      }
    } catch (e) {
      console.warn("Could not load group details on selection:", e);
    }
  };

  useEffect(() => {
    if (activeGroupAddress) {
      refreshData();
    }
  }, [activeGroupAddress, refreshData]);

  // Handler: Create Group
  const handleCreateGroup = async (params: {
    groupName: string;
    memberCount: number;
    installmentAmount: string;
    cycleDuration: number;
    discountCapBps: number;
    reserveFeeBps: number;
  }) => {
    if (!contractService || !account) {
      setIsConnectModalOpen(true);
      return;
    }
    try {
      showNotification("Deploying Chit Group to MST Testnet...");
      const result = await contractService.createGroup(params);
      if (result.groupAddress) {
        const newCircle: AvailableCircle = {
          address: result.groupAddress,
          name: params.groupName,
          memberCount: params.memberCount,
          installmentAmount: params.installmentAmount,
        };
        const customSaved: AvailableCircle[] = JSON.parse(localStorage.getItem("vouch_custom_groups") || "[]");
        customSaved.unshift(newCircle);
        localStorage.setItem("vouch_custom_groups", JSON.stringify(customSaved));

        // Register with indexer
        fetch("http://localhost:4000/api/groups/index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: result.groupAddress }),
        }).catch(() => {});

        loadAvailableGroups();
        setActiveGroupAddress(result.groupAddress);
        showNotification(`Circle "${params.groupName}" deployed at ${result.groupAddress.substring(0, 10)}...`);
      } else {
        showNotification("Group creation transaction confirmed.");
      }
      await refreshData();
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
      showNotification("Submitting secret encrypted bid...");
      await contractService.commitBid(activeGroupAddress, bidAmountMST);
      showNotification("Bid committed successfully!");
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Submission failed", true);
    }
  };

  // Handler: Reveal Bid
  const handleRevealBid = async (bidAmountMST: string) => {
    if (!contractService || !activeGroupAddress) return;
    try {
      showNotification("Revealing bid on chain...");
      await contractService.revealBid(activeGroupAddress, bidAmountMST);
      showNotification("Bid revealed successfully!");
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Reveal failed", true);
    }
  };

  // Handler: Settle Draw
  const handleSettleRound = async () => {
    if (!contractService || !activeGroupAddress) return;
    try {
      showNotification("Settling round and distributing dividends...");
      await contractService.settleRound(activeGroupAddress);
      showNotification("Round settled! Dividends distributed.");
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Settlement failed", true);
    }
  };

  const tabs = [
    { id: "home" as const, label: "Circle Home", icon: <Home className="w-4 h-4" /> },
    { id: "draw" as const, label: "This Month's Draw", icon: <Sparkles className="w-4 h-4" /> },
    { id: "standing" as const, label: "Your Standing", icon: <Shield className="w-4 h-4" /> },
    { id: "network" as const, label: "3D Network", icon: <Box className="w-4 h-4" /> },
    { id: "history" as const, label: "Transactions", icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      {/* Header */}
      <Header
        account={account}
        balance={balance}
        isConnecting={isConnecting}
        groupName={groupDetails?.name}
        isTechnicalMode={isTechnicalMode}
        onToggleTechnicalMode={() => setIsTechnicalMode(!isTechnicalMode)}
        onOpenAccountModal={() => {
          if (!account) {
            clearError();
            setIsConnectModalOpen(true);
          } else {
            setIsAccountModalOpen(true);
          }
        }}
        onOpenCreateGroupModal={() => setIsCreateModalOpen(true)}
        onSwitchGroup={() => {
          setActiveGroupAddress("");
          setGroupDetails(null);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Toast */}
        {notification && (
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
              onClick={() => setNotification(null)}
              className="text-inherit opacity-60 hover:opacity-100 ml-4 transition-opacity"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs (FinTech Segmented Switcher) */}
        <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="v-btn-ghost text-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#2dd4a8]" />
              Join Circle
            </button>
          </div>
        </div>

        {/* Tab Content Container */}
        <div ref={tabContentRef}>
          {/* Tab 1: Group Home */}
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
                onOpenDrawTab={() => handleTabChange("draw")}
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
                  onOpenDrawTab={() => handleTabChange("draw")}
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

      {/* Modals */}
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
    </div>
  );
}
export default App;
