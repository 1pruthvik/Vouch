import React, { useEffect, useRef } from "react";
import {
  ShieldCheck,
  Sparkles,
  Info,
  AlertTriangle,
  HeartHandshake,
  Code2,
  TrendingUp,
  Activity,
  CheckCircle2,
  Layers,
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

  const prob = riskAdvisory?.defaultProbability ?? 0.15;
  const multiplier = riskAdvisory?.suggestedCollateralMultiplier ?? 1.15;
  const probPercent = Math.round(prob * 100);

  let status: "green" | "yellow" | "red" = "green";
  let label = "Tier 1: Prime Standing";
  let badgeClass = "badge-status-green";
  let advisoryNote = "Your community savings profile is in excellent standing. Standard deposit coverage is adequate.";

  if (prob > 0.4) {
    status = "red";
    label = "Tier 3: Elevated Risk";
    badgeClass = "badge-status-red";
    advisoryNote = "Payment delay or early win exposure detected. Advisory recommends securing an active voucher or additional buffer.";
  } else if (prob > 0.22) {
    status = "yellow";
    label = "Tier 2: Moderate Exposure";
    badgeClass = "badge-status-yellow";
    advisoryNote = "Early draw requested. Staking a peer voucher in VouchRegistry reduces individual collateral requirements.";
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
    <div ref={cardRef} className="fintech-card p-6 border-white/5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">AI Risk Advisory</h3>
            <p className="text-[11px] text-slate-400">Off-Chain Machine Learning Analytics</p>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${badgeClass}`}>
          <span className={`w-2 h-2 rounded-full ${status === 'green' ? 'bg-emerald-400' : status === 'yellow' ? 'bg-amber-400' : 'bg-red-400'}`} />
          {label}
        </span>
      </div>

      {/* 1. ON-CHAIN EVIDENCE VS OFF-CHAIN AI SPLIT */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">Estimated Default Risk:</span>
          <span className="font-bold text-white font-mono">{probPercent}%</span>
        </div>

        {/* Precision Analytical Risk Gauge */}
        <div className="w-full h-2 rounded-full bg-slate-900 border border-white/5 overflow-hidden p-0.5">
          <div
            ref={meterRef}
            className={`h-full rounded-full transition-all ${
              status === 'green'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : status === 'yellow'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                : 'bg-gradient-to-r from-rose-500 to-rose-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(8, probPercent))}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0% (Prime)</span>
          <span>Recommended Multiplier: {multiplier}x</span>
          <span>100% (High Risk)</span>
        </div>
      </div>

      {/* 2. ON-CHAIN REPUTATION EVIDENCE GRID */}
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

      {/* 3. ADVISORY INSIGHT BOX */}
      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-300 leading-relaxed">
          {advisoryNote}
        </p>
      </div>

      {/* 4. TECHNICAL DETAILS CALLOUT (Opt-in) */}
      {isTechnicalMode && (
        <div className="tech-details-box text-[11px] space-y-1.5 mt-2">
          <p className="font-bold text-indigo-300 flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" /> Off-Chain XGBoost ML Telemetry
          </p>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div>
              <p className="text-slate-400 text-[10px]">Suggested Multiplier:</p>
              <p className="font-mono text-emerald-400 font-bold">{multiplier}x</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px]">Inference Service:</p>
              <p className="font-mono text-slate-200">FastAPI / XGBoost (GPU)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
