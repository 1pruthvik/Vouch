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
import { BlockchainNetwork3D } from "./components/BlockchainNetwork3D";
import { useWallet } from "./hooks/useWallet";
import { ContractService, GroupDetails, MemberDetails } from "./services/contractService";
import { fetchRiskAdvisory, RiskPredictionResponse } from "./services/aiService";
import { fetchLedgerEvents } from "./services/indexerService";
import { UserPlus, Shield, CheckCircle2, AlertCircle, Sparkles, Zap, History, Box } from "lucide-react";

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
  } = useWallet();

  const [contractService, setContractService] = useState<ContractService | null>(null);

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isMandateModalOpen, setIsMandateModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Progressive Disclosure: Technical Pro Mode Toggle
  const [isTechnicalMode] = useState<boolean>(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"home" | "draw" | "standing" | "network" | "history">("home");

  // State
  const [activeGroupAddress, setActiveGroupAddress] = useState<string>("");
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>([]);
  const [riskAdvisory, setRiskAdvisory] = useState<RiskPredictionResponse | null>(null);

  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isMandateActive, setIsMandateActive] = useState(false);

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
        setActiveGroupAddress(result.groupAddress);
        showNotification(`Group deployed at ${result.groupAddress.substring(0, 10)}...`);
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

  return (
    <div className="min-h-screen flex flex-col bg-black text-neutral-100">
      {/* Header */}
      <Header
        account={account}
        balance={balance}
        isConnecting={isConnecting}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenCreateGroupModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Toast / Notification Banner */}
        {notification && (
          <div
            className={`p-4 rounded-lg flex items-center justify-between text-xs sm:text-sm font-semibold transition-all shadow-lg ${
              notification.isError
                ? "bg-red-950/80 border border-red-800 text-red-200"
                : "bg-neutral-900 border border-neutral-800 text-neutral-100"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.isError ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-royal-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-900 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "home"
                  ? "bg-royal-600 text-white shadow-md"
                  : "bg-[#141414] text-neutral-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Group Home
            </button>

            <button
              onClick={() => setActiveTab("draw")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "draw"
                  ? "bg-royal-600 text-white shadow-md"
                  : "bg-[#141414] text-neutral-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Reverse Auction
            </button>

            <button
              onClick={() => setActiveTab("standing")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "standing"
                  ? "bg-royal-600 text-white shadow-md"
                  : "bg-[#141414] text-neutral-400 hover:text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Solvency & Standing
            </button>

            <button
              onClick={() => setActiveTab("network")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "network"
                  ? "bg-royal-600 text-white shadow-md"
                  : "bg-[#141414] text-neutral-400 hover:text-white"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              3D Network
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "history"
                  ? "bg-royal-600 text-white shadow-md"
                  : "bg-[#141414] text-neutral-400 hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Ledger History
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="btn-secondary text-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-royal-400" />
              Join Group
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
              onPayInstallment={handlePayInstallment}
              onOpenMandateModal={() => setIsMandateModalOpen(true)}
              onOpenDrawTab={() => setActiveTab("draw")}
              onJoinGroup={() => setIsJoinModalOpen(true)}
              onCreateGroup={() => setIsCreateModalOpen(true)}
            />

            {groupDetails && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Tab 3: Solvency & Standing */}
        {activeTab === "standing" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Tab 5: Ledger History */}
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
        groupName={groupDetails?.name || ""}
        installmentAmount={groupDetails?.installmentAmount || "0"}
        cycleDurationSeconds={groupDetails?.cycleDuration || 0}
        totalMembers={groupDetails?.memberCount || 0}
        isMandateActive={isMandateActive}
        onActivateMandate={async () => {
          setIsMandateActive(true);
          showNotification("Auto-Debit Mandate authorized.");
        }}
        isTechnicalMode={isTechnicalMode}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        account={account}
        balance={balance}
        isCorrectNetwork={isCorrectNetwork}
        detectedProviders={detectedProviders}
        onConnectExtension={connectWallet}
        onConnectPrivateKey={connectWithPrivateKey}
      />
    </div>
  );
}
export default App;
