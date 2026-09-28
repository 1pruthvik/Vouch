import React, { useState } from "react";
import { X, UserPlus, Shield } from "lucide-react";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    groupAddress: string;
    bufferAmount: string;
    voucherAddress?: string;
    voucherStake?: string;
  }) => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [groupAddress, setGroupAddress] = useState("");
  const [bufferAmount, setBufferAmount] = useState("");
  const [hasVoucher, setHasVoucher] = useState(false);
  const [voucherAddress, setVoucherAddress] = useState("");
  const [voucherStake, setVoucherStake] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#0e0e0e] max-w-lg w-full p-8 rounded-xl relative shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-neutral-300" />
            <h2 className="text-lg font-bold text-white font-display">Join Chit Group</h2>
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
              groupAddress,
              bufferAmount: bufferAmount || "0",
              voucherAddress: hasVoucher ? voucherAddress : undefined,
              voucherStake: hasVoucher ? voucherStake : undefined,
            });
            onClose();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Chit Group Contract Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={groupAddress}
              onChange={(e) => setGroupAddress(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-black text-white text-sm font-mono focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Initial Collateral Buffer Deposit (tMSTC)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={bufferAmount}
              onChange={(e) => setBufferAmount(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-black text-white text-sm focus:outline-none"
              required
            />
            <p className="text-xs text-neutral-400 mt-1">
              Deposited buffer acts as Layer 1 default protection and earns protocol yield.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-800">
            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasVoucher}
                onChange={(e) => setHasVoucher(e.target.checked)}
                className="rounded bg-black text-royal-600 focus:ring-0"
              />
              <span>Social Voucher Backing (Optional)</span>
            </label>

            {hasVoucher && (
              <div className="mt-3 space-y-3 p-4 rounded-lg bg-black">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Voucher Wallet Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={voucherAddress}
                    onChange={(e) => setVoucherAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0e0e0e] text-white text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Voucher Staked Backing (tMSTC)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={voucherStake}
                    onChange={(e) => setVoucherStake(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0e0e0e] text-white text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-black text-xs text-neutral-400 flex items-start gap-2">
            <Shield className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
            <span>
              Registration locks your membership in the ChitGroup. The cycle starts once all member slots are filled.
            </span>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Confirm & Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
