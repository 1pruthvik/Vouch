import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { MemberDashboard } from "./components/MemberDashboard";
import { AuctionBidding } from "./components/AuctionBidding";
import { RiskAdvisorCard } from "./components/RiskAdvisorCard";
import { LedgerView, LedgerEvent } from "./components/LedgerView";
import { CreateGroupModal } from "./components/CreateGroupModal";
import { JoinGroupModal } from "./components/JoinGroupModal";
import { ConnectWalletModal } from "./components/ConnectWalletModal";
import { MandateModal } from "./components/MandateModal";
import { AccountModal } from "./components/AccountModal";
import { useWallet } from "./hooks/useWallet";
import { ContractService, GroupDetails, MemberDetails } from "./services/contractService";
import { fetchRiskAdvisory, RiskPredictionResponse } from "./services/aiService";
import { fetchLedgerEvents } from "./services/indexerService";
import { Plus, UserPlus, Shield, CheckCircle2, RefreshCw, AlertCircle, Sparkles, Zap, Layers, History } from "lucide-react";

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
    switchToMSTTestnet,
  } = useWallet();

  const [contractService, setContractService] = useState<ContractService | null>(null);

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isMandateModalOpen, setIsMandateModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Progressive Disclosure: Technical / Pro Details Mode Toggle
  const [isTechnicalMode, setIsTechnicalMode] = useState<boolean>(false);

  // Tabs: Friendly names matching Indian mental models
  const [activeTab, setActiveTab] = useState<"home" | "draw" | "standing" | "history">("home");

  // State
  const [activeGroupAddress, setActiveGroupAddress] = useState<string>("");
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>([]);
  const [riskAdvisory, setRiskAdvisory] = useState<RiskPredictionResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isMandateActive, setIsMandateActive] = useState(true);

  const showNotification = (message: string, isError: boolean = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  // Initialize ContractService
  useEffect(() => {
    const srv = new ContractService(provider as any || undefined);
    if (signer) {
      srv.setSigner(signer);
    }
    setContractService(srv);
  }, [provider, signer]);

  // Refresh Group and Member state
  const refreshData = useCallback(async () => {
    if (!activeGroupAddress || !contractService) return;
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupAddress, contractService, account]);

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
      showNotification("Creating your savings circle on MST Blockchain...");
      const result = await contractService.createGroup(params);
      if (result.groupAddress) {
        setActiveGroupAddress(result.groupAddress);
        showNotification(`🎉 Circle created! Address: ${result.groupAddress.substring(0, 10)}...`);
      } else {
        showNotification("Circle created! Refreshing list...");
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
      showNotification("Depositing security deposit and joining circle...");
      await contractService.joinGroup(groupAddr, bufferDeposit);
      setActiveGroupAddress(groupAddr);
      showNotification("🎉 You have successfully joined the circle!");
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
      showNotification(`Processing monthly contribution of ${groupDetails.installmentAmount} tMSTC...`);
      await contractService.payInstallment(activeGroupAddress, groupDetails.installmentAmount);
      showNotification("🎉 Monthly payment confirmed on blockchain!");
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
      showNotification("Submitting encrypted early payout request...");
      await contractService.commitBid(activeGroupAddress, bidAmountMST);
      showNotification("🎉 Early payout request submitted!");
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
      showNotification("Revealing draw request on chain...");
      await contractService.revealBid(activeGroupAddress, bidAmountMST);
      showNotification("🎉 Request verified!");
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
      showNotification("Finalizing this month's draw and distributing savings...");
      await contractService.settleRound(activeGroupAddress);
      showNotification("🎉 Month draw settled! Savings distributed.");
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Settlement failed", true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090c] text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Header */}
      <Header
        account={account}
        balance={balance}
        groupName={groupDetails?.name || "Alpha Savings Circle"}
        isConnecting={isConnecting}
        isTechnicalMode={isTechnicalMode}
        onToggleTechnicalMode={() => setIsTechnicalMode(!isTechnicalMode)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenCreateGroupModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Toast / Notification Banner */}
        {notification && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold transition-all shadow-lg animate-fadeIn ${
              notification.isError
                ? "bg-red-500/15 border border-red-500/30 text-red-300"
                : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.isError ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs (CRED-style pill switcher) */}
        <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "home"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Circle Home
            </button>

            <button
              onClick={() => setActiveTab("draw")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "draw"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              This Month's Draw
            </button>

            <button
              onClick={() => setActiveTab("standing")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "standing"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Your Standing
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "history"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Transaction History
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/5 flex items-center gap-1.5 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              Join Circle
            </button>
          </div>
        </div>

        {/* Tab 1: Circle Home */}
        {activeTab === "home" && (
          <div className="space-y-6 animate-fadeIn">
            <MemberDashboard
              account={account}
              groupDetails={groupDetails}
              memberDetails={memberDetails}
              riskAdvisory={riskAdvisory}
              isTechnicalMode={isTechnicalMode}
              onPayInstallment={handlePayInstallment}
              onOpenMandateModal={() => setIsMandateModalOpen(true)}
              onOpenDrawTab={() => setActiveTab("draw")}
              onJoinGroup={() => setIsJoinModalOpen(true)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LedgerView
                  events={ledgerEvents.slice(0, 4)}
                  isTechnicalMode={isTechnicalMode}
                />
              </div>
              <div>
                <RiskAdvisorCard
                  memberAddress={account || "0x000"}
                  riskAdvisory={riskAdvisory}
                  isTechnicalMode={isTechnicalMode}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: This Month's Draw */}
        {activeTab === "draw" && (
          <div className="space-y-6 animate-fadeIn">
            <AuctionBidding
              currentRound={groupDetails?.currentRound || 1}
              totalPot={groupDetails?.currentPot || "2.5"}
              minBidAllowed={groupDetails?.minBid || "1.75"}
              phase={groupDetails?.currentState || "Commit"}
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

        {/* Tab 3: Your Standing */}
        {activeTab === "standing" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            <div className="lg:col-span-2">
              <MemberDashboard
                account={account}
                groupDetails={groupDetails}
                memberDetails={memberDetails}
                riskAdvisory={riskAdvisory}
                isTechnicalMode={isTechnicalMode}
                onPayInstallment={handlePayInstallment}
                onOpenMandateModal={() => setIsMandateModalOpen(true)}
                onOpenDrawTab={() => setActiveTab("draw")}
                onJoinGroup={() => setIsJoinModalOpen(true)}
              />
            </div>
            <div>
              <RiskAdvisorCard
                memberAddress={account || "0x000"}
                riskAdvisory={riskAdvisory}
                isTechnicalMode={isTechnicalMode}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Transaction History */}
        {activeTab === "history" && (
          <div className="space-y-6 animate-fadeIn">
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
        onJoin={handleJoinGroup}
        isTechnicalMode={isTechnicalMode}
      />

      <MandateModal
        isOpen={isMandateModalOpen}
        onClose={() => setIsMandateModalOpen(false)}
        groupName={groupDetails?.name || "Alpha Savings Circle"}
        installmentAmount={groupDetails?.installmentAmount || "0.5"}
        cycleDurationSeconds={groupDetails?.cycleDuration || 300}
        totalMembers={groupDetails?.memberCount || 5}
        isMandateActive={isMandateActive}
        onActivateMandate={async () => {
          setIsMandateActive(true);
          showNotification("🎉 Auto-Debit Mandate successfully registered!");
        }}
        isTechnicalMode={isTechnicalMode}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        account={account}
        balance={balance}
        isCorrectNetwork={isCorrectNetwork}
        onSwitchNetwork={switchToMSTTestnet}
        onOpenConnectModal={() => {
          setIsAccountModalOpen(false);
          setIsConnectModalOpen(true);
        }}
        isTechnicalMode={isTechnicalMode}
        onToggleTechnicalMode={() => setIsTechnicalMode(!isTechnicalMode)}
      />
    </div>
  );
}
export default App;
