import React, { useState } from "react";
import { Header } from "./components/Header";
import { MemberDashboard } from "./components/MemberDashboard";
import { AuctionBidding } from "./components/AuctionBidding";
import { RiskAdvisorCard } from "./components/RiskAdvisorCard";
import { LedgerView } from "./components/LedgerView";
import { CreateGroupModal } from "./components/CreateGroupModal";
import { JoinGroupModal } from "./components/JoinGroupModal";
import { useWallet } from "./hooks/useWallet";
import { Plus, UserPlus, Shield, CheckCircle2 } from "lucide-react";

export function App() {
  const {
    account,
    balance,
    isConnecting,
    isCorrectNetwork,
    connectWallet,
    switchToMSTTestnet,
  } = useWallet();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "auction" | "ledger">("dashboard");

  // Active Group state (clean initial state, no hardcoded demo values)
  const [activeGroup, setActiveGroup] = useState<{
    name: string;
    address: string;
    phase: "Forming" | "Collect" | "Commit" | "Reveal" | "Settle" | "Closed";
    round: number;
    totalRounds: number;
    installmentAmount: string;
    totalPot: string;
    minBid: string;
    bufferBalance: string;
    lockedDividends: string;
    voucherStake: string;
  } | null>(null);

  const [committedBid, setCommittedBid] = useState<string | null>(null);
  const [revealedBid, setRevealedBid] = useState<{ amount: string; salt: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
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
        {/* Notification Alert */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white shadow-2xl text-sm font-semibold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-royal-400" />
            {notification}
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-[#0e0e0e] rounded-xl p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="badge">MST Blockchain Testnet</span>
            {activeGroup && (
              <span className="badge">Phase: {activeGroup.phase}</span>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
            Autonomous Community Chit Funds
          </h2>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Zero-foreman decentralized ROSCA protocol with on-chain solvency verification, social vouching, and AI risk advisory.
          </p>
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

        {/* Views */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <MemberDashboard
              account={account}
              bufferBalance={activeGroup?.bufferBalance || "0.00"}
              lockedDividends={activeGroup?.lockedDividends || "0.00"}
              voucherStake={activeGroup?.voucherStake || "0.00"}
              paidInstallments={activeGroup?.round || 0}
              totalRounds={activeGroup?.totalRounds || 0}
              currentRound={activeGroup?.round || 0}
              hasWon={false}
              solvencyStatus={{
                isSolvent: true,
                totalBacking: activeGroup
                  ? (
                      parseFloat(activeGroup.bufferBalance || "0") +
                      parseFloat(activeGroup.lockedDividends || "0") +
                      parseFloat(activeGroup.voucherStake || "0")
                    ).toFixed(2)
                  : "0.00",
                requiredBacking: activeGroup
                  ? (
                      parseFloat(activeGroup.installmentAmount || "0") *
                      (activeGroup.totalRounds - activeGroup.round) *
                      1.2
                    ).toFixed(2)
                  : "0.00",
                safetyFactorBps: 12000,
              }}
              onDepositBuffer={(amt) => {
                if (activeGroup) {
                  const newBal = (parseFloat(activeGroup.bufferBalance) + parseFloat(amt)).toFixed(2);
                  setActiveGroup({ ...activeGroup, bufferBalance: newBal });
                }
                showNotification(`Deposited ${amt} tMSTC into Collateral Buffer.`);
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <LedgerView events={[]} />
              </div>
              <div>
                <RiskAdvisorCard
                  memberAddress={account || undefined}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "auction" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <AuctionBidding
                currentRound={activeGroup?.round || 0}
                totalPot={activeGroup?.totalPot || "0.00"}
                minBidAllowed={activeGroup?.minBid || "0.00"}
                phase={activeGroup?.phase || "Commit"}
                hasCommitted={!!committedBid}
                hasRevealed={!!revealedBid}
                onCommitBid={(hash) => {
                  setCommittedBid(hash);
                  showNotification(`Bid commitment submitted: ${hash.substring(0, 10)}...`);
                }}
                onRevealBid={(amt, salt) => {
                  setRevealedBid({ amount: amt, salt });
                  showNotification(`Bid revealed: ${amt} tMSTC.`);
                }}
              />
            </div>
            <div>
              <RiskAdvisorCard
                memberAddress={account || undefined}
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
          setActiveGroup({
            name: params.groupName,
            address: "Pending Deployment",
            phase: "Forming",
            round: 0,
            totalRounds: params.memberCount,
            installmentAmount: params.installmentAmount,
            totalPot: (parseFloat(params.installmentAmount) * params.memberCount).toFixed(2),
            minBid: (
              parseFloat(params.installmentAmount) *
              params.memberCount *
              (1 - params.discountCapBps / 10000)
            ).toFixed(2),
            bufferBalance: "0.00",
            lockedDividends: "0.00",
            voucherStake: "0.00",
          });
          showNotification(`Group "${params.groupName}" deployed!`);
        }}
      />

      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSubmit={(params) => {
          setActiveGroup({
            name: `Group ${params.groupAddress.substring(0, 6)}`,
            address: params.groupAddress,
            phase: "Forming",
            round: 0,
            totalRounds: 5,
            installmentAmount: "0.00",
            totalPot: "0.00",
            minBid: "0.00",
            bufferBalance: params.bufferAmount,
            lockedDividends: "0.00",
            voucherStake: params.voucherStake || "0.00",
          });
          showNotification(`Joined group with ${params.bufferAmount} tMSTC collateral buffer.`);
        }}
      />
    </div>
  );
}
export default App;
