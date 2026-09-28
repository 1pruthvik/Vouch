import React from "react";
import { Sparkles, Info, ShieldAlert, CheckCircle2 } from "lucide-react";

interface RiskAdvisorProps {
  memberAddress: string;
  suggestedMultiplier: number;
  defaultProbability: number;
  riskTier: string;
  advisoryNote: string;
}

export const RiskAdvisorCard: React.FC<RiskAdvisorProps> = ({
  suggestedMultiplier = 1.25,
  defaultProbability = 0.18,
  riskTier = "Low Risk (Tier 1)",
  advisoryNote = "Member possesses good repayment reputation. Standard buffer deposit is adequate.",
}) => {
  return (
    <div className="glass-card p-6 border-indigo-500/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-24 h-24 text-indigo-400" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white font-display">AI Risk Advisory</h3>
            <p className="text-xs text-slate-400">Off-chain XGBoost Machine Learning Model</p>
          </div>
        </div>
        <span className="badge badge-indigo text-xs">Advisory Only</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
          <p className="text-xs text-slate-400 mb-1">Suggested Collateral</p>
          <p className="text-xl font-bold text-indigo-400 font-display">{suggestedMultiplier}x</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
          <p className="text-xs text-slate-400 mb-1">Est. Default Probability</p>
          <p className="text-xl font-bold text-amber-400 font-display">
            {(defaultProbability * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-slate-300">
        <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
        <p>{advisoryNote}</p>
      </div>
    </div>
  );
};
