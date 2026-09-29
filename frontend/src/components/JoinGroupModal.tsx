import React, { useState, useEffect } from "react";
import { UserPlus, Lock, ArrowRight, Code2 } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { Modal } from "./ui/Modal";

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

  useEffect(() => {
    if (defaultGroupAddress) {
      setGroupAddress(defaultGroupAddress);
    }
    if (defaultDepositINR) {
      setBufferDepositINR(defaultDepositINR);
    }
  }, [defaultGroupAddress, defaultDepositINR, isOpen]);

  const depositInr = Number(bufferDepositINR) || 0;
  const bufferMST = (depositInr / MST_TO_INR_RATE).toFixed(4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupAddress || !bufferDepositINR || isJoining) return;
    try {
      setIsJoining(true);
      await onJoin(groupAddress, bufferMST);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join a Savings Circle"
      description="Enter circle contract address and deposit your security buffer"
      icon={<UserPlus className="w-5 h-5 text-[#946800] stroke-[2.5]" />}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-[#5F6368] mb-1.5">Circle Address / Invite Code</label>
          <input
            type="text"
            value={groupAddress}
            onChange={(e) => setGroupAddress(e.target.value.trim())}
            placeholder="0x..."
            className="v-input font-mono text-xs"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block font-semibold text-[#5F6368] mb-1.5">Refundable Security Deposit (₹)</label>
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
            <p className="text-[11px] text-[#5F6368] mt-1.5 font-mono">
              ≈ {bufferMST} tMSTC (1 tMSTC = ₹{MST_TO_INR_RATE.toLocaleString()})
            </p>
          )}
          <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            100% refundable when all circle rounds complete.
          </p>
        </div>

        {/* Technical Details */}
        {isTechnicalMode && (
          <div className="v-tech-box text-[11px] space-y-1">
            <p className="font-bold text-[#121316] flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-indigo-600" /> Contract Execution
            </p>
            <p className="text-[#5F6368]">• Calls <code className="text-[#121316] font-mono">ChitGroup.joinGroup{`{value: deposit}`}()</code></p>
            <p className="text-[#5F6368]">• Equivalent: <code className="text-[#121316] font-mono">{bufferMST} tMSTC</code></p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isJoining}
            className="btn-pill-secondary text-xs px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isJoining || !groupAddress || !bufferDepositINR}
            className="btn-pill-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
          >
            {isJoining ? "Joining Circle..." : `Join Circle (${depositInr > 0 ? formatRawINR(depositInr) : "Deposit"})`}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </Modal>
  );
};
