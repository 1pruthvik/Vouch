import React, { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { Modal } from "./ui/Modal";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-white font-display">
          <Plus className="w-5 h-5 text-red-500" />
          <span>Launch New Circle</span>
        </div>
      }
      description={
        <span className="text-xs text-neutral-400">
          Deploy an on-chain rotating savings pool to the MST blockchain. Starts with 0 members.
        </span>
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-neutral-300 mb-1.5">Circle Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Friends & Family Savings"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full bg-neutral-900 rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none"
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
              className="w-full bg-neutral-900 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 border-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">Monthly Due (INR)</label>
            <input
              type="number"
              step="500"
              min="500"
              required
              value={installmentInr}
              onChange={(e) => setInstallmentInr(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full bg-neutral-900 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 border-none"
            />
          </div>
        </div>

        <div className="p-3 bg-neutral-900 rounded-lg space-y-1">
          <div className="flex justify-between text-neutral-400">
            <span>Per Round Pot (INR):</span>
            <span className="text-white font-semibold">{formatRawINR(totalPotInr)}</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Per Round Installment (tMSTC):</span>
            <span className="text-red-400 font-mono font-semibold">{installmentTokens} tMSTC</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold transition-colors border-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy Circle</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
