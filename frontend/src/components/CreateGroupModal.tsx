import React, { useState } from "react";
import { X, Plus, Shield, IndianRupee, ArrowRight } from "lucide-react";

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
    installmentInr: number;
  }) => void;
}

// 1 tMSTC = ₹1,000 (Internal conversion rate)
export const INR_PER_TMSTC = 1000;

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

  // Calculate internal token values and fee bps
  const numInstallmentInr = Number(installmentInr) || 0;
  const numMembers = Number(memberCount) || 1;
  const installmentTokens = (numInstallmentInr / INR_PER_TMSTC).toFixed(4);
  const totalPotInr = numMembers * numInstallmentInr;
  const numReserveFeeInr = Number(reserveFeeInr) || 0;

  // Calculate reserve fee BPS from rupees
  const calculatedReserveFeeBps = totalPotInr > 0
    ? Math.min(2000, Math.max(100, Math.round((numReserveFeeInr / totalPotInr) * 10000)))
    : 500;

  // Convert Months to Seconds (1 month = 30 days = 2,592,000 seconds)
  const numMonths = Number(cycleDurationMonths) || 1;
  const cycleDurationSeconds = numMonths * 30 * 24 * 3600;

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
              installmentAmount: installmentTokens,
              cycleDuration: cycleDurationSeconds,
              discountCapBps: 3000, // Standard 30% discount cap
              reserveFeeBps: calculatedReserveFeeBps,
              installmentInr: numInstallmentInr,
            });
            onClose();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Group Name
            </label>
            <input
              type="text"
              placeholder="Community Savings Circle"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Member Count
              </label>
              <input
                type="number"
                min="2"
                max="50"
                placeholder="5"
                value={memberCount}
                onChange={(e) => setMemberCount(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Installment (Rupees / ₹)
              </label>
              <input
                type="number"
                min="100"
                step="50"
                placeholder="5000"
                value={installmentInr}
                onChange={(e) => setInstallmentInr(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
                required
              />
              {numInstallmentInr > 0 && (
                <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                  ≈ {installmentTokens} tMSTC (1 tMSTC = ₹{INR_PER_TMSTC.toLocaleString()})
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Reserve Fee (Rupees / ₹)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                placeholder="250"
                value={reserveFeeInr}
                onChange={(e) => setReserveFeeInr(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
                required
              />
              {totalPotInr > 0 && numReserveFeeInr > 0 && (
                <p className="text-[11px] text-neutral-400 mt-1">
                  {(calculatedReserveFeeBps / 100).toFixed(1)}% of total pot (₹{totalPotInr.toLocaleString()})
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Round Cycle (Months)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                placeholder="1"
                value={cycleDurationMonths}
                onChange={(e) => setCycleDurationMonths(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
                required
              />
              {numMonths > 0 && (
                <p className="text-[11px] text-neutral-400 mt-1">
                  {numMonths} {numMonths === 1 ? "Month" : "Months"} per round cycle
                </p>
              )}
            </div>
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
