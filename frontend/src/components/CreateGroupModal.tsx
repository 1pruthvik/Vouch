import React, { useState } from "react";
import { X, Plus, Users, ShieldCheck, Sparkles, HelpCircle, Code2, ArrowRight } from "lucide-react";
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
  isTechnicalMode: boolean;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isTechnicalMode,
}) => {
  const [groupName, setGroupName] = useState("Alpha Savings Circle");
  const [memberCount, setMemberCount] = useState(5);
  const [installmentAmountINR, setInstallmentAmountINR] = useState(5000);
  const [cycleDurationMins, setCycleDurationMins] = useState(5); // 5 mins in demo
  const [discountCapPercent, setDiscountCapPercent] = useState(30); // 30% discount cap
  const [reserveFeePercent, setReserveFeePercent] = useState(5); // 5% reserve fund

  if (!isOpen) return null;

  const totalPotINR = installmentAmountINR * memberCount;
  const installmentMST = (installmentAmountINR / MST_TO_INR_RATE).toFixed(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      groupName,
      memberCount,
      installmentAmount: installmentMST,
      cycleDuration: cycleDurationMins * 60,
      discountCapBps: discountCapPercent * 100,
      reserveFeeBps: reserveFeePercent * 100,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="cred-card max-w-lg w-full p-6 sm:p-7 border-emerald-500/20 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Start a Savings Circle</h2>
              <p className="text-xs text-slate-400">Create an autonomous community chit fund</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 my-5 text-xs">
          {/* Circle Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Circle Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Friends & Family Circle"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d11] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>

          {/* Members & Monthly Contribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Total Members</label>
              <input
                type="number"
                min="2"
                max="20"
                value={memberCount}
                onChange={(e) => setMemberCount(parseInt(e.target.value) || 2)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d11] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Monthly Contribution (₹)</label>
              <input
                type="number"
                min="500"
                step="500"
                value={installmentAmountINR}
                onChange={(e) => setInstallmentAmountINR(parseInt(e.target.value) || 500)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d11] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Circle Summary Preview Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#12151d] to-[#0d0f14] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>Total Monthly Pot</span>
              <span className="text-base font-extrabold text-white font-display">
                {formatRawINR(totalPotINR)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Duration</span>
              <span className="font-semibold text-slate-200">{memberCount} Months ({memberCount} Draws)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Required Security Deposit</span>
              <span className="font-semibold text-emerald-400">
                {formatRawINR(installmentAmountINR)} (100% Refundable)
              </span>
            </div>
          </div>

          {/* Technical Mode Parameters */}
          {isTechnicalMode && (
            <div className="tech-details-box text-[11px] space-y-2">
              <p className="font-bold text-indigo-300 flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" /> Advanced Protocol Parameters
              </p>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <p className="text-slate-400">Max Discount Floor (%):</p>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={discountCapPercent}
                    onChange={(e) => setDiscountCapPercent(parseInt(e.target.value) || 30)}
                    className="w-full mt-1 px-2 py-1 rounded bg-black border border-white/10 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <p className="text-slate-400">Reserve Fund Cut (%):</p>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={reserveFeePercent}
                    onChange={(e) => setReserveFeePercent(parseInt(e.target.value) || 5)}
                    className="w-full mt-1 px-2 py-1 rounded bg-black border border-white/10 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-cred-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-cred-primary text-xs"
            >
              Create Circle
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
