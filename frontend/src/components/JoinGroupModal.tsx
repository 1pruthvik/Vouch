import React, { useState } from "react";
import { X, UserPlus, Shield, Coins, Users, AlertCircle } from "lucide-react";

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
  const [bufferAmount, setBufferAmount] = useState("0.5");
  const [hasVoucher, setHasVoucher] = useState(false);
  const [voucherAddress, setVoucherAddress] = useState("");
  const [voucherStake, setVoucherStake] = useState("0.25");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="glass-card max-w-lg w-full p-6 border-indigo-500/30 relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white font-display">Join Chit Group</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              groupAddress,
              bufferAmount,
              voucherAddress: hasVoucher ? voucherAddress : undefined,
              voucherStake: hasVoucher ? voucherStake : undefined,
            });
            onClose();
          }}
          className="space-y-4 mt-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Chit Group Contract Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={groupAddress}
              onChange={(e) => setGroupAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Initial Collateral Buffer Deposit (tMSTC)
            </label>
            <input
              type="text"
              value={bufferAmount}
              onChange={(e) => setBufferAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              This deposit acts as your Layer 1 default protection and earns protocol yield.
            </p>
          </div>

          <div className="pt-2 border-t border-white/5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasVoucher}
                onChange={(e) => setHasVoucher(e.target.checked)}
                className="rounded border-white/20 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span>I have a Social Voucher backing me (Optional)</span>
            </label>

            {hasVoucher && (
              <div className="mt-3 space-y-3 p-3 rounded-lg bg-slate-900/60 border border-white/5">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Voucher Wallet Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={voucherAddress}
                    onChange={(e) => setVoucherAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Voucher Staked Backing (tMSTC)
                  </label>
                  <input
                    type="text"
                    value={voucherStake}
                    onChange={(e) => setVoucherStake(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2">
            <Shield className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <span>
              Joining registers your membership in the ChitGroup. Funds remain locked until the group reaches full membership and starts round 1.
            </span>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-sm">
              Confirm & Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
