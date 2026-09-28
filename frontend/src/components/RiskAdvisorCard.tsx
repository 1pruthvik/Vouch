import React from "react";
import { Sparkles, Info } from "lucide-react";

interface RiskAdvisorProps {
  memberAddress?: string;
  suggestedMultiplier?: number;
  defaultProbability?: number;
  riskTier?: string;
  advisoryNote?: string;
}

export const RiskAdvisorCard: React.FC<RiskAdvisorProps> = ({
  suggestedMultiplier,
  defaultProbability,
  riskTier,
  advisoryNote,
}) => {
  const hasData = suggestedMultiplier !== undefined;

  return (
    <div className="bg-[#0e0e0e] rounded-xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-neutral-900 text-neutral-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white font-display">AI Risk Advisory</h3>
            <p className="text-xs text-neutral-400">Off-chain Machine Learning</p>
          </div>
        </div>
        <span className="badge text-xs">Advisory Only</span>
      </div>

      {hasData ? (
        <>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-xl bg-black">
              <p className="text-xs text-neutral-400 mb-1">Suggested Collateral</p>
              <p className="text-2xl font-bold text-white font-display">{suggestedMultiplier}x</p>
            </div>
            <div className="p-4 rounded-xl bg-black">
              <p className="text-xs text-neutral-400 mb-1">Default Probability</p>
              <p className="text-2xl font-bold text-white font-display">
                {((defaultProbability || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-4 rounded-xl bg-black text-xs text-neutral-300">
            <Info className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
            <p>{advisoryNote || "Advisory score based on current parameters."}</p>
          </div>
        </>
      ) : (
        <div className="p-6 rounded-xl bg-black text-center text-xs text-neutral-400">
          Connect your wallet and participate in a group to calculate risk advisory predictions.
        </div>
      )}
    </div>
  );
};
