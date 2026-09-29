import React, { useState } from "react";
import { X, UserPlus, Lock, ArrowRight, Code2 } from "lucide-react";
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
  defaultDepositINR = 5000,
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
            <label className="block font-semibold text-[#9ca3b4] mb-2">Circle Address / Invite Code</label>
            <input
              type="text"
              value={groupAddress}
              onChange={(e) => setGroupAddress(e.target.value.trim())}
              placeholder="0x..."
              className="v-input text-xs font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-[#9ca3b4] mb-2">Refundable Security Deposit (₹)</label>
            <input
              type="number"
              min="100"
              step="50"
              placeholder="Enter deposit in ₹"
              value={bufferDepositINR}
              onChange={(e) => setBufferDepositINR(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="v-input text-xs"
              required
            />
            {depositInr > 0 && (
              <p className="text-[11px] text-[#9ca3b4] mt-1.5 font-mono">
                ≈ {bufferMST} tMSTC (1 tMSTC = ₹{MST_TO_INR_RATE.toLocaleString()})
              </p>
            )}
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
              <p className="text-[#9ca3b4]">• Equivalent: <code className="text-white/80">{bufferMST} tMSTC</code></p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="v-btn-secondary text-xs">Cancel</button>
            <button
              type="submit"
              disabled={isJoining || !groupAddress || !bufferDepositINR}
              className="v-btn-primary text-xs"
            >
              {isJoining ? "Joining..." : `Join Circle (${depositInr > 0 ? formatRawINR(depositInr) : "Deposit"})`}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
