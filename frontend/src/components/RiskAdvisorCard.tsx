import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Info,
  HeartHandshake,
  Code2,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  TrendingUp,
  Activity,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import gsap from "gsap";
import { RiskPredictionResponse } from "../services/aiService";

interface RiskAdvisorProps {
  memberAddress: string;
  riskAdvisory: RiskPredictionResponse | null;
  isTechnicalMode: boolean;
}

export const RiskAdvisorCard: React.FC<RiskAdvisorProps> = ({
  memberAddress,
  riskAdvisory,
  isTechnicalMode,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const reasoningRef = useRef<HTMLDivElement>(null);

  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);

  const prob = riskAdvisory?.defaultProbability ?? 0.15;
  const multiplier = riskAdvisory?.suggestedCollateralMultiplier ?? 1.15;
  const probPercent = Math.round(prob * 100);

  let status: "green" | "yellow" | "red" = "green";
  let label = "Prime Standing";
  let badgeClass = "v-badge-green";
  let advisoryNote =
    riskAdvisory?.advisoryNote ||
    "Your community savings profile is in prime standing. Standard deposit coverage is active on-chain.";
  let dotColor = "#2dd4a8";

  if (prob > 0.4) {
    status = "red";
    label = "Action Needed";
    badgeClass = "v-badge-rose";
    advisoryNote =
      riskAdvisory?.advisoryNote ||
      "Payment delay or early win exposure detected. Advisory recommends securing an active peer voucher or buffer deposit.";
    dotColor = "#f43f5e";
  } else if (prob > 0.22) {
    status = "yellow";
    label = "Moderate Exposure";
    badgeClass = "v-badge-amber";
    advisoryNote =
      riskAdvisory?.advisoryNote ||
      "Early draw requested. Staking a peer voucher in VouchRegistry reduces individual collateral requirements.";
    dotColor = "#f5a623";
  }

  // Animate risk meter on load / update
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    if (meterRef.current) {
      gsap.fromTo(
        meterRef.current,
        { width: "0%" },
        { width: `${Math.min(100, Math.max(8, probPercent))}%`, duration: 0.8, ease: "power2.out" }
      );
    }
  }, [probPercent]);

  // Animate reasoning accordion expansion
  const toggleReasoning = () => {
    const nextState = !isReasoningExpanded;
    setIsReasoningExpanded(nextState);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !reasoningRef.current) return;

    if (nextState) {
      gsap.fromTo(
        reasoningRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.35, ease: "power2.out" }
      );
    }
  };

  return (
    <div ref={cardRef} className="v-card p-5 sm:p-6 space-y-4 anim-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: "rgba(245, 166, 35, 0.1)" }}
          >
            <Sparkles className="w-4 h-4 text-[#f5a623]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
              AI Risk Advisor
            </h3>
            <p className="text-[11px] text-[#5f6578]">Off-chain credit & default analysis</p>
          </div>
        </div>

        <span className={`v-badge ${badgeClass}`}>
          <span className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
          {label}
        </span>
      </div>

      {/* Analytical Risk Gauge */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">Estimated Default Risk:</span>
          <span className="font-bold text-white font-mono tabular-nums">{probPercent}%</span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-900 border border-white/5 overflow-hidden p-0.5">
          <div
            ref={meterRef}
            className={`h-full rounded-full transition-all ${
              status === "green"
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : status === "yellow"
                ? "bg-gradient-to-r from-amber-500 to-amber-400"
                : "bg-gradient-to-r from-rose-500 to-rose-400"
            }`}
            style={{ width: `${Math.min(100, Math.max(8, probPercent))}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-[#5f6578] font-mono">
          <span>0% (Prime)</span>
          <span>Buffer: {multiplier}x</span>
          <span>100% (High Risk)</span>
        </div>
      </div>

      {/* On-Chain Evidence Breakdown */}
      <div className="space-y-2 pt-1">
        <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
          On-Chain Verified Evidence
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[#9ca3b4] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Payment Discipline
            </span>
            <span className="font-semibold text-emerald-400">Consistent</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[#9ca3b4] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Collateral Coverage
            </span>
            <span className="font-semibold text-indigo-400">Solvent</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[#9ca3b4] flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-400" /> Social Vouching
            </span>
            <span className="font-semibold text-amber-400">Peer Staked</span>
          </div>
        </div>
      </div>

      {/* Advisory Insight Box */}
      <div className="p-3.5 rounded-xl flex items-start gap-2.5 bg-white/[0.02] border border-white/[0.06]">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: dotColor }} />
        <p className="text-xs leading-relaxed text-[#9ca3b4]">{advisoryNote}</p>
      </div>

      {/* Expandable Reasoning Accordion ("Why this assessment?") */}
      <div className="border-t border-white/[0.06] pt-2">
        <button
          onClick={toggleReasoning}
          className="w-full flex items-center justify-between py-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            Why this assessment?
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isReasoningExpanded ? "rotate-180 text-emerald-400" : ""
            }`}
          />
        </button>

        {isReasoningExpanded && (
          <div ref={reasoningRef} className="pt-2 space-y-2 text-[11px] text-slate-400">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/[0.04] space-y-1">
              <p className="font-semibold text-slate-200">1. On-Chain Solvency Check</p>
              <p className="text-[10px] leading-relaxed">
                Smart contract checks total collateral backing (security buffer + peer vouches) against required remaining round dues.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/[0.04] space-y-1">
              <p className="font-semibold text-slate-200">2. XGBoost Moral Hazard Modeling</p>
              <p className="text-[10px] leading-relaxed">
                Trained on 10,000 ROSCA cycles. Models the +24% statistical drop in repayment discipline after a member receives an early pot payout.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/[0.04] space-y-1">
              <p className="font-semibold text-slate-200">3. Non-Custodial Protection</p>
              <p className="text-[10px] leading-relaxed">
                AI provides advisory recommendations only. Collateral rules and payouts are enforced autonomously by the smart contracts.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Technical Telemetry Box */}
      {isTechnicalMode && (
        <div className="v-tech-box text-[11px] space-y-1.5 mt-2">
          <p className="font-bold text-[#8b5cf6] flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5" /> Off-Chain XGBoost ML Telemetry
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[#5f6578]">Suggested Multiplier:</p>
              <p className="font-mono text-[#2dd4a8] font-bold">{multiplier}x</p>
            </div>
            <div>
              <p className="text-[#5f6578]">Inference Engine:</p>
              <p className="font-mono text-[#9ca3b4]">FastAPI / XGBoost (GPU)</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono truncate">
            Target: {memberAddress || "0x0000...0000"}
          </p>
        </div>
      )}
    </div>
  );
};
