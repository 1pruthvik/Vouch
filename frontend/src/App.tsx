import React, { useState } from "react";
import { Header } from "./components/Header";
import { MemberDashboard } from "./components/MemberDashboard";
import { AuctionBidding } from "./components/AuctionBidding";
import { RiskAdvisorCard } from "./components/RiskAdvisorCard";
import { LedgerView } from "./components/LedgerView";
import { CreateGroupModal } from "./components/CreateGroupModal";
import { useWallet } from "./hooks/useWallet";
import { Plus, Users, Shield, ArrowRight } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"dashboard" | "auction" | "ledger">("dashboard");

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
        {/* Hero / Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border-indigo-500/20">
          <div>
            <h2 className="text-2xl font-extrabold text-white font-display">
              Autonomous Community Chit Funds
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Zero-foreman ROSCAs with on-chain solvency verification, social vouching, and AI risk advisory.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary text-sm"
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
              bufferBalance="0.5"
              lockedDividends="0.08"
              paidInstallments={2}
              totalRounds={5}
              currentRound={3}
              hasWon={false}
              solvencyStatus={{
                isSolvent: true,
                totalBacking: "0.58",
                requiredBacking: "0.30",
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
                currentRound={1}
                totalPot="2.5"
                minBidAllowed="1.75"
                phase="Commit"
                hasCommitted={false}
                hasRevealed={false}
                onCommitBid={(hash) => alert(`Committed hash: ${hash}`)}
                onRevealBid={(amt, salt) => alert(`Revealed: ${amt} tMSTC with salt ${salt}`)}
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
        onSubmit={(params) => console.log("Create group params:", params)}
      />
    </div>
  );
}
export default App;
