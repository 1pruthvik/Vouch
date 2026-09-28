import React, { useState } from "react";
import { X, Plus, Shield } from "lucide-react";

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
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [groupName, setGroupName] = useState("");
  const [memberCount, setMemberCount] = useState<number | "">("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [cycleDuration, setCycleDuration] = useState<number | "">("");
  const [discountCapPercent, setDiscountCapPercent] = useState<number | "">("");
  const [reserveFeePercent, setReserveFeePercent] = useState<number | "">("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#0e0e0e] max-w-lg w-full p-8 rounded-xl relative shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-neutral-300" />
            <h2 className="text-lg font-bold text-white font-display">Create Chit Group</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              groupName,
              memberCount: Number(memberCount) || 5,
              installmentAmount: installmentAmount || "0",
              cycleDuration: Number(cycleDuration) || 300,
              discountCapBps: (Number(discountCapPercent) || 30) * 100,
              reserveFeeBps: (Number(reserveFeePercent) || 5) * 100,
            });
            onClose();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Group Name</label>
            <input
              type="text"
              placeholder="e.g. Community Circle"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-black text-white text-sm focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Member Count</label>
              <input
                type="number"
                min="2"
                max="50"
                placeholder="e.g. 5"
                value={memberCount}
                onChange={(e) => setMemberCount(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full px-4 py-2 rounded-lg bg-black text-white text-sm focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Installment (tMSTC)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-black text-white text-sm focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Discount Floor Cap (%)</label>
              <input
                type="number"
                min="1"
                max="50"
                placeholder="e.g. 30"
                value={discountCapPercent}
                onChange={(e) => setDiscountCapPercent(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full px-4 py-2 rounded-lg bg-black text-white text-sm focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Reserve Fee (%)</label>
              <input
                type="number"
                min="0"
                max="20"
                placeholder="e.g. 5"
                value={reserveFeePercent}
                onChange={(e) => setReserveFeePercent(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full px-4 py-2 rounded-lg bg-black text-white text-sm focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Round Cycle Duration (Seconds)</label>
            <input
              type="number"
              min="60"
              placeholder="e.g. 300"
              value={cycleDuration}
              onChange={(e) => setCycleDuration(e.target.value === "" ? "" : parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-black text-white text-sm focus:outline-none"
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Deploy Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
