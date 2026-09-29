import React, { useState, useEffect, useCallback } from "react";
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
import { ContractService, GroupDetails, MemberDetails } from "./services/contractService";
import { fetchRiskAdvisory, RiskPredictionResponse } from "./services/aiService";
import { fetchLedgerEvents, fetchIndexedGroups } from "./services/indexerService";
import { UserPlus, CheckCircle2, AlertCircle, Sparkles, Home, Box, History } from "lucide-react";

export function App() {
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

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isMandateModalOpen, setIsMandateModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const [isTechnicalMode, setIsTechnicalMode] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"home" | "draw" | "network" | "history">("home");

  const [activeGroupAddress, setActiveGroupAddress] = useState<string>(() => {
    return localStorage.getItem("vouch_active_group") || "";
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

  const loadAvailableGroups = useCallback(async () => {
    try {
      const indexed = await fetchIndexedGroups();
      const customSaved: AvailableCircle[] = JSON.parse(localStorage.getItem("vouch_custom_groups") || "[]");
      const combinedMap = new Map<string, AvailableCircle>();

      customSaved.forEach((c) => combinedMap.set(c.address.toLowerCase(), c));

      if (Array.isArray(indexed)) {
        indexed.forEach((g: any) => {
          if (g.address) {
            combinedMap.set(g.address.toLowerCase(), {
              address: g.address,
              name: g.groupName || g.name || `Circle (${g.address.substring(0, 6)}...)`,
              memberCount: Number(g.memberCount || 5),
              installmentAmount: String(g.installmentAmount || "1.0"),
            });
          }
        });
      }

      if (contractService) {
        try {
          const factoryGroups = await contractService.getDeployedGroupsFromFactory();
          for (const addr of factoryGroups) {
            if (!combinedMap.has(addr.toLowerCase())) {
              try {
                const gd = await contractService.getGroupDetails(addr);
                combinedMap.set(addr.toLowerCase(), {
                  address: addr,
                  name: gd.name,
                  memberCount: gd.memberCount,
                  installmentAmount: gd.installmentAmount,
                });
              } catch {
                combinedMap.set(addr.toLowerCase(), {
                  address: addr,
                  name: `Circle (${addr.substring(0, 6)}...)`,
                  memberCount: 5,
                  installmentAmount: "1.0",
                });
              }
            }
          }
        } catch (err) {
          console.warn("Factory fetch error:", err);
        }
      }

      const list = Array.from(combinedMap.values());
      setAvailableGroups(list);

      if (!activeGroupAddress && list.length > 0) {
        setActiveGroupAddress(list[0].address);
      }
    } catch (err) {
      console.warn("Failed to load circles:", err);
    }
  }, [contractService, activeGroupAddress]);

  useEffect(() => {
    loadAvailableGroups();
  }, [loadAvailableGroups]);

  useEffect(() => {
    if (activeGroupAddress) {
      localStorage.setItem("vouch_active_group", activeGroupAddress);
    }
  }, [activeGroupAddress]);

  useEffect(() => {
    localStorage.setItem("vouch_autopay_active", isMandateActive ? "true" : "false");
  }, [isMandateActive]);

  const showNotification = (message: string, isError: boolean = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    const srv = new ContractService((provider as any) || undefined);
    if (signer) {
      srv.setSigner(signer);
    }
    setContractService(srv);
  }, [provider, signer]);

  const refreshData = useCallback(async () => {
    if (!activeGroupAddress || !contractService) return;
    try {
      const gDetails = await contractService.getGroupDetails(activeGroupAddress);
      setGroupDetails(gDetails);

      if (account) {
        const mDetails = await contractService.getMemberDetails(activeGroupAddress, account);
        setMemberDetails(mDetails);

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

      const events = await fetchLedgerEvents(activeGroupAddress);
      setLedgerEvents(events);
    } catch (err: any) {
      console.warn("Could not load group details from chain:", err);
    }
  }, [activeGroupAddress, contractService, account]);

  useEffect(() => {
    if (activeGroupAddress) {
      refreshData();
    }
  }, [activeGroupAddress, refreshData]);

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
        setActiveGroupAddress(result.groupAddress);
        const saved: AvailableCircle[] = JSON.parse(localStorage.getItem("vouch_custom_groups") || "[]");
        saved.push({
          address: result.groupAddress,
          name: params.groupName,
          memberCount: params.memberCount,
          installmentAmount: params.installmentAmount,
        });
        localStorage.setItem("vouch_custom_groups", JSON.stringify(saved));
        showNotification(`Group deployed at ${result.groupAddress.substring(0, 10)}...`);
      } else {
        showNotification("Group creation transaction confirmed.");
      }
      await refreshData();
      await loadAvailableGroups();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Failed to create group", true);
    }
  };

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
      await loadAvailableGroups();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Failed to join group", true);
    }
  };

  const handlePayInstallment = async () => {
    if (!contractService || !activeGroupAddress || !groupDetails) return;
    try {
      showNotification(`Processing installment of ${groupDetails.installmentAmount} tMSTC...`);
      await contractService.payInstallment(activeGroupAddress, groupDetails.installmentAmount);
      showNotification("Monthly contribution confirmed on blockchain!");
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Payment failed", true);
    }
  };

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
    { id: "home" as const, label: "Group Home", icon: <Home className="w-4 h-4" /> },
    { id: "draw" as const, label: "Reverse Auction", icon: <Sparkles className="w-4 h-4" /> },
    { id: "network" as const, label: "3D Network", icon: <Box className="w-4 h-4" /> },
    { id: "history" as const, label: "Ledger History", icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-neutral-100">
      <Header
        account={account}
        balance={balance}
        isConnecting={isConnecting}
        groupName={groupDetails?.name}
        isTechnicalMode={isTechnicalMode}
        onToggleTechnicalMode={() => setIsTechnicalMode(!isTechnicalMode)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenCreateGroupModal={() => setIsCreateModalOpen(true)}
        onSwitchGroup={() => {
          setActiveGroupAddress("");
          setGroupDetails(null);
          setActiveTab("home");
        }}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-lg flex items-center justify-between text-xs sm:text-sm font-semibold transition-all ${
              notification.isError
                ? "text-red-400 bg-red-950/20"
                : "text-neutral-100 bg-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.isError ? (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-neutral-400 hover:text-white ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Tabs Navigation: Transparent background, scales up, raises a little, and turns red ── */}
        <div className="flex items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-5 sm:gap-7 flex-wrap py-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-1 py-1 text-xs sm:text-sm flex items-center gap-2 transition-all duration-300 ease-out transform cursor-pointer bg-transparent border-none ${
                    isActive
                      ? "text-red-500 font-bold scale-110 -translate-y-1 drop-shadow-[0_0_10px_rgba(255,23,68,0.5)]"
                      : "text-neutral-500 font-medium scale-100 translate-y-0 hover:text-neutral-300 hover:-translate-y-0.5"
                  }`}
                >
                  <span className={isActive ? "text-red-500" : "text-neutral-500"}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="btn-secondary text-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-red-500" />
              Join Circle
            </button>
          </div>
        </div>

        {/* Tab 1: Group Home */}
        {activeTab === "home" && (
          <div className="space-y-6">
            <MemberDashboard
              account={account}
              groupDetails={groupDetails}
              memberDetails={memberDetails}
              riskAdvisory={riskAdvisory}
              isTechnicalMode={isTechnicalMode}
              isMandateActive={isMandateActive}
              availableGroups={availableGroups}
              onSelectGroup={(addr) => {
                setActiveGroupAddress(addr);
              }}
              onPayInstallment={handlePayInstallment}
              onOpenMandateModal={() => setIsMandateModalOpen(true)}
              onOpenDrawTab={() => setActiveTab("draw")}
              onJoinGroup={() => setIsJoinModalOpen(true)}
              onCreateGroup={() => setIsCreateModalOpen(true)}
            />

            {groupDetails && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
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
          <div className="space-y-6">
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

        {/* Tab 3: 3D Blockchain Network */}
        {activeTab === "network" && (
          <div className="space-y-6">
            <BlockchainNetwork3D
              currentAccount={account}
              groupDetails={groupDetails}
              memberDetails={memberDetails}
              onPayDues={handlePayInstallment}
              onCommitBid={handleCommitBid}
            />
          </div>
        )}

        {/* Tab 4: Ledger History */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <LedgerView
              events={ledgerEvents}
              isTechnicalMode={isTechnicalMode}
            />
          </div>
        )}
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
