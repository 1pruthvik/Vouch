import React, { useState } from "react";
import { X, UserPlus, Lock, ArrowRight, Code2 } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";

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
  const [bufferDepositINR, setBufferDepositINR] = useState<number | "">("");
  const [isJoining, setIsJoining] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#0e0e0e] max-w-md w-full p-8 rounded-xl relative shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-royal-600 text-white flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Join Chit Group</h2>
              <p className="text-xs text-neutral-400">Enter group contract address</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">Group Contract Address</label>
            <input
              type="text"
              value={groupAddress}
              onChange={(e) => setGroupAddress(e.target.value.trim())}
              placeholder="0x..."
              className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-xs font-mono focus:outline-none placeholder:text-neutral-700"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">Refundable Security Deposit (₹)</label>
            <input
              type="number"
              min="100"
              step="50"
              placeholder="Enter deposit in ₹"
              value={bufferDepositINR}
              onChange={(e) => setBufferDepositINR(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm focus:outline-none placeholder:text-neutral-700"
              required
            />
            {depositInr > 0 && (
              <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                ≈ {bufferMST} tMSTC (1 tMSTC = ₹{MST_TO_INR_RATE.toLocaleString()})
              </p>
            )}
            <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-royal-400" />
              100% refundable at the completion of all circle rounds.
            </p>
          </div>

          {/* Technical Details */}
          {isTechnicalMode && (
            <div className="tech-details-box text-[11px] space-y-1">
              <p className="font-bold text-neutral-300 flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-royal-400" /> Contract Execution
              </p>
              <p>• Calls <code className="text-neutral-200">ChitGroup.joinGroup{`{value: deposit}`}()</code></p>
              <p>• Equivalent: <code className="text-neutral-200">{bufferMST} tMSTC</code></p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isJoining || !groupAddress || !bufferDepositINR}
              className="btn-primary"
            >
              {isJoining ? "Joining..." : `Join Group (${depositInr > 0 ? formatRawINR(depositInr) : "Deposit"})`}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
