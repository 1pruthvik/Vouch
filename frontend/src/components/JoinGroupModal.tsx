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
    <div className="v-overlay">
      <div className="v-modal p-6 sm:p-7 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(45, 212, 168, 0.1)', border: '1px solid rgba(45, 212, 168, 0.2)' }}>
              <UserPlus className="w-5 h-5 text-[#2dd4a8] stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Join a Savings Circle</h2>
              <p className="text-xs text-[#5f6578]">Enter your circle invite code</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#5f6578] hover:text-white hover:bg-white/5 transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-xs">
          <div>
            <label className="block font-semibold text-[#9ca3b4] mb-2">Circle Code / Invite Address</label>
            <input
              type="text"
              value={groupAddress}
              onChange={(e) => setGroupAddress(e.target.value.trim())}
              placeholder="0x... or Circle Invite Link"
              className="v-input text-xs font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-[#9ca3b4] mb-2">Refundable Security Deposit (₹)</label>
            <input
              type="number"
              min="500"
              step="500"
              value={bufferDepositINR}
              onChange={(e) => setBufferDepositINR(parseInt(e.target.value) || 500)}
              className="v-input text-xs"
            />
            <p className="text-[11px] text-[#5f6578] mt-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#2dd4a8]" />
              100% refundable when all circle rounds complete.
            </p>
          </div>

          {/* Technical Details */}
          {isTechnicalMode && (
            <div className="v-tech-box text-[11px] space-y-1">
              <p className="font-bold text-[#8b5cf6] flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5" /> Contract Execution
              </p>
              <p className="text-[#9ca3b4]">• Calls <code className="text-white/80">ChitGroup.joinGroup{`{value: deposit}`}()</code></p>
              <p className="text-[#9ca3b4]">• Equivalent: <code className="text-white/80">{(bufferDepositINR / 10000).toFixed(4)} tMSTC</code></p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="v-btn-secondary text-xs">Cancel</button>
            <button
              type="submit"
              disabled={isJoining || !groupAddress}
              className="v-btn-primary text-xs"
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
