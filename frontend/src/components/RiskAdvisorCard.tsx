import React from "react";
import { ShieldCheck, Sparkles, Info, Code2 } from "lucide-react";
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
  const prob = riskAdvisory?.defaultProbability;
  const multiplier = riskAdvisory?.suggestedCollateralMultiplier;

  let status: "green" | "yellow" | "red" = "green";
  let label = "Good Standing";
  let badgeClass = "badge-status-green";
  let advisoryNote = riskAdvisory?.advisoryNote || "Your savings profile is in good standing. Standard collateral rules apply.";

  if (prob !== undefined) {
    if (prob > 0.4) {
      status = "red";
      label = "High Risk Exposure";
      badgeClass = "badge-status-red";
    } else if (prob > 0.22) {
      status = "yellow";
      label = "Moderate Risk Exposure";
      badgeClass = "badge-status-yellow";
    }
  }

  return (
    <div className="content-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#141414] text-royal-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">Risk & Standing Advisor</h3>
            <p className="text-xs text-neutral-400">AI-assisted solvency telemetry</p>
          </div>
        </div>

        <span className={`badge ${badgeClass}`}>
          <span className={`w-2 h-2 rounded-full ${status === 'green' ? 'bg-green-400' : status === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'}`} />
          {label}
        </span>
      </div>

      {/* Advisory Note */}
      <div className="p-4 rounded-lg bg-[#141414] flex items-start gap-3">
        <Info className="w-4 h-4 text-royal-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-neutral-300 leading-relaxed">
          {advisoryNote}
        </p>
      </div>

      {/* Technical Details (Opt-in) */}
      {isTechnicalMode && (
        <div className="tech-details-box text-[11px] space-y-1.5 mt-3">
          <p className="font-bold text-neutral-300 flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5 text-royal-400" /> Off-Chain XGBoost ML Telemetry
          </p>
          <div className="grid grid-cols-2 gap-2 text-neutral-300">
            <div>
              <p className="text-neutral-500">Advisory Multiplier:</p>
              <p className="font-mono text-white font-bold">{multiplier ? `${multiplier}x` : "1.00x"}</p>
            </div>
            <div>
              <p className="text-neutral-500">Model Endpoint:</p>
              <p className="font-mono text-neutral-400">FastAPI / XGBoost (GPU)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
