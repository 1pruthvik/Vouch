import React, { useEffect, useRef } from "react";
import {
  Sparkles,
  Info,
  HeartHandshake,
  Code2,
  CheckCircle2,
} from "lucide-react";
import gsap from "gsap";
import { RiskPredictionResponse } from "../services/aiService";

interface RiskAdvisorProps {
  memberAddress: string;
  riskAdvisory: RiskPredictionResponse | null;
  isTechnicalMode: boolean;
}

export const RiskAdvisorCard: React.FC<RiskAdvisorProps> = ({
  riskAdvisory,
  isTechnicalMode,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);

  const prob = riskAdvisory?.defaultProbability ?? 0.15;
  const multiplier = riskAdvisory?.suggestedCollateralMultiplier ?? 1.15;
  const probPercent = Math.round(prob * 100);

  let status: "green" | "yellow" | "red" = "green";
  let label = "Good Standing";
  let badgeClass = "v-badge-green";
  let advisoryNote = riskAdvisory?.advisoryNote || "Your community savings profile is in excellent standing. Standard deposit coverage is active.";
  let dotColor = "#2dd4a8";

  if (prob > 0.4) {
    status = "red";
    label = "Action Needed";
    badgeClass = "v-badge-rose";
    advisoryNote = riskAdvisory?.advisoryNote || "Payment delay or early win exposure detected. Advisory recommends securing an active voucher or additional buffer.";
    dotColor = "#f43f5e";
  } else if (prob > 0.22) {
    status = "yellow";
    label = "Consider Adding Backup";
    badgeClass = "v-badge-amber";
    advisoryNote = riskAdvisory?.advisoryNote || "You are requesting an early draw. Staking a peer voucher in VouchRegistry reduces individual collateral requirements.";
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

  return (
    <div ref={cardRef} className="v-card p-5 sm:p-6 space-y-4 anim-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245, 166, 35, 0.1)" }}>
            <Sparkles className="w-4 h-4 text-[#f5a623]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">Trust Advisor</h3>
            <p className="text-[11px] text-[#5f6578]">Smart insights on your safety</p>
          </div>
        </div>

        <span className={`v-badge ${badgeClass}`}>
          <span className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
          {label}
        </span>
      </div>

      {/* Risk Gauge Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">Estimated Default Risk:</span>
          <span className="font-bold text-white font-mono">{probPercent}%</span>
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

      {/* On-Chain Reputation Evidence Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-0.5">
          <p className="text-[11px] text-slate-400">Payment Discipline</p>
          <p className="font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> High Consistency
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-0.5">
          <p className="text-[11px] text-slate-400">Social Vouching</p>
          <p className="font-semibold text-indigo-400 flex items-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5" /> Peer Staked
          </p>
        </div>
      </div>

      {/* Advisory Note */}
      <div className="p-4 rounded-2xl flex items-start gap-3 bg-white/[0.03] border border-white/[0.06]">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: dotColor }} />
        <p className="text-xs leading-relaxed text-[#9ca3b4]">
          {advisoryNote}
        </p>
      </div>

      {/* Technical Details */}
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
              <p className="text-[#5f6578]">Inference Service:</p>
              <p className="font-mono text-[#9ca3b4]">FastAPI / XGBoost (GPU)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
