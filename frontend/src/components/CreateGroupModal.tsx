import React, { useState } from "react";
import { X, Plus, ArrowRight } from "lucide-react";
import { MST_TO_INR_RATE } from "../utils/formatters";

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
  const [memberCount, setMemberCount] = useState<number | "">("");
  const [installmentInr, setInstallmentInr] = useState<number | "">("");
  const [reserveFeeInr, setReserveFeeInr] = useState<number | "">("");
  const [cycleDurationMonths, setCycleDurationMonths] = useState<number | "">("");

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
    if (!groupName || !memberCount || !installmentInr || !cycleDurationMonths) return;
    onSubmit({
      groupName,
      memberCount: Number(memberCount),
      installmentAmount: installmentTokens,
      cycleDuration: cycleDurationSeconds,
      discountCapBps: 3000, // Standard 30% discount cap
      reserveFeeBps: calculatedReserveFeeBps,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#0e0e0e] max-w-lg w-full p-8 rounded-xl relative shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-royal-600 text-white flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Create Chit Group</h2>
              <p className="text-xs text-neutral-400">Autonomous ROSCA community fund</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Group Name */}
          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
              required
            />
          </div>

          {/* Members & Monthly Contribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">Total Members</label>
              <input
                type="number"
                min="2"
                max="50"
                placeholder="Enter total members"
                value={memberCount}
                onChange={(e) => setMemberCount(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">Installment (Rupees / ₹)</label>
              <input
                type="number"
                min="100"
                step="50"
                placeholder="Enter amount in ₹"
                value={installmentInr}
                onChange={(e) => setInstallmentInr(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
                required
              />
            </div>
          </div>

          {/* Reserve Fee & Cycle Months */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">Reserve Fee (Rupees / ₹)</label>
              <input
                type="number"
                min="0"
                step="10"
                placeholder="Enter reserve fee in ₹"
                value={reserveFeeInr}
                onChange={(e) => setReserveFeeInr(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">Round Cycle (Months)</label>
              <input
                type="number"
                min="1"
                max="24"
                placeholder="Enter number of months"
                value={cycleDurationMonths}
                onChange={(e) => setCycleDurationMonths(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Deploy Group
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
