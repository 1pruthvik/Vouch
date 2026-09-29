import React, { useState } from "react";
import { Plus, ArrowRight, Code2 } from "lucide-react";
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
  isTechnicalMode = false,
}) => {
  const [groupName, setGroupName] = useState("");
  const [memberCount, setMemberCount] = useState<number | "">(5);
  const [installmentInr, setInstallmentInr] = useState<number | "">(5000);
  const [reserveFeeInr, setReserveFeeInr] = useState<number | "">(250);
  const [cycleDurationMonths, setCycleDurationMonths] = useState<number | "">(1);
  const [discountCapPercent, setDiscountCapPercent] = useState<number | "">(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !memberCount || !installmentInr || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        groupName,
        memberCount: Number(memberCount),
        installmentAmount: installmentTokens,
        cycleDuration: cycleDurationSeconds,
        discountCapBps: (Number(discountCapPercent) || 30) * 100,
        reserveFeeBps: calculatedReserveFeeBps,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start a Savings Circle"
      description="Create an autonomous community chit fund on MST Blockchain"
      icon={<Plus className="w-5 h-5 text-[#946800] stroke-[2.5]" />}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Circle Name */}
        <div>
          <label className="block font-semibold text-[#5F6368] mb-1.5">Circle Name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Bangalore Techies Savings"
            className="v-input"
            required
            autoFocus
          />
        </div>

        {/* Members & Monthly Contribution */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#5F6368] mb-1.5">Total Members</label>
            <input
              type="number"
              min="2"
              max="50"
              value={memberCount}
              onChange={(e) => setMemberCount(parseInt(e.target.value) || 2)}
              className="v-input"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-[#5F6368] mb-1.5">Monthly Contribution (₹)</label>
            <input
              type="number"
              min="100"
              step="100"
              value={installmentInr}
              onChange={(e) => setInstallmentInr(parseFloat(e.target.value) || 0)}
              className="v-input"
              required
            />
          </div>
        </div>

        {/* Reserve Fee & Cycle Months */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#5F6368] mb-1.5">Reserve Security Fee (₹)</label>
            <input
              type="number"
              min="0"
              step="50"
              value={reserveFeeInr}
              onChange={(e) => setReserveFeeInr(parseFloat(e.target.value) || 0)}
              className="v-input"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-[#5F6368] mb-1.5">Round Cycle (Months)</label>
            <input
              type="number"
              min="1"
              max="24"
              value={cycleDurationMonths}
              onChange={(e) => setCycleDurationMonths(parseInt(e.target.value) || 1)}
              className="v-input"
              required
            />
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-2.5">
          <div className="flex items-center justify-between text-[#5F6368]">
            <span className="font-medium">Total Monthly Pot</span>
            <span className="text-base font-bold text-[#121316] font-display tabular-nums">
              {formatRawINR(totalPotInr)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#5F6368]">
            <span>Duration</span>
            <span className="font-semibold text-[#121316]">{numMembers} Months ({numMembers} Draws)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#5F6368]">
            <span>Required Security Buffer</span>
            <span className="font-semibold text-emerald-700">
              {formatRawINR(numInstallmentInr)} (100% Refundable)
            </span>
          </div>
        </div>

        {/* Technical Parameters */}
        {isTechnicalMode && (
          <div className="v-tech-box text-[11px] space-y-2">
            <p className="font-bold text-[#121316] flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-indigo-600" /> Advanced Protocol Parameters
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[#5F6368]">Max Discount Floor (%):</p>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={discountCapPercent}
                  onChange={(e) => setDiscountCapPercent(parseInt(e.target.value) || 30)}
                  className="v-input mt-1 font-mono text-xs"
                />
              </div>
              <div>
                <p className="text-[#5F6368]">Calculated Reserve Fee:</p>
                <p className="font-mono text-[#121316] mt-2 font-semibold">{calculatedReserveFeeBps} BPS ({(calculatedReserveFeeBps / 100).toFixed(2)}%)</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions with double-click protection */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-pill-secondary text-xs px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-pill-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              "Deploying..."
            ) : (
              <>
                Create Circle
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
