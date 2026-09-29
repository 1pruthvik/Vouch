import React, { useState, useEffect } from "react";
import { Sparkles, Clock, CheckCircle2, ArrowRight, Gift, Trophy, Code2 } from "lucide-react";
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

  // Slider value in INR
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
      <div className="content-card text-center py-12 px-6 space-y-3">
        <div className="w-12 h-12 rounded-xl bg-[#141414] text-royal-400 flex items-center justify-center mx-auto">
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
      {/* 1. DRAW STATUS HEADER */}
      <div className="content-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#141414] text-xs font-semibold text-royal-400 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              ROUND {currentRound} DRAW
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Round Savings Pot
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-lg leading-relaxed">
              Every round, members can request the pooled funds early via reverse auction discount bidding.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-black text-center sm:text-right min-w-[200px]">
            <p className="text-xs text-neutral-400 font-medium">Total Pool Value</p>
            <p className="text-3xl font-extrabold text-white font-display tracking-tight mt-0.5">
              {formatRawINR(maxPotINR)}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1 font-mono">
              {potFloat} tMSTC ({groupDetails.memberCount} members)
            </p>
          </div>
        </div>

        {/* Phase Indicator */}
        <div className="pt-4 border-t border-neutral-900 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-royal-400" />
            <span className="font-semibold text-white font-display">
              Phase: {phase}
            </span>
          </div>
          <span className="text-neutral-400 font-mono">
            {phase === "Commit" && "Secret bid commitment open"}
            {phase === "Reveal" && "Bid reveal phase active"}
            {phase === "Collect" && "Collecting member installments"}
            {phase === "Settle" && "Round ready for settlement"}
            {phase === "Forming" && "Waiting for members to join"}
            {phase === "Closed" && "Group closed"}
          </span>
        </div>
      </div>

      {/* 2. EARLY PAYOUT REQUEST SLIDER CARD */}
      {!hasWonPreviously ? (
        <div className="content-card space-y-6">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Gift className="w-4 h-4 text-royal-400" />
              Request Early Payout
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Select the payout amount you are willing to accept. The lowest requested payout wins the pot, and the discount difference is distributed as dividends to all members.
            </p>
          </div>

          <form onSubmit={handleRequestPayout} className="space-y-6">
            {/* Slider & Visual Calculation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-400">Requested Payout:</span>
                <span className="text-2xl font-bold text-white font-display">
                  {formatRawINR(requestedPayoutINR)}
                </span>
              </div>

              <input
                type="range"
                min={minPotINR}
                max={maxPotINR}
                step={100}
                value={requestedPayoutINR}
                onChange={(e) => setRequestedPayoutINR(parseInt(e.target.value))}
                className="w-full"
                disabled={hasCommitted || (phase !== "Commit" && phase !== "Reveal")}
              />

              <div className="flex justify-between text-[11px] text-neutral-500 font-medium font-mono">
                <span>Min: {formatRawINR(minPotINR)}</span>
                <span>Max: {formatRawINR(maxPotINR)}</span>
              </div>
            </div>

            {/* Impact Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg bg-black">
              <div>
                <p className="text-[11px] text-neutral-400 font-medium">Discount Shared with Group</p>
                <p className="text-lg font-bold text-white font-display mt-0.5">
                  {formatRawINR(discountOfferedINR)}
                </p>
                <p className="text-[10px] text-neutral-500">Increases chance of winning draw</p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-400 font-medium">Dividend per Member</p>
                <p className="text-lg font-bold text-white font-display mt-0.5">
                  ~{formatRawINR(memberSavingsShareINR)}
                </p>
                <p className="text-[10px] text-neutral-500">Credited to everyone's savings</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-royal-400 flex-shrink-0" />
                <span>Encrypted on MST blockchain commit-reveal protocol.</span>
              </div>

              <div className="flex items-center gap-3">
                {phase === "Reveal" && !hasRevealed && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? "Revealing..." : "Confirm & Reveal Bid"}
                  </button>
                )}

                {phase === "Commit" && (
                  <button
                    type="submit"
                    disabled={hasCommitted || isSubmitting}
                    className="btn-primary"
                  >
                    {hasCommitted
                      ? "Bid Committed ✓"
                      : isSubmitting
                      ? "Submitting..."
                      : "Submit Payout Request"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {(phase === "Reveal" || phase === "Settle") && (
                  <button
                    type="button"
                    onClick={onSettleRound}
                    className="btn-secondary"
                  >
                    <Trophy className="w-3.5 h-3.5 text-royal-400" />
                    Settle Round
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="content-card text-center py-8 space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#141414] text-royal-400 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-display">
            You received your payout in Round {groupDetails.currentRound}!
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            You will continue contributing standard monthly installments while earning dividends on subsequent rounds until the circle finishes.
          </p>
        </div>
      )}

      {/* 3. OPT-IN TECHNICAL DETAILS */}
      {isTechnicalMode && (
        <div className="tech-details-box text-xs space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
            <span className="font-bold text-neutral-200 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-royal-400" />
              Reverse Auction Cryptographic Mechanics
            </span>
            <span className="text-[10px] font-mono text-neutral-400">Commit-Reveal Protocol</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="text-neutral-500">Current Phase State</p>
              <p className="font-mono text-royal-400 uppercase">{phase}</p>
            </div>
            <div>
              <p className="text-neutral-500">Discount Floor</p>
              <p className="font-mono text-neutral-300">
                {minBidAllowed} tMSTC ({groupDetails?.discountCapBps || 3000} BPS max cap)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
