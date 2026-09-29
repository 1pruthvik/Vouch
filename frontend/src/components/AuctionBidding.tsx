import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowRight,
  Gift,
  Trophy,
  Code2,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  Info,
  Check,
} from "lucide-react";
import gsap from "gsap";
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
  const [submissionStep, setSubmissionStep] = useState<string | null>(null);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRequestedPayoutINR(maxPotINR > 0 ? Math.round(maxPotINR * 0.95) : 0);
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

  const discountOfferedINR = Math.max(0, maxPotINR - requestedPayoutINR);
  const memberCount = groupDetails?.memberCount || 1;
  const memberSavingsShareINR = memberCount > 0 ? Math.round(discountOfferedINR / memberCount) : 0;

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setSubmissionStep("Waiting for wallet confirmation...");
      const bidAmountMST = (requestedPayoutINR / MST_TO_INR_RATE).toFixed(4);

      if (phase === "Commit") {
        setSubmissionStep("Anchoring commitment hash on MST Blockchain...");
        await onCommitBid(bidAmountMST);
      } else if (phase === "Reveal") {
        setSubmissionStep("Submitting plaintext bid & salt for verification...");
        await onRevealBid(bidAmountMST);
      }
      setSubmissionStep("Confirmed on-chain!");
    } catch (err) {
      console.error(err);
      setSubmissionStep(null);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmissionStep(null);
      }, 1500);
    }
  };

  if (phase === "Forming") {
    return (
      <div ref={containerRef} className="v-card p-8 sm:p-10 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(245, 166, 35, 0.1)" }}>
          <Clock className="w-7 h-7 text-[#f5a623]" />
        </div>
        <h3 className="text-xl font-bold text-white font-display">Circle is Forming</h3>
        <p className="text-sm text-[#9ca3b4] max-w-md mx-auto">
          The savings auction opens once all {groupDetails?.memberCount || 5} members join and complete initial security deposits.
        </p>
      </div>
    );
  }

  if (phase === "Collect") {
    return (
      <div ref={containerRef} className="v-card p-8 sm:p-10 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(45, 212, 168, 0.1)" }}>
          <Clock className="w-7 h-7 text-[#2dd4a8]" />
        </div>
        <h3 className="text-xl font-bold text-white font-display">Round {currentRound} Collection Phase</h3>
        <p className="text-sm text-[#9ca3b4] max-w-md mx-auto">
          Reverse auction bidding will open automatically when all member contributions for the round are collected.
        </p>
      </div>
    );
  }

  // Visual Stepper Stages
  const steps = [
    { id: "Commit", label: "1. Secret Commit", active: phase === "Commit", done: phase === "Reveal" || phase === "Settle" || phase === "Closed" },
    { id: "Sealed", label: "2. Sealed On-Chain", active: phase === "Commit" && hasCommitted, done: phase === "Reveal" || phase === "Settle" || phase === "Closed" },
    { id: "Reveal", label: "3. Plaintext Reveal", active: phase === "Reveal", done: phase === "Settle" || phase === "Closed" },
    { id: "Verify", label: "4. Cryptographic Verify", active: phase === "Reveal" && hasRevealed, done: phase === "Settle" || phase === "Closed" },
    { id: "Settle", label: "5. Settle & Distribute", active: phase === "Settle", done: phase === "Closed" },
  ];

  return (
    <div ref={containerRef} className="space-y-6">
      {/* ── 5-STEP COMMIT-REVEAL STATE PROGRESSION STEPPER ── */}
      <div className="v-card p-4 sm:p-5 border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            Cryptographic Commit-Reveal Protocol
          </span>
          <button
            onClick={() => setIsExplainerOpen(!isExplainerOpen)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Why Commit-Reveal?
          </button>
        </div>

        {/* Stepper Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                step.active
                  ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-sm shadow-indigo-500/10"
                  : step.done
                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
                  : "bg-white/[0.02] border-white/5 text-slate-500"
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-semibold">
                {step.done ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                <span>{step.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Expandable Explainer */}
        {isExplainerOpen && (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-slate-300 space-y-1.5 anim-fade-in">
            <p className="font-semibold text-white">How Commit-Reveal Protects Your Bids:</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In a traditional reverse auction, late bidders can peek at existing bids and undercut you by ₹1.
              Vouch uses a 2-stage cryptographic scheme: during Commit, you submit only an encrypted hash
              <code> keccak256(bidAmount, salt, sender)</code>. Nobody (not even validators or peers) can see your bid
              until the Reveal period opens.
            </p>
          </div>
        )}
      </div>

      {/* ── DRAW HERO ── */}
      <div className="v-card-hero p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="v-badge v-badge-green mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              MONTH {currentRound} SAVINGS DRAW
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              This Month's Available Pot
            </h2>
            <p className="text-xs sm:text-sm text-[#9ca3b4] mt-1 max-w-lg leading-relaxed">
              Every cycle, one member receives the full community pot early. If you need liquidity this month, place your early payout request below.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-center sm:text-right min-w-[220px]">
            <p className="text-xs text-slate-400 font-medium">Total Pool Value</p>
            <p className="text-3xl font-extrabold text-emerald-400 font-display tracking-tight tabular-nums mt-0.5">
              {formatRawINR(maxPotINR)}
            </p>
            <p className="text-[11px] text-[#5f6578] mt-1">
              {potFloat} tMSTC ({groupDetails?.memberCount || 5} members)
            </p>
          </div>
        </div>

        {/* Phase / Countdown */}
        <div className="mt-6 pt-5 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#f5a623]" />
            <span className="font-semibold text-white font-display">
              Phase: {phase}
            </span>
          </div>
          <span className="text-[#9ca3b4]">
            {phase === "Commit" && "Secret payout request phase open"}
            {phase === "Reveal" && "Revealing verified requests..."}
            {phase === "Settle" && "Round ready for settlement"}
            {phase === "Closed" && "Circle closed"}
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

          {phase === "Commit" && hasCommitted ? (
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
              <button onClick={onSettleRound} className="v-btn-primary text-xs px-4 py-2">
                Trigger Settlement →
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestPayout} className="space-y-6">
              {/* Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9ca3b4] font-medium">Your Requested Payout</span>
                  <span className="text-2xl font-bold font-display text-emerald-400 tabular-nums">
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

                <div className="flex justify-between text-[11px] text-[#5f6578] font-medium font-mono">
                  <span>Min Allowed: {formatRawINR(minPotINR)} (Floor 30%)</span>
                  <span>Max Pot: {formatRawINR(maxPotINR)} (0% Discount)</span>
                </div>
              </div>

              {/* Impact Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20">
                  <p className="text-[11px] text-[#9ca3b4] font-medium">Discount Shared with Circle</p>
                  <p className="text-xl font-bold font-display mt-1 text-purple-400 tabular-nums">
                    {formatRawINR(discountOfferedINR)} ({maxPotINR > 0 ? ((discountOfferedINR / maxPotINR) * 100).toFixed(1) : 0}%)
                  </p>
                  <p className="text-[10px] text-[#5f6578] mt-0.5">Increases your chance of winning</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20">
                  <p className="text-[11px] text-[#9ca3b4] font-medium">Each Member Earns</p>
                  <p className="text-xl font-bold font-display mt-1 text-amber-400 tabular-nums">
                    +{formatRawINR(memberSavingsShareINR)} / member
                  </p>
                  <p className="text-[10px] text-[#5f6578] mt-0.5">Added to everyone's savings dividends</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-[#9ca3b4]">
                  <CheckCircle2 className="w-4 h-4 text-[#2dd4a8] flex-shrink-0" />
                  <span>Encrypted on blockchain — nobody sees your request until the reveal.</span>
                </div>

                <div className="flex items-center gap-3">
                  {phase === "Reveal" && !hasRevealed && (
                    <button type="submit" disabled={isSubmitting} className="v-btn-primary text-sm">
                      {isSubmitting ? (submissionStep || "Revealing...") : "Confirm & Reveal"}
                    </button>
                  )}

                  {phase === "Commit" && (
                    <button
                      type="submit"
                      disabled={hasCommitted || isSubmitting}
                      className="v-btn-primary text-sm"
                    >
                      {hasCommitted ? (
                        "Request Submitted ✓"
                      ) : isSubmitting ? (
                        submissionStep || "Submitting to Blockchain..."
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          Securely Commit Request ({formatRawINR(requestedPayoutINR)})
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
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
          )}
        </div>
      ) : (
        <div className="v-card p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(245, 166, 35, 0.1)" }}>
            <Trophy className="w-7 h-7 text-[#f5a623]" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">
            You received your payout in Round {groupDetails?.currentRound || 1}!
          </h3>
          <p className="text-sm text-[#9ca3b4] max-w-md mx-auto">
            You'll continue earning monthly savings dividends while contributing your standard payment until the circle finishes.
          </p>
        </div>
      )}

      {/* ── TECHNICAL DETAILS ── */}
      {isTechnicalMode && (
        <div className="v-tech-box text-xs space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/20">
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
          <div className="mt-2 pt-2 border-t border-purple-500/10">
            <p className="font-mono text-[11px] text-slate-300 break-all">
              keccak256(abi.encodePacked(bidAmount, salt, msg.sender))
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Prevents front-running and MEV by withholding bid amounts until commitment deadline.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
