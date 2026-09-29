import React, { useState } from "react";
import { X, UserPlus, ArrowRight } from "lucide-react";
import { MST_TO_INR_RATE } from "../utils/formatters";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="bg-black max-w-md w-full p-8 rounded-xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-500">
            <UserPlus className="w-4 h-4" />
            Join Savings Circle
          </div>
          <h2 className="text-xl font-bold text-white font-display">
            Enter Circle Contract
          </h2>
          <p className="text-xs text-neutral-400">
            Provide the circle address and deposit refundable collateral.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-300 mb-2">Circle Address</label>
            <input
              type="text"
              value={groupAddress}
              onChange={(e) => setGroupAddress(e.target.value.trim())}
              placeholder="0x..."
              className="w-full bg-neutral-950 rounded-lg px-4 py-3 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-300 mb-2">Refundable Security Deposit (₹)</label>
            <input
              type="number"
              min="100"
              step="50"
              placeholder="Enter deposit in ₹"
              value={bufferDepositINR}
              onChange={(e) => setBufferDepositINR(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full bg-neutral-950 rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none"
              required
            />
            {depositInr > 0 && (
              <p className="text-[11px] text-neutral-500 mt-1.5 font-mono">
                ≈ {bufferMST} tMSTC (1 tMSTC = ₹{MST_TO_INR_RATE.toLocaleString()})
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isJoining}
              className="btn-primary w-full py-3"
            >
              {isJoining ? "Depositing Collateral..." : "Confirm & Join Circle"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
