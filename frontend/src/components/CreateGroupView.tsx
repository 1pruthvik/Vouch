import React, { useState } from "react";
import { Plus, ArrowRight, Shield, CheckCircle2, Sparkles } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";

interface CreateGroupViewProps {
  account: string | null;
  onCreateGroup: (params: {
    groupName: string;
    memberCount: number;
    installmentAmount: string;
    cycleDuration: number;
    discountCapBps: number;
    reserveFeeBps: number;
  }) => Promise<void>;
  isDeploying?: boolean;
  deployedCircleAddress?: string | null;
}

export const INR_PER_TMSTC = MST_TO_INR_RATE;

export const CreateGroupView: React.FC<CreateGroupViewProps> = ({
  account,
  onCreateGroup,
  isDeploying = false,
  deployedCircleAddress,
}) => {
  const [groupName, setGroupName] = useState("");
  const [memberCount, setMemberCount] = useState<number | "">(5);
  const [installmentInr, setInstallmentInr] = useState<number | "">(5000);
  const [reserveFeeInr, setReserveFeeInr] = useState<number | "">(250);
  const [cycleDurationMonths, setCycleDurationMonths] = useState<number | "">(1);
  const [discountCapPercent, setDiscountCapPercent] = useState<number | "">(30);

  const numInstallmentInr = Number(installmentInr) || 0;
  const numMembers = Number(memberCount) || 1;
  const installmentTokens = (numInstallmentInr / INR_PER_TMSTC).toFixed(4);
  const totalPotInr = numMembers * numInstallmentInr;
  const numReserveFeeInr = Number(reserveFeeInr) || 0;

  const calculatedReserveFeeBps =
    totalPotInr > 0
      ? Math.min(2000, Math.max(100, Math.round((numReserveFeeInr / totalPotInr) * 10000)))
      : 500;

  const numMonths = Number(cycleDurationMonths) || 1;
  const cycleDurationSeconds = numMonths * 30 * 24 * 3600;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !memberCount || !installmentInr) return;

    await onCreateGroup({
      groupName,
      memberCount: Number(memberCount),
      installmentAmount: installmentTokens,
      cycleDuration: cycleDurationSeconds,
      discountCapBps: (Number(discountCapPercent) || 30) * 100,
      reserveFeeBps: calculatedReserveFeeBps,
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Header Info */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-red-500 mb-1">
          <Plus className="w-3.5 h-3.5" />
          <span>Deploy Autonomous Circle</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
          Create a Savings Circle
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
          Deploy an on-chain rotating savings and collateral pool to the MST blockchain network.
        </p>
      </div>

      {/* Success Banner if newly deployed */}
      {deployedCircleAddress && (
        <div className="p-4 rounded-xl bg-red-950/20 text-neutral-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">Circle Contract Deployed</p>
              <p className="font-mono text-neutral-400 text-[11px] truncate max-w-sm sm:max-w-md">
                {deployedCircleAddress}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-2">
            Circle Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Friends & Family Chit Fund"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            disabled={isDeploying}
            className="w-full bg-neutral-950 rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Total Members
            </label>
            <input
              type="number"
              min="2"
              max="50"
              required
              value={memberCount}
              onChange={(e) =>
                setMemberCount(e.target.value === "" ? "" : parseInt(e.target.value))
              }
              disabled={isDeploying}
              className="w-full bg-neutral-950 rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Monthly Contribution (₹)
            </label>
            <input
              type="number"
              min="100"
              step="100"
              required
              value={installmentInr}
              onChange={(e) =>
                setInstallmentInr(e.target.value === "" ? "" : parseFloat(e.target.value))
              }
              disabled={isDeploying}
              className="w-full bg-neutral-950 rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Round Duration (Months)
            </label>
            <input
              type="number"
              min="1"
              max="12"
              required
              value={cycleDurationMonths}
              onChange={(e) =>
                setCycleDurationMonths(e.target.value === "" ? "" : parseInt(e.target.value))
              }
              disabled={isDeploying}
              className="w-full bg-neutral-950 rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Max Draw Discount (%)
            </label>
            <input
              type="number"
              min="5"
              max="50"
              required
              value={discountCapPercent}
              onChange={(e) =>
                setDiscountCapPercent(e.target.value === "" ? "" : parseInt(e.target.value))
              }
              disabled={isDeploying}
              className="w-full bg-neutral-950 rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none transition-all"
            />
          </div>
        </div>

        {/* Calculation Summary Box */}
        <div className="p-5 bg-neutral-950 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-white font-semibold">
            <span className="text-neutral-400">Total Monthly Pot:</span>
            <span className="font-display text-lg text-white font-bold">{formatRawINR(totalPotInr)}</span>
          </div>
          <div className="flex items-center justify-between text-neutral-500 text-[11px] font-mono">
            <span>Per Member Contribution:</span>
            <span>≈ {installmentTokens} tMSTC / month</span>
          </div>
        </div>

        {/* Deploy Button */}
        <button
          type="submit"
          disabled={isDeploying || !account || !groupName}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeploying ? (
            <span>Deploying Circle to MST Blockchain...</span>
          ) : (
            <>
              <span>Deploy Circle to Blockchain</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
