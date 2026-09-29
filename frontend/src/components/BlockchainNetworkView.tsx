import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Layers,
  Coins,
  Gavel,
  CheckCircle2,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Send,
  Zap,
} from "lucide-react";

export interface MemberNode {
  id: string;
  name: string;
  address: string;
  blockNumber: number;
  hash: string;
  stakedCollateral: string;
  monthlyDues: string;
  hasPaidThisMonth: boolean;
  paidTxHash?: string;
  paidTimestamp?: string;
  color: string;
  isCurrentUser?: boolean;
}

export interface BidBlock {
  id: string;
  roundNumber: number;
  blockNumber: number;
  bidderId: string;
  bidderName: string;
  bidderAddress: string;
  bidAmount: number; // e.g. 4.2 tMSTC (in reverse auction, lower payout requested = better bid for group)
  dividendSavings: number; // e.g. 5.0 - 4.2 = 0.8 tMSTC
  timestamp: string;
  isCurrentBest: boolean;
  isNew: boolean; // Triggers the 3-time blink
}

const INITIAL_MEMBERS: MemberNode[] = [
  {
    id: "m-1",
    name: "Alice",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    blockNumber: 10421,
    hash: "0x8fa1...9b2a",
    stakedCollateral: "1.50 tMSTC",
    monthlyDues: "1.00",
    hasPaidThisMonth: false,
    color: "#6366f1",
  },
  {
    id: "m-2",
    name: "Bob",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    blockNumber: 10422,
    hash: "0x72c4...e13d",
    stakedCollateral: "1.50 tMSTC",
    monthlyDues: "1.00",
    hasPaidThisMonth: false,
    color: "#8b5cf6",
  },
  {
    id: "m-3",
    name: "Charlie",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    blockNumber: 10423,
    hash: "0x33e8...6ca2",
    stakedCollateral: "1.50 tMSTC",
    monthlyDues: "1.00",
    hasPaidThisMonth: false,
    color: "#ec4899",
  },
  {
    id: "m-4",
    name: "Dave",
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    blockNumber: 10424,
    hash: "0x4b91...71ef",
    stakedCollateral: "1.50 tMSTC",
    monthlyDues: "1.00",
    hasPaidThisMonth: false,
    color: "#10b981",
  },
  {
    id: "m-5",
    name: "You (Pruthvik)",
    address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    blockNumber: 10425,
    hash: "0x1c80...a47f",
    stakedCollateral: "1.50 tMSTC",
    monthlyDues: "1.00",
    hasPaidThisMonth: false,
    color: "#06b6d4",
    isCurrentUser: true,
  },
];

export interface BlockchainNetworkViewProps {
  currentAccount?: string | null;
  groupDetails?: any;
  onCommitBid?: (bidAmountMST: string) => Promise<void>;
}

export const BlockchainNetworkView: React.FC<BlockchainNetworkViewProps> = ({
  currentAccount,
  groupDetails,
  onCommitBid,
}) => {
  const [members, setMembers] = useState<MemberNode[]>(INITIAL_MEMBERS);
  const [currentRound, setCurrentRound] = useState<number>(3);
  const targetPot = 5.0; // 5 members * 1.0 tMSTC

  // Bids state
  const [bids, setBids] = useState<BidBlock[]>([]);
  const [customBidderId, setCustomBidderId] = useState<string>("m-1");
  const [customBidAmount, setCustomBidAmount] = useState<string>("4.80");
  const [isSimulatingAuction, setIsSimulatingAuction] = useState<boolean>(false);
  const [isSimulatingPayments, setIsSimulatingPayments] = useState<boolean>(false);
  const [biddingPhaseActive, setBiddingPhaseActive] = useState<boolean>(false);
  const [lastBlinkingId, setLastBlinkingId] = useState<string | null>(null);

  // Compute total pool accumulated
  const paidMembers = members.filter((m) => m.hasPaidThisMonth);
  const currentPoolAmount = paidMembers.length * 1.0;

  // Handle single member paying to the pool
  const handlePayMonthlyDues = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId && !m.hasPaidThisMonth) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const pseudoHash = "0x" + Math.random().toString(16).substring(2, 10) + "...mst";
          return {
            ...m,
            hasPaidThisMonth: true,
            paidTxHash: pseudoHash,
            paidTimestamp: timeStr,
          };
        }
        return m;
      })
    );
  };

  // Simulate all members paying into the pool sequentially
  const handleSimulateAllPayments = async () => {
    if (isSimulatingPayments) return;
    setIsSimulatingPayments(true);

    const unpaids = members.filter((m) => !m.hasPaidThisMonth);
    for (let i = 0; i < unpaids.length; i++) {
      const targetId = unpaids[i].id;
      await new Promise((res) => setTimeout(res, 600));
      handlePayMonthlyDues(targetId);
    }

    setIsSimulatingPayments(false);
    // Once full pool is funded, open bidding phase automatically
    setBiddingPhaseActive(true);
  };

  // Reset monthly pool and auction for demo
  const handleReset = () => {
    setMembers(
      INITIAL_MEMBERS.map((m) => ({
        ...m,
        hasPaidThisMonth: false,
        paidTxHash: undefined,
        paidTimestamp: undefined,
      }))
    );
    setBids([]);
    setLastBlinkingId(null);
    setBiddingPhaseActive(false);
  };

  // Submit a new bid
  const submitBid = (bidderId: string, amount: number) => {
    const bidder = members.find((m) => m.id === bidderId);
    if (!bidder) return;

    const newBidId = `bid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dividend = Number((targetPot - amount).toFixed(2));

    // In reverse auction, lower payout requested is better bid
    // Or if first bid, it's immediately the best
    setBids((prev) => {
      const isBetter = prev.length === 0 || amount < prev[0].bidAmount;

      const newBlock: BidBlock = {
        id: newBidId,
        roundNumber: currentRound,
        blockNumber: 10450 + prev.length + 1,
        bidderId: bidder.id,
        bidderName: bidder.name,
        bidderAddress: bidder.address,
        bidAmount: amount,
        dividendSavings: dividend,
        timestamp: timeStr,
        isCurrentBest: isBetter,
        isNew: true, // Will blink 3 times
      };

      // If this is a better bid, set all older bids to isCurrentBest: false
      const updatedPrev = isBetter
        ? prev.map((b) => ({ ...b, isCurrentBest: false, isNew: false }))
        : prev.map((b) => ({ ...b, isNew: false }));

      return [newBlock, ...updatedPrev];
    });

    setLastBlinkingId(newBidId);

    // Turn off the blink flag after 2.2 seconds (3 full blinks)
    setTimeout(() => {
      setBids((prev) =>
        prev.map((b) => (b.id === newBidId ? { ...b, isNew: false } : b))
      );
    }, 2200);
  };

  // Handle manual bid submit form
  const handleManualBid = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customBidAmount);
    if (isNaN(val) || val <= 0 || val > targetPot) {
      alert(`Please enter a valid bid between 0.1 and ${targetPot} tMSTC`);
      return;
    }
    submitBid(customBidderId, val);
  };

  // Run automated Bidding War demo: shows sequential bids, 3x blink, older shrinking, new better bid big
  const handleRunBiddingWarDemo = async () => {
    if (isSimulatingAuction) return;
    setIsSimulatingAuction(true);
    setBiddingPhaseActive(true);

    // Make sure pool is paid up first if not already
    if (currentPoolAmount < targetPot) {
      for (const m of members) {
        if (!m.hasPaidThisMonth) {
          handlePayMonthlyDues(m.id);
        }
      }
    }

    // Sequence of competing bids:
    // 1. Alice bids 4.80 tMSTC (spawns big, blinks 3 times)
    // 2. Bob bids 4.50 tMSTC (Alice's block shrinks, Bob's spawns big and blinks 3 times)
    // 3. Charlie bids 4.20 tMSTC (Bob's block shrinks, Charlie's spawns big and blinks 3 times)
    // 4. You bid 3.90 tMSTC (Charlie's shrinks, Your block spawns big and blinks 3 times)
    const demoSequence = [
      { bidderId: "m-1", amount: 4.80, delay: 500 },
      { bidderId: "m-2", amount: 4.50, delay: 2800 },
      { bidderId: "m-3", amount: 4.20, delay: 3000 },
      { bidderId: "m-5", amount: 3.90, delay: 3000 },
    ];

    for (const step of demoSequence) {
      await new Promise((r) => setTimeout(r, step.delay));
      submitBid(step.bidderId, step.amount);
    }

    setIsSimulatingAuction(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Instructions */}
      <div className="glass-card p-6 border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-indigo">DeFi Blockchain Peer Network</span>
              <span className="badge badge-success">Live ROSCA Cycle #{currentRound}</span>
            </div>
            <h2 className="text-2xl font-black text-white font-display tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-400" />
              Decentralized Peer-to-Peer Network & Monthly Pool
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              All participants operate as interconnected nodes on the MST blockchain mesh. Every cycle, members deposit their monthly installment into the dedicated Chit Pool Box. When reverse auction bidding begins, competing bid blocks dynamically scale and blink 3 times on arrival.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSimulateAllPayments}
              disabled={isSimulatingPayments || paidMembers.length === members.length}
              className="btn-secondary text-xs sm:text-sm py-2 px-3 border-indigo-500/40 hover:border-indigo-400"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              {isSimulatingPayments ? "Depositing..." : "Simulate All Pool Payments"}
            </button>
            <button
              onClick={handleRunBiddingWarDemo}
              disabled={isSimulatingAuction}
              className="btn-primary text-xs sm:text-sm py-2 px-3"
            >
              <Play className="w-4 h-4 fill-white" />
              {isSimulatingAuction ? "Auction In Progress..." : "Run Bidding War Demo"}
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-white/10"
              title="Reset Cycle & Bids"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: THE BLOCKCHAIN PEER NETWORK & SEPARATE MONTHLY POOL BOX */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Interconnected Blockchain Network (8 Columns) */}
        <div className="xl:col-span-8 glass-card p-6 border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white font-display">
                Interconnected Chit Fund Network ({members.length} Peer Blocks)
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Mesh Consensus Active</span>
            </div>
          </div>

          {/* Connected Network Graphic Lines (SVG Mesh) */}
          <div className="relative py-4">
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="netGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {/* Connecting lines across blocks */}
              <line x1="20%" y1="20%" x2="50%" y2="30%" stroke="url(#netGrad)" strokeWidth="2" className="network-dash-line" />
              <line x1="50%" y1="30%" x2="80%" y2="20%" stroke="url(#netGrad)" strokeWidth="2" className="network-dash-line" />
              <line x1="20%" y1="75%" x2="50%" y2="60%" stroke="url(#netGrad)" strokeWidth="2" className="network-dash-line" />
              <line x1="50%" y1="60%" x2="80%" y2="75%" stroke="url(#netGrad)" strokeWidth="2" className="network-dash-line" />
              <line x1="20%" y1="20%" x2="20%" y2="75%" stroke="url(#netGrad)" strokeWidth="1.5" className="network-dash-line" />
              <line x1="80%" y1="20%" x2="80%" y2="75%" stroke="url(#netGrad)" strokeWidth="1.5" className="network-dash-line" />
            </svg>

            {/* Network Peer Blocks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {members.map((member, idx) => {
                const isPaid = member.hasPaidThisMonth;
                return (
                  <div
                    key={member.id}
                    className={`rounded-2xl p-4 transition-all duration-300 border relative ${
                      isPaid
                        ? "bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                        : "bg-slate-900/60 border-indigo-500/20 hover:border-indigo-500/40"
                    } ${member.isCurrentUser ? "ring-1 ring-cyan-500/40" : ""}`}
                  >
                    {/* Block Header */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-300">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>BLOCK #{member.blockNumber}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{member.hash}</span>
                    </div>

                    {/* Member Profile */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: member.color }}
                          ></span>
                          <h4 className="font-bold text-white text-sm">{member.name}</h4>
                          {member.isCurrentUser && (
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                          {member.address.substring(0, 6)}...{member.address.substring(member.address.length - 4)}
                        </p>
                      </div>

                      <span className="badge badge-success text-[10px]">
                        <ShieldCheck className="w-3 h-3" />
                        Solvent
                      </span>
                    </div>

                    {/* Member Contribution Status & Name Tag */}
                    <div className="space-y-2 mt-3 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Monthly Dues:</span>
                        <span className="font-semibold text-slate-200">
                          {member.monthlyDues} tMSTC
                        </span>
                      </div>

                      {/* Visual Contribution Tag on the Block */}
                      <div
                        className={`rounded-lg p-2 text-xs flex items-center justify-between transition-all ${
                          isPaid
                            ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                            : "bg-slate-800/50 border border-amber-500/20 text-amber-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isPaid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-400" />
                          )}
                          <span className="font-semibold">
                            {isPaid ? `Paid: 1.00 tMSTC` : "Payment Due"}
                          </span>
                        </div>
                        {isPaid && (
                          <span className="text-[10px] text-emerald-400/80 font-mono">
                            {member.paidTimestamp}
                          </span>
                        )}
                      </div>

                      {/* Pay Action for Unpaid Members */}
                      {!isPaid && (
                        <button
                          onClick={() => handlePayMonthlyDues(member.id)}
                          className="w-full mt-2 py-1.5 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/60 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          Pay {member.monthlyDues} tMSTC to Pool
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: THE DEDICATED SEPARATE MONTHLY POOL BOX (4 Columns) */}
        <div className="xl:col-span-4 glass-card p-6 border-indigo-500/30 relative overflow-hidden pool-glow">
          {/* Subtle Ambient Background */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-extrabold text-white font-display">
                Monthly Pool Vault
              </h3>
            </div>
            <span className="badge badge-warning">Round {currentRound}</span>
          </div>

          {/* Accumulated Pool Display */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-500/30 mb-6 text-center">
            <p className="text-xs uppercase tracking-wider text-indigo-300 font-semibold mb-1">
              Total Accumulated Pool
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-black text-white font-display tracking-tight">
                {currentPoolAmount.toFixed(2)}
              </span>
              <span className="text-lg font-bold text-amber-400">tMSTC</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-300">
              <span>Goal: {targetPot.toFixed(2)} tMSTC</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">
                {paidMembers.length}/{members.length} Members Paid
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 mt-3 overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(currentPoolAmount / targetPot) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Contributors Ledger Inside the Pool Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Pool Contributors This Month:</span>
              <span className="text-indigo-400">{paidMembers.length} Verified</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {paidMembers.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-white/10 rounded-xl">
                  <Clock className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                  Awaiting monthly contributions from members...
                </div>
              ) : (
                paidMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex items-center justify-between text-xs transition-all hover:border-emerald-500/40"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: member.color }}
                      ></div>
                      <div>
                        <p className="font-bold text-white leading-none">{member.name}</p>
                        <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                          {member.paidTxHash}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400">+1.00 tMSTC</span>
                      <p className="text-[10px] text-slate-400">{member.paidTimestamp}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Action for Current User */}
            {members.find((m) => m.isCurrentUser && !m.hasPaidThisMonth) && (
              <button
                onClick={() => {
                  const userMember = members.find((m) => m.isCurrentUser);
                  if (userMember) handlePayMonthlyDues(userMember.id);
                }}
                className="w-full mt-4 btn-primary text-xs justify-center py-2.5"
              >
                <Coins className="w-4 h-4" />
                Pay My Monthly 1.00 tMSTC Now
              </button>
            )}

            {paidMembers.length === members.length && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                100% Pool Funded! Ready for Reverse Auction Bidding.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: LIVE BIDDING BLOCKS (BLINK 3 TIMES & DYNAMIC SIZING) */}
      <div className="glass-card p-6 border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white font-display flex items-center gap-2">
                Reverse Auction Bidding Stream
                <span className="badge badge-indigo text-xs">Live Blocks</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                New bids spawn as blocks and <strong className="text-amber-400">blink 3 times</strong>. When a better bid comes in, previous blocks shrink while the new better bid becomes big.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunBiddingWarDemo}
              disabled={isSimulatingAuction}
              className="btn-primary text-xs py-2 px-3"
            >
              <Sparkles className="w-4 h-4" />
              {isSimulatingAuction ? "Running War..." : "Trigger Bidding War Demo"}
            </button>
          </div>
        </div>

        {/* Bid Input Panel */}
        <form
          onSubmit={handleManualBid}
          className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex flex-wrap items-center gap-4 text-xs"
        >
          <div className="flex items-center gap-2">
            <label className="text-slate-400 font-semibold">Select Bidder:</label>
            <select
              value={customBidderId}
              onChange={(e) => setCustomBidderId(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:border-indigo-500"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.address.substring(0, 6)}...)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-400 font-semibold">
              Payout Bid (tMSTC):
            </label>
            <input
              type="number"
              step="0.05"
              min="1.0"
              max={targetPot}
              value={customBidAmount}
              onChange={(e) => setCustomBidAmount(e.target.value)}
              className="w-24 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
            <span className="text-slate-500">out of {targetPot.toFixed(2)} pot</span>
          </div>

          <button
            type="submit"
            className="btn-secondary text-xs py-1.5 px-4 ml-auto border-indigo-500/40 hover:border-indigo-400"
          >
            <Send className="w-3.5 h-3.5" />
            Place New Bid Block
          </button>
        </form>

        {/* Live Bidding Blocks Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Dynamic Bid Blocks Timeline:</span>
            <span>{bids.length} Bid Blocks Recorded</span>
          </div>

          {bids.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-dashed border-white/10 text-slate-400">
              <Gavel className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No bids submitted yet for this cycle.</p>
              <p className="text-xs text-slate-500 mt-1">
                Click <strong>"Run Bidding War Demo"</strong> or submit a bid above to watch the blocks spawn, blink 3 times, shrink, and expand!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bids.map((bid, index) => {
                const isBest = bid.isCurrentBest;
                const isBlinking = bid.isNew;

                return (
                  <div
                    key={bid.id}
                    className={`transition-all duration-500 rounded-2xl border ${
                      isBest
                        ? "p-6 bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border-amber-500/80 shadow-2xl shadow-amber-500/20 scale-[1.02]"
                        : "p-4 bg-slate-900/50 border-white/10 opacity-75 scale-[0.98] hover:opacity-100"
                    } ${isBlinking ? "bid-blink-3" : ""}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Left: Bidder Information & Block Tag */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white font-display text-sm ${
                            isBest ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          #{bids.length - index}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base font-display">
                              {bid.bidderName}
                            </span>
                            <span className="font-mono text-xs text-slate-400">
                              ({bid.bidderAddress.substring(0, 6)}...{bid.bidderAddress.substring(bid.bidderAddress.length - 4)})
                            </span>
                            {isBest ? (
                              <span className="badge badge-warning text-[10px] animate-pulse">
                                ★ Current Best Bid (Winning)
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                                Outbid
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="font-mono text-[11px] text-indigo-400">
                              BLOCK #{bid.blockNumber}
                            </span>
                            <span>•</span>
                            <span>{bid.timestamp}</span>
                            {isBlinking && (
                              <span className="text-amber-400 font-bold flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                                NEW BID (Blinking 3x)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Bid Details & Dividend Discount */}
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-medium">Payout Requested</p>
                          <p
                            className={`font-black font-display tracking-tight ${
                              isBest ? "text-2xl text-amber-300" : "text-lg text-slate-300"
                            }`}
                          >
                            {bid.bidAmount.toFixed(2)} <span className="text-xs font-normal text-slate-400">tMSTC</span>
                          </p>
                        </div>

                        <div className="text-right pl-4 border-l border-white/10">
                          <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 justify-end">
                            <TrendingDown className="w-3.5 h-3.5" />
                            Group Dividend
                          </p>
                          <p
                            className={`font-black font-display ${
                              isBest ? "text-xl text-emerald-400" : "text-base text-emerald-500/70"
                            }`}
                          >
                            +{bid.dividendSavings.toFixed(2)}{" "}
                            <span className="text-xs font-normal text-slate-400">tMSTC</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default BlockchainNetworkView;
