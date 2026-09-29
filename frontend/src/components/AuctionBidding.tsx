import React, { useState, useEffect } from "react";
import { Sparkles, Clock, CheckCircle2, ArrowRight, Gift, Trophy, HelpCircle, Code2, AlertCircle } from "lucide-react";
import { formatINR, inrToMST, MST_TO_INR_RATE, formatRawINR } from "../utils/formatters";
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
  totalPot = "2.5",
  minBidAllowed = "1.75",
  phase = "Commit",
  hasCommitted = false,
  hasRevealed = false,
  hasWonPreviously = false,
  isTechnicalMode,
  groupDetails,
  onCommitBid,
  onRevealBid,
  onSettleRound,
}) => {
  const potFloat = parseFloat(totalPot) || 2.5;
  const minBidFloat = parseFloat(minBidAllowed) || potFloat * 0.7;

  const maxPotINR = Math.round(potFloat * MST_TO_INR_RATE);
  const minPotINR = Math.round(minBidFloat * MST_TO_INR_RATE);

  // Slider value in INR
  const [requestedPayoutINR, setRequestedPayoutINR] = useState<number>(Math.round(maxPotINR * 0.92));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRequestedPayoutINR(Math.round(maxPotINR * 0.92));
  }, [maxPotINR]);

  const discountOfferedINR = maxPotINR - requestedPayoutINR;
  const memberSavingsShareINR = Math.round(discountOfferedINR / (groupDetails?.memberCount || 5));

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. DRAW STATUS & CELEBRATION HEADER */}
      <div className="cred-hero-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              MONTH {currentRound} DRAW
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              This Month's Savings Pot
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg leading-relaxed">
              Every month, one member receives the full community pot early. If you need funds this month, place your early payout request below.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-center sm:text-right min-w-[200px]">
            <p className="text-xs text-slate-400 font-medium">Total Pool Value</p>
            <p className="text-3xl font-extrabold text-emerald-400 font-display tracking-tight mt-0.5">
              {formatRawINR(maxPotINR)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Funded by all {groupDetails?.memberCount || 5} members
            </p>
          </div>
        </div>

        {/* Friendly Countdown */}
        <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white font-display">
              Draw results announced shortly
            </span>
          </div>
          <span className="text-slate-400">
            {phase === "Reveal" ? "Revealing verified requests..." : "Accepting early payout requests"}
          </span>
        </div>
      </div>

      {/* 2. EARLY PAYOUT REQUEST SLIDER CARD */}
      {!hasWonPreviously ? (
        <div className="cred-card p-6 sm:p-7 border-white/5 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-400" />
              Request Early Payout
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              If you'd like the money early this month, how much less would you accept? The member who accepts the lowest payout wins the pot, and the difference is shared as savings dividends with everyone.
            </p>
          </div>

          <form onSubmit={handleRequestPayout} className="space-y-6">
            {/* Slider & Visual Calculation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Your Requested Payout:</span>
                <span className="text-2xl font-bold text-white font-display text-emerald-400">
                  {formatRawINR(requestedPayoutINR)}
                </span>
              </div>

              <input
                type="range"
                min={minPotINR}
                max={maxPotINR}
                step={500}
                value={requestedPayoutINR}
                onChange={(e) => setRequestedPayoutINR(parseInt(e.target.value))}
                className="w-full"
                disabled={hasCommitted || phase !== "Commit"}
              />

              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Min: {formatRawINR(minPotINR)}</span>
                <span>Max: {formatRawINR(maxPotINR)}</span>
              </div>
            </div>

            {/* Impact Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Discount Shared with Circle</p>
                <p className="text-lg font-bold text-indigo-400 font-display mt-0.5">
                  {formatRawINR(discountOfferedINR)}
                </p>
                <p className="text-[10px] text-slate-500">Increases your chance of winning</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Savings Returned to Each Member</p>
                <p className="text-lg font-bold text-purple-400 font-display mt-0.5">
                  ~{formatRawINR(memberSavingsShareINR)}
                </p>
                <p className="text-[10px] text-slate-500">Credited to everyone's savings</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Encrypted on MST blockchain — nobody can see your request until the draw.</span>
              </div>

              <div className="flex items-center gap-3">
                {phase === "Reveal" && !hasRevealed && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-cred-primary text-xs"
                  >
                    {isSubmitting ? "Revealing..." : "Confirm & Reveal My Draw"}
                  </button>
                )}

                {phase === "Commit" && (
                  <button
                    type="submit"
                    disabled={hasCommitted || isSubmitting}
                    className="btn-cred-primary text-xs"
                  >
                    {hasCommitted
                      ? "Request Submitted ✓"
                      : isSubmitting
                      ? "Submitting..."
                      : "Submit Early Payout Request"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {(phase === "Reveal" || phase === "Settle") && (
                  <button
                    type="button"
                    onClick={onSettleRound}
                    className="btn-cred-secondary text-xs"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    Finalize Draw Results
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="cred-card p-6 border-white/5 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-display">
            You have already received your early payout in Month {groupDetails?.currentRound || 1}!
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You will continue to earn monthly savings dividends while contributing your standard monthly payment until the circle finishes.
          </p>
        </div>
      )}

      {/* 3. OPT-IN TECHNICAL DETAILS (FOR JUDGES & EVALUATORS) */}
      {isTechnicalMode && (
        <div className="tech-details-box text-xs space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-indigo-500/20">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-indigo-400" />
              Reverse Auction Cryptographic Mechanics
            </span>
            <span className="text-[10px] font-mono text-indigo-300">Commit-Reveal Protocol</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="text-slate-400">Current Phase State</p>
              <p className="font-mono text-emerald-400 uppercase">{phase}</p>
            </div>
            <div>
              <p className="text-slate-400">Discount Floor</p>
              <p className="font-mono text-slate-200">
                {minBidAllowed} tMSTC ({groupDetails?.discountCapBps || 3000} BPS max cap)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
