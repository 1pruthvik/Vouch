import React, { useState } from "react";
import { X, UserPlus, ShieldCheck, Lock, ArrowRight, Code2, CheckCircle2 } from "lucide-react";
import { formatRawINR } from "../utils/formatters";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (groupAddress: string, bufferDeposit: string) => void;
  isTechnicalMode: boolean;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onJoin,
  isTechnicalMode,
}) => {
  const [groupAddress, setGroupAddress] = useState("");
  const [bufferDepositINR, setBufferDepositINR] = useState(5000);
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupAddress) return;
    try {
      setIsJoining(true);
      const bufferMST = (bufferDepositINR / 10000).toFixed(4);
      onJoin(groupAddress, bufferMST);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="cred-card max-w-md w-full p-6 sm:p-7 border-emerald-500/20 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Join a Savings Circle</h2>
              <p className="text-xs text-slate-400">Enter your circle invite code</p>
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
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Circle Code / Invite Address</label>
            <input
              type="text"
              value={groupAddress}
              onChange={(e) => setGroupAddress(e.target.value.trim())}
              placeholder="0x... or Circle Invite Link"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d11] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Refundable Security Deposit (₹)</label>
            <input
              type="number"
              min="500"
              step="500"
              value={bufferDepositINR}
              onChange={(e) => setBufferDepositINR(parseInt(e.target.value) || 500)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d11] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              100% refundable at the completion of all circle rounds.
            </p>
          </div>

          {/* Technical Details */}
          {isTechnicalMode && (
            <div className="tech-details-box text-[11px] space-y-1">
              <p className="font-bold text-indigo-300 flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" /> Contract Execution
              </p>
              <p>• Calls <code className="text-slate-200">ChitGroup.joinGroup{`{value: deposit}`}()</code></p>
              <p>• Equivalent: <code className="text-slate-200">{(bufferDepositINR / 10000).toFixed(4)} tMSTC</code></p>
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
              disabled={isJoining || !groupAddress}
              className="btn-cred-primary text-xs"
            >
              {isJoining ? "Joining..." : `Confirm & Join (${formatRawINR(bufferDepositINR)})`}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
