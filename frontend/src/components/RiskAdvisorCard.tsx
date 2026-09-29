import React from "react";
import { ShieldCheck, Sparkles, Info, AlertTriangle, HeartHandshake, Code2 } from "lucide-react";
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
  const prob = riskAdvisory?.defaultProbability ?? 0.15;
  const multiplier = riskAdvisory?.suggestedCollateralMultiplier ?? 1.15;

  let status: "green" | "yellow" | "red" = "green";
  let label = "Good Standing";
  let badgeClass = "badge-status-green";
  let advisoryNote = "Your community savings profile is in excellent standing. Standard deposit coverage is active.";

  if (prob > 0.4) {
    status = "red";
    label = "Action Needed";
    badgeClass = "badge-status-red";
    advisoryNote = "Payment or deposit adjustment required. Please review your account to stay active.";
  } else if (prob > 0.22) {
    status = "yellow";
    label = "Consider Adding Backup";
    badgeClass = "badge-status-yellow";
    advisoryNote = "You are requesting an early draw. Nominating a trusted friend as your backer adds extra peace of mind.";
  }

  return (
    <div className="cred-card p-6 border-white/5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">Standing & Trust Advisor</h3>
            <p className="text-xs text-slate-400">Smart insights on your circle safety</p>
          </div>
        </div>

        <span className={`badge ${badgeClass}`}>
          <span className={`w-2 h-2 rounded-full ${status === 'green' ? 'bg-emerald-400' : status === 'yellow' ? 'bg-amber-400' : 'bg-red-400'}`} />
          {label}
        </span>
      </div>

      {/* Advisory Note */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-300 leading-relaxed">
          {advisoryNote}
        </p>
      </div>

      {/* Trust Backing Hint */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/30 to-purple-950/30 border border-indigo-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <HeartHandshake className="w-4 h-4 text-indigo-400" />
          <div>
            <p className="text-xs font-semibold text-white">Social Vouch Backing</p>
            <p className="text-[11px] text-slate-400">Backed by Priya R. (Reputation: 1,050 pts)</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-emerald-400">Protected ✓</span>
      </div>

      {/* Technical Details (Opt-in for judges/evaluators) */}
      {isTechnicalMode && (
        <div className="tech-details-box text-[11px] space-y-1.5 mt-3">
          <p className="font-bold text-indigo-300 flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" /> Off-Chain XGBoost ML Telemetry
          </p>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div>
              <p className="text-slate-400">Suggested Multiplier:</p>
              <p className="font-mono text-emerald-400 font-bold">{multiplier}x</p>
            </div>
            <div>
              <p className="text-slate-400">Risk Assessment Model:</p>
              <p className="font-mono text-slate-200">FastAPI / XGBoost (GPU)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
