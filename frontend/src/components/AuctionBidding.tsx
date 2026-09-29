import React, { useState } from "react";
import { Gavel, Key, CheckCircle, Clock } from "lucide-react";
import { ethers } from "ethers";

interface AuctionBiddingProps {
  currentRound?: number;
  totalPot?: string;
  minBidAllowed?: string;
  phase?: "Commit" | "Reveal" | "Collect" | "Settle" | "Forming" | "Closed";
  hasCommitted?: boolean;
  hasRevealed?: boolean;
  onCommitBid?: (commitmentHash: string) => void;
  onRevealBid?: (bidAmount: string, salt: string) => void;
}

export const AuctionBidding: React.FC<AuctionBiddingProps> = ({
  currentRound = 0,
  totalPot = "0.00",
  minBidAllowed = "0.00",
  phase = "Commit",
  hasCommitted = false,
  hasRevealed = false,
  onCommitBid,
  onRevealBid,
}) => {
  const [bidAmount, setBidAmount] = useState("");
  const [salt, setSalt] = useState("");

  const handleGenerateCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidAmount) return;
    const generatedSalt = salt || ethers.hexlify(ethers.randomBytes(32));
    const hash = ethers.keccak256(
      ethers.toUtf8Bytes(`${bidAmount}-${generatedSalt}`)
    );
    if (onCommitBid) {
      onCommitBid(hash);
    }
  };

  const handleReveal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidAmount || !salt) return;
    if (onRevealBid) {
      onRevealBid(bidAmount, salt);
    }
  };

  return (
    <div className="bg-[#0e0e0e] rounded-xl p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-neutral-300" />
          <h2 className="text-lg font-bold text-white font-display">
            Reverse Auction {currentRound > 0 ? `(Round ${currentRound})` : ""}
          </h2>
        </div>
        <span className="badge">
          Phase: {phase}
        </span>
      </div>

      <div className="p-6 rounded-xl bg-black flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
        <div>
          <p className="text-xs text-neutral-400">Total Round Pot</p>
          <p className="text-2xl font-bold text-white font-display mt-1">{totalPot} tMSTC</p>
        </div>
        <div className="hidden sm:block w-px h-10 bg-neutral-800" />
        <div>
          <p className="text-xs text-neutral-400">Discount Floor (Min Allowed Bid)</p>
          <p className="text-2xl font-bold text-white font-display mt-1">{minBidAllowed} tMSTC</p>
        </div>
      </div>

      {phase === "Commit" && (
        <form onSubmit={handleGenerateCommitment} className="space-y-4 max-w-lg mx-auto text-left">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Your Secret Bid Payout (tMSTC)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Bid Amount"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
              required
            />
            <p className="text-xs text-neutral-400 mt-1">
              Lowest payout bid wins the pot. The discount is distributed to other members.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Secret Salt (Optional - auto-generated if left blank)
            </label>
            <input
              type="text"
              placeholder="Hex salt or secret phrase"
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm font-mono focus:outline-none placeholder:text-neutral-700"
            />
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={hasCommitted}
              className="btn-primary"
            >
              <Key className="w-4 h-4" />
              {hasCommitted ? "Commitment Submitted" : "Commit Secret Bid"}
            </button>
          </div>
        </form>
      )}

      {phase === "Reveal" && (
        <form onSubmit={handleReveal} className="space-y-4 max-w-lg mx-auto text-left">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Reveal Bid Amount (tMSTC)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Bid Amount"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Secret Salt
            </label>
            <input
              type="text"
              placeholder="Enter the exact salt used during commit"
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm font-mono focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={hasRevealed}
              className="btn-primary"
            >
              <CheckCircle className="w-4 h-4" />
              {hasRevealed ? "Bid Revealed" : "Reveal Bid"}
            </button>
          </div>
        </form>
      )}

      {phase !== "Commit" && phase !== "Reveal" && (
        <div className="text-center py-10 text-neutral-400 text-sm flex flex-col items-center justify-center gap-2">
          <Clock className="w-8 h-8 text-neutral-500" />
          <p>Auction is awaiting the next cycle transition ({phase}).</p>
        </div>
      )}
    </div>
  );
};
