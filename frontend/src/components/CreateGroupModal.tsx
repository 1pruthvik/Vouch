import React, { useState } from "react";
import { X, Plus, ArrowRight } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    groupName: string;
    memberCount: number;
    installmentAmount: string;
    cycleDuration: number;
    discountCapBps: number;
    reserveFeeBps: number;
  }) => void;
  isTechnicalMode?: boolean;
}

export const INR_PER_TMSTC = MST_TO_INR_RATE;

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [groupName, setGroupName] = useState("");
  const [memberCount, setMemberCount] = useState<number | "">(5);
  const [installmentInr, setInstallmentInr] = useState<number | "">(5000);
  const [reserveFeeInr, setReserveFeeInr] = useState<number | "">(250);
  const [cycleDurationMonths, setCycleDurationMonths] = useState<number | "">(1);
  const [discountCapPercent, setDiscountCapPercent] = useState<number | "">(30);

  if (!isOpen) return null;

  const numInstallmentInr = Number(installmentInr) || 0;
  const numMembers = Number(memberCount) || 1;
  const installmentTokens = (numInstallmentInr / INR_PER_TMSTC).toFixed(4);
  const totalPotInr = numMembers * numInstallmentInr;
  const numReserveFeeInr = Number(reserveFeeInr) || 0;

  const calculatedReserveFeeBps = totalPotInr > 0
    ? Math.min(2000, Math.max(100, Math.round((numReserveFeeInr / totalPotInr) * 10000)))
    : 500;

  const numMonths = Number(cycleDurationMonths) || 1;
  const cycleDurationSeconds = numMonths * 30 * 24 * 3600;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !memberCount || !installmentInr) return;
    onSubmit({
      groupName,
      memberCount: Number(memberCount),
      installmentAmount: installmentTokens,
      cycleDuration: cycleDurationSeconds,
      discountCapBps: (Number(discountCapPercent) || 30) * 100,
      reserveFeeBps: calculatedReserveFeeBps,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="bg-black max-w-lg w-full p-8 rounded-xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-500">
            <Plus className="w-4 h-4" />
            Deploy Savings Circle
          </div>
          <h2 className="text-xl font-bold text-white font-display">
            Start a New Circle
          </h2>
          <p className="text-xs text-neutral-400">
            Deploy an on-chain rotating savings pool to the MST blockchain.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">Circle Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Friends & Family Savings"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-neutral-950 rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">Total Members</label>
              <input
                type="number"
                min="2"
                max="50"
                required
                value={memberCount}
                onChange={(e) => setMemberCount(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full bg-neutral-950 rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">Monthly Contribution (₹)</label>
              <input
                type="number"
                min="100"
                step="100"
                required
                value={installmentInr}
                onChange={(e) => setInstallmentInr(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="w-full bg-neutral-950 rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">Round Duration (Months)</label>
              <input
                type="number"
                min="1"
                max="12"
                required
                value={cycleDurationMonths}
                onChange={(e) => setCycleDurationMonths(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full bg-neutral-950 rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">Max Draw Discount (%)</label>
              <input
                type="number"
                min="5"
                max="50"
                required
                value={discountCapPercent}
                onChange={(e) => setDiscountCapPercent(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full bg-neutral-950 rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-neutral-950 rounded-lg space-y-1.5 text-neutral-400 text-xs">
            <div className="flex items-center justify-between text-white font-semibold">
              <span>Total Monthly Pot:</span>
              <span className="font-display text-sm">{formatRawINR(totalPotInr)}</span>
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              ≈ {installmentTokens} tMSTC per member per month
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn-primary w-full py-3"
            >
              Deploy Circle to Blockchain
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
