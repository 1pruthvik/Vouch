import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowRight,
  Gift,
  Trophy,
  HelpCircle,
  Code2,
  AlertCircle,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  KeyRound,
  FileCheck2,
} from "lucide-react";
import gsap from "gsap";
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

  const containerRef = useRef<HTMLDivElement>(null);
  const stateCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRequestedPayoutINR(Math.round(maxPotINR * 0.92));
  }, [maxPotINR]);

  // Entrance GSAP animation
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
      );
    });

    return () => ctx.revert();
  }, [phase]);

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

  // State Machine Step Progress Map
  const getStepStatus = (step: "Commit" | "Locked" | "Reveal" | "Settle") => {
    if (step === "Commit") {
      if (phase === "Commit" && !hasCommitted) return "active";
      if (hasCommitted || phase !== "Commit") return "completed";
      return "pending";
    }
    if (step === "Locked") {
      if (hasCommitted && phase === "Commit") return "active";
      if (phase === "Reveal" || phase === "Settle" || phase === "Closed") return "completed";
      return "pending";
    }
    if (step === "Reveal") {
      if (phase === "Reveal" && !hasRevealed) return "active";
      if (hasRevealed || phase === "Settle" || phase === "Closed") return "completed";
      return "pending";
    }
    if (step === "Settle") {
      if (phase === "Settle" || phase === "Closed") return "completed";
      return "pending";
    }
    return "pending";
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* 1. STATE MACHINE TIMELINE HEADER */}
      <div className="fintech-card p-5 sm:p-6 border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cryptographic Commit-Reveal Auction Process
            </h3>
            <p className="text-sm font-semibold text-white font-display mt-0.5">
              Current Status: <span className="text-emerald-400 uppercase">{phase} Phase</span>
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Zero Collusion Invariant
          </span>
        </div>

        {/* 4-Step Visual Progression Flow */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {/* Step 1: Commit */}
          <div className={`p-3 rounded-xl border transition-all ${
            getStepStatus("Commit") === "active"
              ? "bg-emerald-500/10 border-emerald-500/30 text-white"
              : getStepStatus("Commit") === "completed"
              ? "bg-slate-900/80 border-white/10 text-slate-300"
              : "bg-slate-900/40 border-white/5 text-slate-500"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className={`w-3.5 h-3.5 ${getStepStatus("Commit") === "active" ? "text-emerald-400" : "text-slate-400"}`} />
              <span className="text-[11px] font-bold">1. Secret Commit</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {hasCommitted ? "✓ Hash Anchored" : "Submit hashed bid"}
            </p>
          </div>

          {/* Step 2: Locked */}
          <div className={`p-3 rounded-xl border transition-all ${
            getStepStatus("Locked") === "active"
              ? "bg-indigo-500/10 border-indigo-500/30 text-white"
              : getStepStatus("Locked") === "completed"
              ? "bg-slate-900/80 border-white/10 text-slate-300"
              : "bg-slate-900/40 border-white/5 text-slate-500"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Lock className={`w-3.5 h-3.5 ${getStepStatus("Locked") === "active" ? "text-indigo-400" : "text-slate-400"}`} />
              <span className="text-[11px] font-bold">2. Sealed Period</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Bids hidden from all peers
            </p>
          </div>

          {/* Step 3: Reveal */}
          <div className={`p-3 rounded-xl border transition-all ${
            getStepStatus("Reveal") === "active"
              ? "bg-amber-500/10 border-amber-500/30 text-white"
              : getStepStatus("Reveal") === "completed"
              ? "bg-slate-900/80 border-white/10 text-slate-300"
              : "bg-slate-900/40 border-white/5 text-slate-500"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Unlock className={`w-3.5 h-3.5 ${getStepStatus("Reveal") === "active" ? "text-amber-400" : "text-slate-400"}`} />
              <span className="text-[11px] font-bold">3. Public Reveal</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {hasRevealed ? "✓ Verified on-chain" : "Verify plaintext bid"}
            </p>
          </div>

          {/* Step 4: Settle */}
          <div className={`p-3 rounded-xl border transition-all ${
            getStepStatus("Settle") === "completed"
              ? "bg-emerald-500/10 border-emerald-500/30 text-white"
              : "bg-slate-900/40 border-white/5 text-slate-500"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <FileCheck2 className={`w-3.5 h-3.5 ${getStepStatus("Settle") === "completed" ? "text-emerald-400" : "text-slate-400"}`} />
              <span className="text-[11px] font-bold">4. Pot Payout</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Winner & dividends credited
            </p>
          </div>
        </div>
      </div>

      {/* 2. HERO CARD — Pool Value & Draw Form */}
      <div className="fintech-hero-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              MONTH {currentRound} SAVINGS DRAW
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              This Month's Available Pot
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg leading-relaxed">
              Every cycle, one member receives the full community pot early. If you need liquidity this month, place your early payout request below.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-center sm:text-right min-w-[220px]">
            <p className="text-xs text-slate-400 font-medium">Total Pool Value</p>
            <p className="text-3xl font-extrabold text-emerald-400 font-display tracking-tight tabular-nums mt-0.5">
              {formatRawINR(maxPotINR)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Funded by all {groupDetails?.memberCount || 5} members
            </p>
          </div>
        </div>

        {/* 3. INTERACTIVE BIDDING FORM */}
        <div className="mt-8 pt-6 border-t border-white/[0.07] space-y-6">
          {hasWonPreviously ? (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-display">You have already won an earlier draw</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  You received your pot in Round {groupDetails?.currentRound || 1}. Continue making monthly installments to support your remaining peers!
                </p>
              </div>
            </div>
          ) : phase === "Commit" && hasCommitted ? (
            <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white font-display">Your Secret Bid is Anchored on MST Blockchain</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Your bid commitment hash has been recorded. When the Commit phase completes, return here to execute the 1-click reveal.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-mono">
                Status: Awaiting Reveal Window
              </div>
            </div>
          ) : phase === "Reveal" && hasRevealed ? (
            <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white font-display">Bid Revealed & Cryptographically Verified</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Your plaintext bid matches your initial hash commitment. Settlement will automatically distribute the winning pot and discount dividends.
                </p>
              </div>
              <button onClick={onSettleRound} className="btn-fintech-primary text-xs px-4 py-2">
                Trigger Settlement →
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestPayout} className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="payout-slider" className="font-semibold text-slate-300">
                    Desired Early Payout Amount:
                  </label>
                  <span className="text-emerald-400 font-bold font-display text-base tabular-nums">
                    {formatRawINR(requestedPayoutINR)}
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  id="payout-slider"
                  type="range"
                  min={minPotINR}
                  max={maxPotINR}
                  step={500}
                  value={requestedPayoutINR}
                  onChange={(e) => setRequestedPayoutINR(Number(e.target.value))}
                  className="w-full"
                />

                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Min Allowed: {formatRawINR(minPotINR)} (Floor 30%)</span>
                  <span>Max Pot: {formatRawINR(maxPotINR)} (0% Discount)</span>
                </div>
              </div>

              {/* Real-time Economic Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-900/80 border border-white/5 text-xs">
                <div className="space-y-0.5">
                  <p className="text-slate-400 font-medium">Discount Offered to Circle:</p>
                  <p className="text-sm font-bold text-amber-400 tabular-nums">
                    {formatRawINR(discountOfferedINR)} ({((discountOfferedINR / maxPotINR) * 100).toFixed(1)}%)
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-400 font-medium">Each Peer's Dividend Savings:</p>
                  <p className="text-sm font-bold text-emerald-400 tabular-nums">
                    +{formatRawINR(memberSavingsShareINR)} / member
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-fintech-primary w-full py-3.5 text-sm"
              >
                {isSubmitting ? (
                  "Submitting on Blockchain..."
                ) : phase === "Commit" ? (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Securely Commit Request ({formatRawINR(requestedPayoutINR)}) →
                  </>
                ) : phase === "Reveal" ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    Reveal & Verify Bid ({formatRawINR(requestedPayoutINR)}) →
                  </>
                ) : (
                  "Place Bid"
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 4. TECHNICAL DETAILS CALLOUT (Opt-in) */}
      {isTechnicalMode && (
        <div className="tech-details-box text-xs space-y-1.5">
          <p className="font-bold text-indigo-300 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            Cryptographic Commit Hash Formula
          </p>
          <p className="font-mono text-[11px] text-slate-300 break-all">
            keccak256(abi.encodePacked(bidAmount, salt, msg.sender))
          </p>
          <p className="text-[11px] text-slate-400">
            Prevents front-running and MEV by withholding bid amounts until the commitment deadline.
          </p>
        </div>
      )}
    </div>
  );
};
