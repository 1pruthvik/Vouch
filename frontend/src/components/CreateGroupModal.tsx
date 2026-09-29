import React, { useState } from "react";
import { X, Sparkles, Plus, ArrowRight, ShieldCheck, HelpCircle, Layers } from "lucide-react";
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
  const [installmentInr, setInstallmentInr] = useState<number | "">(10000);
  const [reserveFeeInr, setReserveFeeInr] = useState<number | "">(500);
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
      <div className="v-modal p-6 sm:p-8 max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "radial-gradient(circle at 30% 30%, rgba(0, 245, 160, 0.25), rgba(0, 217, 245, 0.08))",
                border: "1px solid rgba(0, 245, 160, 0.35)",
              }}
            >
              <Plus className="w-6 h-6 text-[#00F5A0] stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">Create Community Chain</h2>
                <span className="v-badge v-badge-cyan text-[10px]">Smart Contract</span>
              </div>
              <p className="text-xs text-[#7A889B] mt-0.5">Deploy a self-executing chit fund on MST Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7A889B] hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6 text-xs">
          {/* Chain / Community Name */}
          <div>
            <label className="block font-semibold text-[#E6EDF3] mb-1.5 flex items-center justify-between">
              <span>Community / Party Name</span>
              <span className="text-[10px] text-[#7A889B]">e.g. Prestige Tech Park Savings</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter unique community title..."
              className="v-input text-sm"
              required
            />
          </div>

          {/* Members & Monthly Contribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[#E6EDF3] mb-1.5">
                Total Members (Rounds)
              </label>
              <input
                type="number"
                min="2"
                max="50"
                value={memberCount}
                onChange={(e) => setMemberCount(parseInt(e.target.value) || 2)}
                className="v-input text-sm font-mono"
                required
              />
              <span className="text-[10px] text-[#7A889B] mt-1 block">Each member wins exactly 1 draw</span>
            </div>

            <div>
              <label className="block font-semibold text-[#E6EDF3] mb-1.5">
                Monthly Contribution (₹)
              </label>
              <input
                type="number"
                min="500"
                step="500"
                value={installmentInr}
                onChange={(e) => setInstallmentInr(parseFloat(e.target.value) || 0)}
                className="v-input text-sm font-mono text-[#00F5A0]"
                required
              />
              <span className="text-[10px] text-[#7A889B] mt-1 block">≈ {installmentTokens} tMSTC / month</span>
            </div>
          </div>

          {/* Reserve Fee & Cycle Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[#E6EDF3] mb-1.5">
                Reserve Collateral Buffer (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={reserveFeeInr}
                onChange={(e) => setReserveFeeInr(parseFloat(e.target.value) || 0)}
                className="v-input text-sm font-mono"
                required
              />
              <span className="text-[10px] text-[#7A889B] mt-1 block">Held in smart escrow, 100% refundable</span>
            </div>

            <div>
              <label className="block font-semibold text-[#E6EDF3] mb-1.5">
                Round Cycle Interval
              </label>
              <select
                value={cycleDurationMonths}
                onChange={(e) => setCycleDurationMonths(parseInt(e.target.value) || 1)}
                className="v-input text-sm"
              >
                <option value={1} className="bg-[#0D131F] text-white">1 Month (Standard Monthly Draw)</option>
                <option value={2} className="bg-[#0D131F] text-white">2 Months (Bi-Monthly Draw)</option>
                <option value={3} className="bg-[#0D131F] text-white">3 Months (Quarterly Draw)</option>
              </select>
              <span className="text-[10px] text-[#7A889B] mt-1 block">Draw settlement frequency</span>
            </div>
          </div>

          {/* Calculated Summary Card */}
          <div
            className="p-4 rounded-2xl space-y-2.5"
            style={{
              background: "rgba(13, 19, 31, 0.75)",
              border: "1px solid rgba(0, 245, 160, 0.2)",
            }}
          >
            <div className="flex items-center justify-between text-xs text-[#7A889B]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00F5A0]" /> Total Monthly Pot
              </span>
              <span className="text-base font-bold text-white font-mono text-[#00F5A0]">
                {formatRawINR(totalPotInr)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#7A889B]">
              <span>Total Chain Duration</span>
              <span className="font-semibold text-[#E6EDF3] font-mono">
                {numMembers} Months ({numMembers} Total Rounds)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#7A889B]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00D9F5]" /> Mandatory Collateral Buffer
              </span>
              <span className="font-semibold text-[#00D9F5] font-mono">
                {formatRawINR(numInstallmentInr)}
              </span>
            </div>
          </div>

          {/* Technical Pro Parameters */}
          {isTechnicalMode && (
            <div
              className="p-3.5 rounded-xl text-[11px] space-y-2 font-mono"
              style={{ background: "rgba(121, 40, 202, 0.08)", border: "1px solid rgba(121, 40, 202, 0.25)" }}
            >
              <div className="flex items-center justify-between text-[#A78BFA]">
                <span className="font-bold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> EVM Deployment Payload
                </span>
                <span>Gas: ~0.0024 MST</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-[#7A889B]">
                <div>
                  <span>Max Bid Discount: </span>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={discountCapPercent}
                    onChange={(e) => setDiscountCapPercent(parseInt(e.target.value) || 30)}
                    className="v-input text-xs mt-1 font-mono py-1"
                  />
                </div>
                <div className="pt-2">
                  <span>Reserve Protocol Fee: </span>
                  <p className="text-white font-semibold mt-1">{calculatedReserveFeeBps} BPS ({(calculatedReserveFeeBps / 100).toFixed(2)}%)</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="v-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="v-btn-primary text-xs"
            >
              Deploy Community Chain
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

