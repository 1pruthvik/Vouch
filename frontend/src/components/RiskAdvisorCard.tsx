import React from "react";
import { Sparkles, Info, Code2, HeartHandshake } from "lucide-react";
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
  const prob = riskAdvisory?.defaultProbability;
  const multiplier = riskAdvisory?.suggestedCollateralMultiplier;

  let label = "Good Standing";
  let badgeClass = "v-badge-green";
  let advisoryNote = riskAdvisory?.advisoryNote || "Your community savings profile is in excellent standing. Standard deposit coverage is active.";
  let dotColor = '#2dd4a8';

  if (prob !== undefined && prob > 0.4) {
    label = "Action Needed";
    badgeClass = "v-badge-rose";
    advisoryNote = riskAdvisory?.advisoryNote || "Payment or deposit adjustment required. Please review your account to stay active.";
    dotColor = '#f43f5e';
  } else if (prob !== undefined && prob > 0.22) {
    label = "Consider Adding Backup";
    badgeClass = "v-badge-amber";
    advisoryNote = riskAdvisory?.advisoryNote || "You are requesting an early draw. Nominating a trusted friend as your backer adds extra peace of mind.";
    dotColor = '#f5a623';
  }

  return (
    <div className="v-card p-5 sm:p-6 space-y-4 anim-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245, 166, 35, 0.1)' }}>
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

      {/* Advisory Note */}
      <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: dotColor }} />
        <p className="text-xs leading-relaxed" style={{ color: '#9ca3b4' }}>
          {advisoryNote}
        </p>
      </div>

      {/* Vouch Backing */}
      <div className="p-4 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.12)' }}>
        <div className="flex items-center gap-2.5">
          <HeartHandshake className="w-4 h-4 text-[#8b5cf6]" />
          <div>
            <p className="text-xs font-semibold text-white">Social Vouch</p>
            <p className="text-[11px] text-[#5f6578]">Backed by Priya R. (1,050 pts)</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-[#2dd4a8]">Protected ✓</span>
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
              <p className="font-mono text-[#2dd4a8] font-bold">{multiplier ? `${multiplier}x` : "1.00x"}</p>
            </div>
            <div>
              <p className="text-[#5f6578]">Risk Model:</p>
              <p className="font-mono text-[#9ca3b4]">FastAPI / XGBoost (GPU)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
