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
  const [cycleDurationMins, setCycleDurationMins] = useState(5);
  const [discountCapPercent, setDiscountCapPercent] = useState(30);
  const [reserveFeePercent, setReserveFeePercent] = useState(5);

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
    <div className="v-overlay">
      <div className="v-modal p-6 sm:p-7 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(45, 212, 168, 0.1)', border: '1px solid rgba(45, 212, 168, 0.2)' }}>
              <Plus className="w-5 h-5 text-[#2dd4a8] stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Start a Savings Circle</h2>
              <p className="text-xs text-[#5f6578]">Create an autonomous community chit fund</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#5f6578] hover:text-white hover:bg-white/5 transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-xs">
          {/* Circle Name */}
          <div>
            <label className="block font-semibold text-[#9ca3b4] mb-2">Circle Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Friends & Family Circle"
              className="v-input text-xs"
              required
            />
          </div>

          {/* Members & Contribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#9ca3b4] mb-2">Total Members</label>
              <input
                type="number"
                min="2"
                max="20"
                value={memberCount}
                onChange={(e) => setMemberCount(parseInt(e.target.value) || 2)}
                className="v-input text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#9ca3b4] mb-2">Monthly Contribution (₹)</label>
              <input
                type="number"
                min="500"
                step="500"
                value={installmentAmountINR}
                onChange={(e) => setInstallmentAmountINR(parseInt(e.target.value) || 500)}
                className="v-input text-xs"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-2xl space-y-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between text-[#9ca3b4]">
              <span>Total Monthly Pot</span>
              <span className="text-base font-bold text-white font-display">
                {formatRawINR(totalPotINR)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]" style={{ color: '#5f6578' }}>
              <span>Duration</span>
              <span className="font-semibold text-[#9ca3b4]">{memberCount} Months ({memberCount} Draws)</span>
            </div>
            <div className="flex items-center justify-between text-[11px]" style={{ color: '#5f6578' }}>
              <span>Security Deposit</span>
              <span className="font-semibold text-[#2dd4a8]">
                {formatRawINR(installmentAmountINR)} (100% Refundable)
              </span>
            </div>
          </div>

          {/* Technical Parameters */}
          {isTechnicalMode && (
            <div className="v-tech-box text-[11px] space-y-2">
              <p className="font-bold text-[#8b5cf6] flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5" /> Advanced Protocol Parameters
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[#5f6578]">Max Discount Floor (%):</p>
                  <input
                    type="number" min="5" max="50" value={discountCapPercent}
                    onChange={(e) => setDiscountCapPercent(parseInt(e.target.value) || 30)}
                    className="v-input text-xs mt-1 font-mono"
                  />
                </div>
                <div>
                  <p className="text-[#5f6578]">Reserve Fund Cut (%):</p>
                  <input
                    type="number" min="1" max="10" value={reserveFeePercent}
                    onChange={(e) => setReserveFeePercent(parseInt(e.target.value) || 5)}
                    className="v-input text-xs mt-1 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="v-btn-secondary text-xs">Cancel</button>
            <button type="submit" className="v-btn-primary text-xs">
              Create Circle
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
