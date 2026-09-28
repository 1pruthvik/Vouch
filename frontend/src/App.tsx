import React, { useState } from "react";
import { Header } from "./components/Header";
import { MemberDashboard } from "./components/MemberDashboard";
import { AuctionBidding } from "./components/AuctionBidding";
import { RiskAdvisorCard } from "./components/RiskAdvisorCard";
import { LedgerView } from "./components/LedgerView";
import { CreateGroupModal } from "./components/CreateGroupModal";
import { JoinGroupModal } from "./components/JoinGroupModal";
import { useWallet } from "./hooks/useWallet";
import { Plus, UserPlus, Users, Shield, ArrowRight, Activity } from "lucide-react";

export function App() {
  const {
    account,
    chainId,
    balance,
    isConnecting,
    isCorrectNetwork,
    connectWallet,
    switchToMSTTestnet,
  } = useWallet();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "auction" | "ledger">("dashboard");

  // Simulated active group state
  const [currentGroup, setCurrentGroup] = useState({
    name: "Alpha Circle #1",
    address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    phase: "Commit" as "Forming" | "Collect" | "Commit" | "Reveal" | "Settle" | "Closed",
    round: 2,
    totalRounds: 5,
    installmentAmount: "0.5",
    totalPot: "2.5",
    minBid: "1.75",
    memberCount: 5,
    bufferBalance: "0.50",
    lockedDividends: "0.08",
    voucherStake: "0.25",
  });

  const [committedBid, setCommittedBid] = useState<string | null>(null);
  const [revealedBid, setRevealedBid] = useState<{ amount: string; salt: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        account={account}
        balance={balance}
        isConnecting={isConnecting}
        isCorrectNetwork={isCorrectNetwork}
        onConnect={connectWallet}
        onSwitchNetwork={switchToMSTTestnet}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 border border-indigo-400 text-sm font-semibold flex items-center gap-2 animate-bounce">
            <Activity className="w-4 h-4" />
            {toastMessage}
          </div>
        )}

        {/* Hero / Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border-indigo-500/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-indigo text-xs">MST Blockchain Testnet</span>
              <span className="badge badge-warning text-xs">Phase: {currentGroup.phase}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white font-display">
              Autonomous Community Chit Funds
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Zero-foreman ROSCAs with on-chain solvency verification, social vouching, and AI risk advisory.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              Join Group
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create Group
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Member Dashboard
          </button>
          <button
            onClick={() => setActiveTab("auction")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "auction"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Reverse Auction
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "ledger"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Audit Ledger
          </button>
        </div>

        {/* View Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <MemberDashboard
              account={account}
              bufferBalance={currentGroup.bufferBalance}
              lockedDividends={currentGroup.lockedDividends}
              voucherStake={currentGroup.voucherStake}
              paidInstallments={currentGroup.round}
              totalRounds={currentGroup.totalRounds}
              currentRound={currentGroup.round}
              hasWon={false}
              solvencyStatus={{
                isSolvent: true,
                totalBacking: (
                  parseFloat(currentGroup.bufferBalance) +
                  parseFloat(currentGroup.lockedDividends) +
                  parseFloat(currentGroup.voucherStake)
                ).toFixed(2),
                requiredBacking: (
                  parseFloat(currentGroup.installmentAmount) *
                  (currentGroup.totalRounds - currentGroup.round) *
                  1.2
                ).toFixed(2),
                safetyFactorBps: 12000,
              }}
              onDepositBuffer={(amt) => {
                const newBal = (parseFloat(currentGroup.bufferBalance) + parseFloat(amt)).toFixed(2);
                setCurrentGroup((prev) => ({ ...prev, bufferBalance: newBal }));
                showToast(`Deposited +${amt} tMSTC into Layer 1 Collateral Buffer!`);
              }}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LedgerView events={[]} />
              </div>
              <div>
                <RiskAdvisorCard
                  memberAddress={account || "0x00...00"}
                  suggestedMultiplier={1.25}
                  defaultProbability={0.18}
                  riskTier="Low Risk (Tier 1)"
                  advisoryNote="Good payment streak detected. Standard buffer deposit is adequate."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "auction" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AuctionBidding
                currentRound={currentGroup.round}
                totalPot={currentGroup.totalPot}
                minBidAllowed={currentGroup.minBid}
                phase={currentGroup.phase as any}
                hasCommitted={!!committedBid}
                hasRevealed={!!revealedBid}
                onCommitBid={(hash) => {
                  setCommittedBid(hash);
                  showToast(`Secret bid commitment submitted: ${hash.substring(0, 12)}...`);
                }}
                onRevealBid={(amt, salt) => {
                  setRevealedBid({ amount: amt, salt });
                  showToast(`Bid revealed: ${amt} tMSTC (Salt verified)`);
                }}
              />
            </div>
            <div>
              <RiskAdvisorCard
                memberAddress={account || "0x00...00"}
                suggestedMultiplier={1.4}
                defaultProbability={0.32}
                riskTier="Moderate Risk (Tier 2)"
                advisoryNote="Early bidder profile. AI model recommends maintaining 1.4x collateral buffer if pot is won."
              />
            </div>
          </div>
        )}

        {activeTab === "ledger" && <LedgerView events={[]} />}
      </main>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(params) => {
          showToast(`Group "${params.groupName}" deployment transaction initiated!`);
        }}
      />

      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSubmit={(params) => {
          showToast(`Joined Chit Group ${params.groupAddress.substring(0, 8)}... with ${params.bufferAmount} tMSTC buffer!`);
        }}
      />
    </div>
  );
}
export default App;

