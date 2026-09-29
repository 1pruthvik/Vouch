import React from "react";
import { Sparkles, Info, Code2 } from "lucide-react";
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

  let status: "green" | "yellow" | "red" = "green";
  let label = "Good Standing";
  let advisoryNote = riskAdvisory?.advisoryNote || "Savings profile is in good standing. Standard collateral rules apply.";

  if (prob !== undefined) {
    if (prob > 0.4) {
      status = "red";
      label = "High Risk Exposure";
    } else if (prob > 0.22) {
      status = "yellow";
      label = "Moderate Risk Exposure";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-bold text-white font-display">Risk & Solvency Advisor</h3>
        </div>

        <span className={`text-xs font-semibold ${status === 'green' ? 'text-green-400' : status === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
          {label}
        </span>
      </div>

      <div className="flex items-start gap-2.5">
        <Info className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-neutral-400 leading-relaxed">
          {advisoryNote}
        </p>
      </div>

      {isTechnicalMode && (
        <div className="text-[11px] space-y-1.5 pt-2">
          <p className="font-bold text-neutral-400 flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5 text-red-500" /> ML Telemetry
          </p>
          <div className="grid grid-cols-2 gap-2 text-neutral-400">
            <div>
              <p className="text-neutral-500">Advisory Multiplier:</p>
              <p className="font-mono text-white font-bold">{multiplier ? `${multiplier}x` : "1.00x"}</p>
            </div>
            <div>
              <p className="text-neutral-500">Model Endpoint:</p>
              <p className="font-mono text-neutral-400">FastAPI / XGBoost</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
