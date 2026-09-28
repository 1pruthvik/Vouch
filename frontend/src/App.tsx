import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { MemberDashboard } from "./components/MemberDashboard";
import { AuctionBidding } from "./components/AuctionBidding";
import { RiskAdvisorCard } from "./components/RiskAdvisorCard";
import { LedgerView, LedgerEvent } from "./components/LedgerView";
import { CreateGroupModal } from "./components/CreateGroupModal";
import { JoinGroupModal } from "./components/JoinGroupModal";
import { useWallet } from "./hooks/useWallet";
import { ContractService, GroupDetails, MemberDetails } from "./services/contractService";
import { fetchRiskAdvisory, RiskPredictionResponse } from "./services/aiService";
import { fetchLedgerEvents } from "./services/indexerService";
import { Plus, UserPlus, Shield, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";

export function App() {
  const {
    account,
    balance,
    isConnecting,
    isCorrectNetwork,
    provider,
    connectWallet,
    switchToMSTTestnet,
  } = useWallet();

  const [contractService, setContractService] = useState<ContractService | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "auction" | "ledger">("dashboard");

  const [activeGroupAddress, setActiveGroupAddress] = useState<string>("");
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>([]);
  const [riskAdvisory, setRiskAdvisory] = useState<RiskPredictionResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  const showNotification = (message: string, isError: boolean = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  // Initialize ContractService when provider changes
  useEffect(() => {
    const srv = new ContractService(provider || undefined);
    if (provider && account) {
      provider.getSigner().then((signer) => {
        srv.setSigner(signer);
      }).catch(console.error);
    }
    setContractService(srv);
  }, [provider, account]);

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
      showNotification("Please connect your wallet first.", true);
      return;
    }
    try {
      showNotification("Submitting Create Group transaction to MST Testnet...");
      const result = await contractService.createGroup(params);
      if (result.groupAddress) {
        setActiveGroupAddress(result.groupAddress);
        showNotification(`Group created at ${result.groupAddress.substring(0, 10)}...`);
      } else {
        showNotification(`Transaction submitted: ${result.txHash.substring(0, 10)}...`);
      }
      refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.reason || err.message || "Failed to create group", true);
    }
  };

  // Handler: Join Group
  const handleJoinGroup = async (params: {
    groupAddress: string;
    bufferAmount: string;
    voucherAddress?: string;
    voucherStake?: string;
  }) => {
    if (!contractService || !account) {
      showNotification("Please connect your wallet first.", true);
      return;
    }
    try {
      showNotification(`Joining group ${params.groupAddress.substring(0, 8)}...`);
      const txHash = await contractService.joinGroup(params.groupAddress, params.bufferAmount);
      
      // If user also wants to stake voucher
      if (params.voucherAddress && params.voucherStake && parseFloat(params.voucherStake) > 0) {
        await contractService.stakeVoucher(params.voucherAddress, params.voucherStake);
      }

      setActiveGroupAddress(params.groupAddress);
      showNotification(`Joined successfully! Tx: ${txHash.substring(0, 10)}...`);
      refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.reason || err.message || "Failed to join group", true);
    }
  };

  // Handler: Commit Bid
  const handleCommitBid = async (commitmentHash: string) => {
    if (!contractService || !activeGroupAddress) {
      showNotification("Please select an active group.", true);
      return;
    }
    try {
      showNotification("Committing secret bid to smart contract...");
      const txHash = await contractService.commitBid(activeGroupAddress, commitmentHash);
      showNotification(`Bid committed! Tx: ${txHash.substring(0, 10)}...`);
      refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.reason || err.message || "Commit failed", true);
    }
  };

  // Handler: Reveal Bid
  const handleRevealBid = async (bidAmount: string, salt: string) => {
    if (!contractService || !activeGroupAddress) {
      showNotification("Please select an active group.", true);
      return;
    }
    try {
      showNotification("Revealing bid on smart contract...");
      const txHash = await contractService.revealBid(activeGroupAddress, bidAmount, salt);
      showNotification(`Bid revealed! Tx: ${txHash.substring(0, 10)}...`);
      refreshData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.reason || err.message || "Reveal failed", true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-neutral-100">
      <Header
        account={account}
        balance={balance}
        isConnecting={isConnecting}
        isCorrectNetwork={isCorrectNetwork}
        onConnect={connectWallet}
        onSwitchNetwork={switchToMSTTestnet}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-10 py-8 space-y-8">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-3 bg-[#0e0e0e] border ${
              notification.isError ? "border-royal-500 text-royal-200" : "border-neutral-800 text-white"
            }`}
          >
            {notification.isError ? (
              <AlertCircle className="w-5 h-5 text-royal-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-neutral-300" />
            )}
            {notification.message}
          </div>
        )}

        {/* Hero & Group Selector */}
        <div className="bg-[#0e0e0e] rounded-xl p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-5">
          <div className="flex items-center gap-2">
            <span className="badge">MST Testnet (Chain ID 91562037)</span>
            {groupDetails && (
              <span className="badge">
                Phase: {groupDetails.currentState}
              </span>
            )}
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
            Autonomous Community Chit Funds
          </h2>
          
          <p className="text-sm text-neutral-400 max-w-2xl">
            Zero-foreman ROSCA protocol with on-chain solvency verification, 5-tier default waterfall, and AI risk advisory.
          </p>

          {/* Active Contract Address Input */}
          <div className="w-full max-w-lg flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Enter active ChitGroup contract address (0x...)"
              value={activeGroupAddress}
              onChange={(e) => setActiveGroupAddress(e.target.value.trim())}
              className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-xs font-mono focus:outline-none placeholder:text-neutral-600"
            />
            {activeGroupAddress && (
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="btn-secondary px-3"
                title="Refresh on-chain state"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="btn-secondary"
            >
              <UserPlus className="w-4 h-4" />
              Join Group
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create Group
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-3 border-b border-neutral-900 pb-4">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "dashboard"
                ? "bg-royal-600 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Member Dashboard
          </button>
          <button
            onClick={() => setActiveTab("auction")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "auction"
                ? "bg-royal-600 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Reverse Auction
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "ledger"
                ? "bg-royal-600 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Audit Ledger
          </button>
        </div>

        {/* View 1: Member Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <MemberDashboard
              account={account}
              bufferBalance={memberDetails?.bufferBalance || "0.00"}
              lockedDividends={memberDetails?.lockedDividends || "0.00"}
              voucherStake={"0.00"}
              paidInstallments={memberDetails?.paidInstallments || 0}
              totalRounds={groupDetails?.memberCount || 0}
              currentRound={groupDetails?.currentRound || 0}
              hasWon={memberDetails?.hasWon || false}
              solvencyStatus={
                memberDetails?.solvency || {
                  isSolvent: true,
                  totalBacking: "0.00",
                  requiredBacking: "0.00",
                  safetyFactorBps: groupDetails?.safetyFactorBps || 12000,
                }
              }
              onDepositBuffer={async (amt) => {
                if (!contractService || !activeGroupAddress) {
                  showNotification("Please specify an active group address first.", true);
                  return;
                }
                try {
                  showNotification(`Depositing ${amt} tMSTC buffer...`);
                  await contractService.joinGroup(activeGroupAddress, amt);
                  showNotification("Collateral buffer deposited successfully!");
                  refreshData();
                } catch (err: any) {
                  showNotification(err.reason || err.message || "Deposit failed", true);
                }
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <LedgerView events={ledgerEvents} />
              </div>
              <div>
                <RiskAdvisorCard
                  memberAddress={account || undefined}
                  suggestedMultiplier={riskAdvisory?.suggestedCollateralMultiplier}
                  defaultProbability={riskAdvisory?.defaultProbability}
                  riskTier={riskAdvisory?.riskTier}
                  advisoryNote={riskAdvisory?.advisoryNote}
                />
              </div>
            </div>
          </div>
        )}

        {/* View 2: Reverse Auction */}
        {activeTab === "auction" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <AuctionBidding
                currentRound={groupDetails?.currentRound || 0}
                totalPot={groupDetails ? (groupDetails.memberCount * parseFloat(groupDetails.installmentAmount)).toFixed(2) : "0.00"}
                minBidAllowed={groupDetails?.minBid || "0.00"}
                phase={groupDetails?.currentState || "Commit"}
                onCommitBid={handleCommitBid}
                onRevealBid={handleRevealBid}
              />
            </div>
            <div>
              <RiskAdvisorCard
                memberAddress={account || undefined}
                suggestedMultiplier={riskAdvisory?.suggestedCollateralMultiplier}
                defaultProbability={riskAdvisory?.defaultProbability}
                riskTier={riskAdvisory?.riskTier}
                advisoryNote={riskAdvisory?.advisoryNote}
              />
            </div>
          </div>
        )}

        {/* View 3: Audit Ledger */}
        {activeTab === "ledger" && <LedgerView events={ledgerEvents} />}
      </main>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
      />

      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSubmit={handleJoinGroup}
      />
    </div>
  );
}

export default App;
