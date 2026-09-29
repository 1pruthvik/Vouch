import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Trophy, Code2 } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { GroupDetails } from "../services/contractService";

interface AuctionBiddingProps {
  currentRound: number;
  totalPot: string;
  minBidAllowed: string;
  phase: "Commit" | "Reveal" | "Collect" | "Settle" | "Forming" | "Closed";
  hasCommitted: boolean;
  hasRevealed: boolean;
  hasWonPreviously: boolean;
  isTechnicalMode: boolean;
  groupDetails: GroupDetails | null;
  onCommitBid: (bidAmountMST: string) => Promise<void>;
  onRevealBid: (bidAmountMST: string) => Promise<void>;
  onSettleRound: () => Promise<void>;
}

export const AuctionBidding: React.FC<AuctionBiddingProps> = ({
  currentRound = 1,
  totalPot = "0",
  minBidAllowed = "0",
  phase = "Forming",
  hasCommitted = false,
  hasRevealed = false,
  hasWonPreviously = false,
  isTechnicalMode,
  groupDetails,
  onCommitBid,
  onRevealBid,
  onSettleRound,
}) => {
  const potFloat = parseFloat(totalPot) || 0;
  const minBidFloat = parseFloat(minBidAllowed) || (potFloat > 0 ? potFloat * 0.7 : 0);

  const maxPotINR = Math.round(potFloat * MST_TO_INR_RATE);
  const minPotINR = Math.round(minBidFloat * MST_TO_INR_RATE);

  const [requestedPayoutINR, setRequestedPayoutINR] = useState<number>(maxPotINR);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRequestedPayoutINR(maxPotINR > 0 ? Math.round(maxPotINR * 0.95) : 0);
  }, [maxPotINR]);

  const discountOfferedINR = Math.max(0, maxPotINR - requestedPayoutINR);
  const memberCount = groupDetails?.memberCount || 1;
  const memberSavingsShareINR = memberCount > 0 ? Math.round(discountOfferedINR / memberCount) : 0;

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const bidAmountMST = (requestedPayoutINR / MST_TO_INR_RATE).toFixed(4);
      if (phase === "Commit") {
        await onCommitBid(bidAmountMST);
      } else if (phase === "Reveal") {
        await onRevealBid(bidAmountMST);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!groupDetails || potFloat === 0) {
    return (
      <div className="text-center py-12 px-6 space-y-3">
        <div className="w-12 h-12 text-red-500 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white font-display">No Active Round Draw</h3>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Reverse auction bidding will open automatically when all member contributions for the round are collected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Draw Header ── */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              ROUND {currentRound} DRAW
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
              Round Savings Pot
            </h2>
            <p className="text-sm text-neutral-400 mt-1 max-w-lg leading-relaxed">
              Request your payout below via reverse auction discount bidding.
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Total Round Pot</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-bold text-white font-display">
                {formatRawINR(maxPotINR)}
              </span>
              <span className="text-xs text-neutral-400 font-mono">({totalPot} tMSTC)</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-red-400 font-semibold">Phase: {phase}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bidding / Settlement Section ── */}
      {hasWonPreviously ? (
        <div className="text-center py-8 space-y-2">
          <Trophy className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">Draw Payout Already Received</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            You received the round pot in a prior cycle. Continue contributing monthly to earn draw discounts.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleRequestPayout} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-300">Requested Payout</span>
                <span className="text-xl font-bold text-white font-display">
                  {formatRawINR(requestedPayoutINR)}
                </span>
              </div>

              <input
                type="range"
                min={minPotINR}
                max={maxPotINR}
                step={100}
                value={requestedPayoutINR}
                onChange={(e) => setRequestedPayoutINR(Number(e.target.value))}
                className="w-full h-2 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-red-600"
              />

              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span>Min: {formatRawINR(minPotINR)}</span>
                <span>Max: {formatRawINR(maxPotINR)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-neutral-950 rounded-lg">
                <p className="text-neutral-500">Discount Offered</p>
                <p className="text-base font-bold text-white font-display mt-0.5">{formatRawINR(discountOfferedINR)}</p>
              </div>
              <div className="p-3 bg-neutral-950 rounded-lg">
                <p className="text-neutral-500">Member Dividend Share</p>
                <p className="text-base font-bold text-red-400 font-display mt-0.5">{formatRawINR(memberSavingsShareINR)}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (phase !== "Commit" && phase !== "Reveal")}
              className="btn-primary w-full py-3"
            >
              {isSubmitting
                ? "Submitting..."
                : phase === "Commit"
                ? `Commit Secret Bid (${formatRawINR(requestedPayoutINR)})`
                : phase === "Reveal"
                ? `Reveal Bid (${formatRawINR(requestedPayoutINR)})`
                : `Bidding Opens in Commit Phase`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {phase === "Settle" && (
            <button
              onClick={onSettleRound}
              className="btn-secondary w-full py-3 text-xs text-red-400"
            >
              Settle Round & Distribute Dividends
            </button>
          )}
        </div>
      )}

      {/* ── Technical Details ── */}
      {isTechnicalMode && (
        <div className="text-xs space-y-2 pt-4">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-400">
            <Code2 className="w-3.5 h-3.5 text-red-500" />
            Reverse Auction Mechanics
          </div>
          <p className="text-neutral-500 font-mono text-[11px]">
            Lowest payout requested wins the round. The difference between full pot and winning bid is distributed equally as locked dividends to all other solvent members.
          </p>
        </div>
      )}
    </div>
  );
};
