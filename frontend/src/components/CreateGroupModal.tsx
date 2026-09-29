import React, { useState } from "react";
import { X, Plus, ArrowRight, Code2 } from "lucide-react";
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
  isTechnicalMode = false,
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

          {/* Members & Monthly Contribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#9ca3b4] mb-2">Total Members</label>
              <input
                type="number"
                min="2"
                max="50"
                value={memberCount}
                onChange={(e) => setMemberCount(parseInt(e.target.value) || 2)}
                className="v-input text-xs"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-[#9ca3b4] mb-2">Monthly Contribution (₹)</label>
              <input
                type="number"
                min="100"
                step="100"
                value={installmentInr}
                onChange={(e) => setInstallmentInr(parseFloat(e.target.value) || 0)}
                className="v-input text-xs"
                required
              />
            </div>
          </div>

          {/* Reserve Fee & Cycle Months */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#9ca3b4] mb-2">Reserve Security Fee (₹)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={reserveFeeInr}
                onChange={(e) => setReserveFeeInr(parseFloat(e.target.value) || 0)}
                className="v-input text-xs"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-[#9ca3b4] mb-2">Round Cycle (Months)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={cycleDurationMonths}
                onChange={(e) => setCycleDurationMonths(parseInt(e.target.value) || 1)}
                className="v-input text-xs"
                required
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-2xl space-y-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between text-[#9ca3b4]">
              <span>Total Monthly Pot</span>
              <span className="text-base font-bold text-white font-display">
                {formatRawINR(totalPotInr)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]" style={{ color: '#5f6578' }}>
              <span>Duration</span>
              <span className="font-semibold text-[#9ca3b4]">{numMembers} Months ({numMembers} Draws)</span>
            </div>
            <div className="flex items-center justify-between text-[11px]" style={{ color: '#5f6578' }}>
              <span>Security Deposit</span>
              <span className="font-semibold text-[#2dd4a8]">
                {formatRawINR(numInstallmentInr)} (100% Refundable)
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
                    type="number"
                    min="5"
                    max="50"
                    value={discountCapPercent}
                    onChange={(e) => setDiscountCapPercent(parseInt(e.target.value) || 30)}
                    className="v-input text-xs mt-1 font-mono"
                  />
                </div>
                <div>
                  <p className="text-[#5f6578]">Calculated Reserve Fee:</p>
                  <p className="font-mono text-white mt-2">{calculatedReserveFeeBps} BPS ({(calculatedReserveFeeBps / 100).toFixed(2)}%)</p>
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
