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
    <div className="space-y-5 anim-fade-up">
      {/* ── DRAW HEADER ── */}
      <div className="v-card-hero p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="v-badge v-badge-green mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              MONTH {currentRound} DRAW
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
              This Month's Savings Pot
            </h2>
            <p className="text-sm text-[#9ca3b4] mt-2 max-w-lg leading-relaxed">
              One member receives the full pot early each month. Request your payout below if you need funds now.
            </p>
          </div>

          <div className="p-5 rounded-2xl text-center sm:text-right min-w-[200px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs text-[#9ca3b4] font-medium">Total Pool Value</p>
            <p className="text-3xl font-bold font-display tracking-tight mt-1" style={{ color: '#2dd4a8' }}>
              {formatRawINR(maxPotINR)}
            </p>
            <p className="text-[11px] text-[#5f6578] mt-1">
              Funded by all {groupDetails?.memberCount || 5} members
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className="mt-6 pt-5 flex flex-wrap items-center justify-between gap-3 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#f5a623]" />
            <span className="font-semibold text-white font-display">
              Draw results announced shortly
            </span>
          </div>
          <span className="text-[#5f6578]">
            {phase === "Reveal" ? "Revealing verified requests..." : "Accepting early payout requests"}
          </span>
        </div>
      </div>

      {/* ── EARLY PAYOUT REQUEST ── */}
      {!hasWonPreviously ? (
        <div className="v-card p-6 sm:p-7 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#f5a623]" />
              Request Early Payout
            </h3>
            <p className="text-sm text-[#9ca3b4] mt-1 leading-relaxed">
              How much less would you accept? The member offering the best discount wins the pot — the rest is shared as savings dividends.
            </p>
          </div>

          <form onSubmit={handleRequestPayout} className="space-y-6">
            {/* Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9ca3b4] font-medium">Your Requested Payout</span>
                <span className="text-2xl font-bold text-white font-display" style={{ color: '#2dd4a8' }}>
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

              <div className="flex justify-between text-[11px] text-[#5f6578] font-medium">
                <span>Min: {formatRawINR(minPotINR)}</span>
                <span>Full: {formatRawINR(maxPotINR)}</span>
              </div>
            </div>

            {/* Impact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.12)' }}>
                <p className="text-[11px] text-[#9ca3b4] font-medium">Discount Shared with Circle</p>
                <p className="text-xl font-bold font-display mt-1" style={{ color: '#8b5cf6' }}>
                  {formatRawINR(discountOfferedINR)}
                </p>
                <p className="text-[10px] text-[#5f6578] mt-0.5">Increases your chance of winning</p>
              </div>
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(245, 166, 35, 0.06)', border: '1px solid rgba(245, 166, 35, 0.12)' }}>
                <p className="text-[11px] text-[#9ca3b4] font-medium">Each Member Earns</p>
                <p className="text-xl font-bold font-display mt-1" style={{ color: '#f5a623' }}>
                  ~{formatRawINR(memberSavingsShareINR)}
                </p>
                <p className="text-[10px] text-[#5f6578] mt-0.5">Added to everyone's savings</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-[#9ca3b4]">
                <CheckCircle2 className="w-4 h-4 text-[#2dd4a8] flex-shrink-0" />
                <span>Encrypted on blockchain — nobody sees your request until the draw.</span>
              </div>

              <div className="flex items-center gap-3">
                {phase === "Reveal" && !hasRevealed && (
                  <button type="submit" disabled={isSubmitting} className="v-btn-primary text-sm">
                    {isSubmitting ? "Revealing..." : "Confirm & Reveal"}
                  </button>
                )}

                {phase === "Commit" && (
                  <button
                    type="submit"
                    disabled={hasCommitted || isSubmitting}
                    className="v-btn-primary text-sm"
                  >
                    {hasCommitted ? "Request Submitted ✓" : isSubmitting ? "Submitting..." : "Submit Request"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {(phase === "Reveal" || phase === "Settle") && (
                  <button type="button" onClick={onSettleRound} className="v-btn-secondary text-sm">
                    <Trophy className="w-3.5 h-3.5 text-[#f5a623]" />
                    Finalize Draw
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="v-card p-8 text-center space-y-3 anim-scale-in">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(245, 166, 35, 0.1)' }}>
            <Trophy className="w-7 h-7 text-[#f5a623]" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">
            You've already received your early payout!
          </h3>
          <p className="text-sm text-[#9ca3b4] max-w-md mx-auto">
            You'll continue earning monthly savings dividends while contributing your standard payment until the circle finishes.
          </p>
        </div>
      )}

      {/* ── TECHNICAL DETAILS ── */}
      {isTechnicalMode && (
        <div className="v-tech-box text-xs space-y-2.5 anim-fade-up">
          <div className="flex items-center justify-between pb-1.5" style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.15)' }}>
            <span className="font-bold text-[#8b5cf6] flex items-center gap-1.5">
              <Code2 className="w-4 h-4" />
              Reverse Auction Cryptographic Mechanics
            </span>
            <span className="text-[10px] font-mono text-[#8b5cf6]/80">Commit-Reveal Protocol</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="text-[#5f6578]">Current Phase State</p>
              <p className="font-mono text-[#2dd4a8] uppercase">{phase}</p>
            </div>
            <div>
              <p className="text-[#5f6578]">Discount Floor</p>
              <p className="font-mono text-[#9ca3b4]">
                {minBidAllowed} tMSTC ({groupDetails?.discountCapBps || 3000} BPS max cap)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
