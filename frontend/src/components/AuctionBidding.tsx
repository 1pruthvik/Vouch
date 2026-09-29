import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowRight,
  Gift,
  Trophy,
  Code2,
  Coins,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
  Wallet
} from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { GroupDetails, MemberDetails } from "../services/contractService";

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
  memberDetails?: MemberDetails | null;
  onCommitBid: (bidAmountMST: string) => Promise<void>;
  onRevealBid: (bidAmountMST: string) => Promise<void>;
  onSettleRound: () => Promise<void>;
}

export const AuctionBidding: React.FC<AuctionBiddingProps> = ({
  currentRound = 5,
  totalPot = "500",
  minBidAllowed = "350",
  phase = "Commit",
  hasCommitted = false,
  hasRevealed = false,
  hasWonPreviously = false,
  isTechnicalMode,
  groupDetails,
  memberDetails,
  onCommitBid,
  onRevealBid,
  onSettleRound,
}) => {
  const potFloat = parseFloat(totalPot) || 500;
  const minBidFloat = parseFloat(minBidAllowed) || 350;

  // Real financial INR values for Community 07 (₹5,00,000 pool)
  const maxPotINR = groupDetails
    ? Math.round(parseFloat(groupDetails.installmentAmount) * (groupDetails.memberCount || 20) * MST_TO_INR_RATE)
    : 500000;
  const minPotINR = Math.round(maxPotINR * 0.7); // 30% discount cap floor

  const [requestedPayoutINR, setRequestedPayoutINR] = useState<number>(Math.round(maxPotINR * 0.95));
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const discountOfferedINR = Math.max(0, maxPotINR - requestedPayoutINR);
  const memberCount = groupDetails?.memberCount || 20;
  const dividendPerMemberINR = memberCount > 0 ? Math.round(discountOfferedINR / memberCount) : 0;
  const discountPercent = Math.round((discountOfferedINR / maxPotINR) * 100);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmSubmission = async () => {
    try {
      setIsSubmitting(true);
      const bidAmountMST = (requestedPayoutINR / MST_TO_INR_RATE).toFixed(4);
      if (phase === "Commit") {
        await onCommitBid(bidAmountMST);
      } else if (phase === "Reveal") {
        await onRevealBid(bidAmountMST);
      }
      setShowConfirmModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 anim-fade-up">
      {/* ── DRAW HERO HEADER ── */}
      <div className="v-card-hero p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="v-badge v-badge-green text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Month {currentRound} Draw · October 2026
              </span>
              <span className="v-badge v-badge-amber text-xs">
                Confidential Reverse Auction
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-display tracking-tight">
              How much would you accept to receive the pool early?
            </h1>
            <p className="text-xs sm:text-sm text-[#9ca3b4] max-w-xl leading-relaxed">
              Every month, all member contributions create a single full pool.
              Submit a bid representing the payout amount you are willing to receive.
              The member who offers the most attractive discount to the community receives the early payout.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center sm:text-right min-w-[220px]">
            <p className="text-xs text-[#9ca3b4] font-medium">Total Month {currentRound} Pool</p>
            <p className="text-3xl sm:text-4xl font-bold text-[#2dd4a8] font-display mt-1 tracking-tight">
              {formatRawINR(maxPotINR)}
            </p>
            <p className="text-[11px] text-[#5f6578] mt-1">
              Funded by {memberCount} verified members
            </p>
          </div>
        </div>

        {/* Phase status */}
        <div className="mt-6 pt-5 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#f5a623]" />
            <span className="font-semibold text-white font-display">
              Bidding Phase: {phase === "Commit" ? "Secret Bids Open" : phase}
            </span>
          </div>
          <span className="text-[#9ca3b4]">
            Commit deadline: 10 October, 2026 · 11:59 PM IST
          </span>
        </div>
      </div>

      {/* ── CLEAN BIDDING SLIDER & EXPLANATION ── */}
      {!hasWonPreviously ? (
        <div className="v-card p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#f5a623]" />
              Configure Your Early Payout Request
            </h3>
            <p className="text-xs sm:text-sm text-[#9ca3b4] mt-1 leading-relaxed">
              Use the slider below to set your requested payout.
              Offering a higher discount leaves more surplus to be distributed back to other members as dividend savings.
            </p>
          </div>

          <form onSubmit={handleOpenConfirm} className="space-y-6">
            {/* Value Display */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-1">
              <p className="text-xs text-[#5f6578] font-medium uppercase tracking-wider">
                Requested Payout Amount
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold text-white font-display tracking-tight text-[#2dd4a8]">
                {formatRawINR(requestedPayoutINR)}
              </h2>
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="v-badge v-badge-amber text-xs">
                  Discount Offered: {formatRawINR(discountOfferedINR)} ({discountPercent}%)
                </span>
                <span className="v-badge v-badge-green text-xs">
                  +{formatRawINR(dividendPerMemberINR)} / member dividend
                </span>
              </div>
            </div>

            {/* Range Slider */}
            <div className="space-y-3">
              <input
                type="range"
                min={minPotINR}
                max={maxPotINR}
                step={2500}
                value={requestedPayoutINR}
                onChange={(e) => setRequestedPayoutINR(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-white/10 appearance-none cursor-pointer accent-[#2dd4a8]"
              />

              <div className="flex justify-between items-center text-xs text-[#5f6578]">
                <div className="text-left">
                  <p className="font-bold text-white">{formatRawINR(minPotINR)}</p>
                  <p className="text-[10px] text-[#2dd4a8]">Higher Discount · More Attractive to Pool</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{formatRawINR(maxPotINR)}</p>
                  <p className="text-[10px] text-[#9ca3b4]">Lower Discount · Less Attractive</p>
                </div>
              </div>
            </div>

            {/* Submission CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#9ca3b4]">
                <span>🔒 Your bid is cryptographically sealed during the commit phase.</span>
              </div>

              <button
                type="submit"
                className="v-btn-primary w-full sm:w-auto"
              >
                Review & Submit Bid
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="v-card p-6 sm:p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-[#f5a623] flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-display">
            You Won in an Earlier Round!
          </h3>
          <p className="text-xs text-[#9ca3b4] max-w-md mx-auto">
            You received the early payout in Month {memberDetails?.winRound || 1}.
            Per the deterministic pool rules, members may win only once per 12-month cycle while continuing their monthly contributions.
          </p>
        </div>
      )}

      {/* ── PROGRESSIVE DISCLOSURE: SEE HOW THIS WORKS ── */}
      <div className="v-card p-5 sm:p-6">
        <div
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] text-[#2dd4a8] flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-display">
                See How The Reverse Auction & Settlement Works
              </h4>
              <p className="text-xs text-[#9ca3b4] mt-0.5">
                Understand deterministic winning selection, commit-reveal sealing, and surplus distribution.
              </p>
            </div>
          </div>
          <button className="p-2 rounded-xl text-[#5f6578] bg-white/[0.04]">
            {showHowItWorks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showHowItWorks && (
          <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-3 text-xs text-[#9ca3b4] leading-relaxed anim-fade-up">
            <p>
              1. <strong>Sealed Commitment:</strong> During the Commit phase, your bid is hashed with a secret salt (`keccak256(amount, salt)`) on MST Testnet. Other members cannot front-run or copy your bid.
            </p>
            <p>
              2. <strong>Transparent Reveal:</strong> Once the deadline passes, all bids are revealed and verified deterministically by the smart contract.
            </p>
            <p>
              3. <strong>Fair Payout & Dividend:</strong> The highest discount bid is awarded the pool immediately. The discounted difference (surplus) is credited back to all members, effectively lowering their next month's dues.
            </p>
          </div>
        )}
      </div>

      {/* ── CONFIRMATION SUMMARY MODAL BEFORE WALLET COMMIT ── */}
      {showConfirmModal && (
        <div className="v-overlay">
          <div className="v-modal p-6 sm:p-7 max-w-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#2dd4a8]" />
                <h3 className="text-base font-bold text-white font-display">Confirm Bid Submission</h3>
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="text-[#5f6578] hover:text-white">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#5f6578]">Requested Early Payout:</span>
                <span className="font-bold text-white font-display text-sm">{formatRawINR(requestedPayoutINR)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5f6578]">Total Pool Value:</span>
                <span className="text-white">{formatRawINR(maxPotINR)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5f6578]">Discount Offered to Pool:</span>
                <span className="font-bold text-[#f5a623]">{formatRawINR(discountOfferedINR)} ({discountPercent}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5f6578]">Community Dividend Generated:</span>
                <span className="text-[#2dd4a8]">+{formatRawINR(dividendPerMemberINR)} / member</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/[0.04]">
                <span className="text-[#5f6578]">Rules Applied:</span>
                <span className="text-white">Deterministic Smart Contract</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="v-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmission}
                disabled={isSubmitting}
                className="v-btn-primary text-xs"
              >
                <Wallet className="w-3.5 h-3.5" />
                {isSubmitting ? "Signing on Chain..." : "Sign with BridgeKey"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
