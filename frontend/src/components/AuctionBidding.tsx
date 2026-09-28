import React, { useState } from "react";
import { Gavel, Key, CheckCircle, Clock } from "lucide-react";
import { ethers } from "ethers";

interface AuctionBiddingProps {
  currentRound: number;
  totalPot: string;
  minBidAllowed: string;
  phase: "Commit" | "Reveal" | "Collect" | "Settle";
  hasCommitted: boolean;
  hasRevealed: boolean;
  onCommitBid: (commitmentHash: string) => void;
  onRevealBid: (bidAmount: string, salt: string) => void;
}

export const AuctionBidding: React.FC<AuctionBiddingProps> = ({
  currentRound = 1,
  totalPot = "2.5",
  minBidAllowed = "1.75",
  phase = "Commit",
  hasCommitted = false,
  hasRevealed = false,
  onCommitBid,
  onRevealBid,
}) => {
  const [bidAmount, setBidAmount] = useState(minBidAllowed);
  const [salt, setSalt] = useState("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");

  const handleGenerateCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    // keccak256 hash simulation
    const hash = ethers.keccak256(
      ethers.toUtf8Bytes(`${bidAmount}-${salt}`)
    );
    onCommitBid(hash);
  };

  const handleReveal = (e: React.FormEvent) => {
    e.preventDefault();
    onRevealBid(bidAmount, salt);
  };

  return (
    <div className="glass-card p-6 border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white font-display">Reverse Auction (Round {currentRound})</h2>
        </div>
        <span className="badge badge-warning">
          Phase: {phase}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Total Round Pot</p>
          <p className="text-xl font-bold text-white font-display">{totalPot} tMSTC</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Discount Floor (Min Bid)</p>
          <p className="text-xl font-bold text-indigo-400 font-display">{minBidAllowed} tMSTC</p>
        </div>
      </div>

      {phase === "Commit" && (
        <form onSubmit={handleGenerateCommitment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Your Secret Bid Payout (tMSTC)
            </label>
            <input
              type="text"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Lowest bid wins the pot. The discount is shared as dividends.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={hasCommitted}
              className="btn-primary text-sm"
            >
              <Key className="w-4 h-4" />
              {hasCommitted ? "Commitment Submitted" : "Commit Secret Bid"}
            </button>
          </div>
        </form>
      )}

      {phase === "Reveal" && (
        <form onSubmit={handleReveal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reveal Bid Amount (tMSTC)
            </label>
            <input
              type="text"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={hasRevealed}
              className="btn-primary text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              {hasRevealed ? "Bid Revealed" : "Reveal Bid"}
            </button>
          </div>
        </form>
      )}

      {phase !== "Commit" && phase !== "Reveal" && (
        <div className="text-center py-8 text-slate-400 text-sm">
          <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          Auction is currently awaiting next cycle transition ({phase}).
        </div>
      )}
    </div>
  );
};
