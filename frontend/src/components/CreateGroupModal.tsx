import React, { useState } from "react";
import { X, Plus, Clock, Users, Coins, ShieldCheck } from "lucide-react";

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
  const [groupName, setGroupName] = useState("Alpha Savings Circle");
  const [memberCount, setMemberCount] = useState(5);
  const [installmentAmount, setInstallmentAmount] = useState("0.5");
  const [cycleDuration, setCycleDuration] = useState(300); // 5 mins in demo
  const [discountCapBps, setDiscountCapBps] = useState(3000); // 30%
  const [reserveFeeBps, setReserveFeeBps] = useState(500); // 5%

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-card max-w-lg w-full p-6 border-indigo-500/30 relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white font-display">Create Chit Group</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              groupName,
              memberCount,
              installmentAmount,
              cycleDuration,
              discountCapBps,
              reserveFeeBps,
            });
            onClose();
          }}
          className="space-y-4 mt-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Member Count</label>
              <input
                type="number"
                min="2"
                max="20"
                value={memberCount}
                onChange={(e) => setMemberCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Installment (tMSTC)</label>
              <input
                type="text"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Discount Floor Cap (%)</label>
              <input
                type="number"
                min="5"
                max="50"
                value={discountCapBps / 100}
                onChange={(e) => setDiscountCapBps(parseInt(e.target.value) * 100)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reserve Fee (%)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={reserveFeeBps / 100}
                onChange={(e) => setReserveFeeBps(parseInt(e.target.value) * 100)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-sm">
              Deploy Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
