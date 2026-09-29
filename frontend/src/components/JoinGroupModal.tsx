import React, { useState } from "react";
import { X, UserPlus, Lock, ArrowRight, Code2, ShieldCheck, Sparkles } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGroupAddress?: string;
  defaultDepositINR?: number;
  onJoin: (groupAddress: string, bufferDeposit: string) => void;
  isTechnicalMode: boolean;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  defaultGroupAddress = "",
  defaultDepositINR = 50000,
  onJoin,
  isTechnicalMode,
}) => {
  const [groupAddress, setGroupAddress] = useState(defaultGroupAddress);
  const [bufferDepositINR, setBufferDepositINR] = useState<number | "">(defaultDepositINR);
  const [isJoining, setIsJoining] = useState(false);

  React.useEffect(() => {
    if (defaultGroupAddress) {
      setGroupAddress(defaultGroupAddress);
    }
    if (defaultDepositINR) {
      setBufferDepositINR(defaultDepositINR);
    }
  }, [defaultGroupAddress, defaultDepositINR, isOpen]);

  if (!isOpen) return null;

  const depositInr = Number(bufferDepositINR) || 0;
  const bufferMST = (depositInr / MST_TO_INR_RATE).toFixed(4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupAddress || !bufferDepositINR) return;
    try {
      setIsJoining(true);
      onJoin(groupAddress, bufferMST);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="v-overlay">
      <div className="v-modal-card p-6 sm:p-8 max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00F5A0]/10 border border-[#00F5A0]/25 text-[#00F5A0] flex items-center justify-center">
              <UserPlus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Join a Community Chain</h2>
              <p className="text-xs text-[#94A3B8]">Enter private chain code or pool address</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#64748B] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Chain Code / Address */}
          <div>
            <label className="block font-semibold text-[#94A3B8] mb-1.5">
              Community Chain Code / Contract Address
            </label>
            <input
              type="text"
              value={groupAddress}
              onChange={(e) => setGroupAddress(e.target.value.trim())}
              placeholder="0x... or community code"
              className="v-input font-mono text-xs"
              required
            />
          </div>

          {/* Refundable Collateral Buffer */}
          <div>
            <label className="block font-semibold text-[#94A3B8] mb-1.5">
              Refundable Security Buffer Deposit (₹)
            </label>
            <input
              type="number"
              min="1000"
              step="500"
              value={bufferDepositINR}
              onChange={(e) => setBufferDepositINR(e.target.value === "" ? "" : parseFloat(e.target.value))}
              placeholder="e.g. 50000"
              className="v-input text-xs"
              required
            />
            <div className="mt-2 p-3 rounded-xl bg-[#00F5A0]/[0.04] border border-[#00F5A0]/15 space-y-1">
              <p className="text-[11px] text-[#00F5A0] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Refundable Default Defense
              </p>
              <p className="text-[10px] text-[#94A3B8] leading-relaxed">
                Deposited directly into the autonomous smart contract escrow. Returned in full upon 12-month term completion.
              </p>
            </div>
          </div>

          {/* Technical Box */}
          {isTechnicalMode && (
            <div className="p-3 rounded-xl bg-violet-500/[0.05] border border-violet-500/20 text-[10px] font-mono space-y-1 text-[#A78BFA]">
              <p className="font-bold flex items-center gap-1">
                <Code2 className="w-3 h-3" /> Contract Call: ChitGroup.joinGroup(value: {bufferMST} tMSTC)
              </p>
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
              disabled={isJoining || !groupAddress || !bufferDepositINR}
              className="v-btn-primary text-xs"
            >
              {isJoining ? "Joining on Chain..." : `Confirm & Join Chain`}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
