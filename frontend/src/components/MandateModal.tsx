import React, { useState } from "react";
import { X, CheckCircle2, ShieldCheck, Clock, ArrowRight, Lock, Zap } from "lucide-react";
import { formatINR } from "../utils/formatters";

interface MandateModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  installmentAmount: string;
  cycleDurationSeconds: number;
  totalMembers: number;
  isMandateActive: boolean;
  onActivateMandate: () => Promise<void>;
  isTechnicalMode: boolean;
}

export const MandateModal: React.FC<MandateModalProps> = ({
  isOpen,
  onClose,
  groupName,
  installmentAmount,
  totalMembers,
  isMandateActive,
  onActivateMandate,
  isTechnicalMode,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const inrInstallment = formatINR(installmentAmount);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onActivateMandate();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#0e0e0e] max-w-md w-full p-8 rounded-xl relative shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-royal-600 text-white flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Auto-Debit Mandate</h2>
              <p className="text-xs text-neutral-400">Automated recurring contributions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 my-5">
          {/* Amount Card */}
          <div className="p-5 rounded-xl bg-black text-center">
            <p className="text-xs text-neutral-400 font-medium mb-1">Monthly Contribution</p>
            <p className="text-3xl font-extrabold text-white font-display tracking-tight">
              {inrInstallment}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-[#141414] text-[11px] font-semibold text-neutral-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-royal-400" />
              On-chain allowance authorization
            </div>
          </div>

          {/* Mandate Summary Points */}
          <div className="space-y-2.5 text-xs text-neutral-300">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-black">
              <Clock className="w-4 h-4 text-royal-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Automated Execution</p>
                <p className="text-neutral-400 text-[11px]">
                  Executes contribution automatically at each cycle start so your profile stays solvent.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-black">
              <ShieldCheck className="w-4 h-4 text-royal-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Smart Contract Escrow</p>
                <p className="text-neutral-400 text-[11px]">
                  Funds go directly to {groupName || "the ChitGroup"} autonomous pool on MST Testnet.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-black">
              <Lock className="w-4 h-4 text-royal-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Full Capital Ownership</p>
                <p className="text-neutral-400 text-[11px]">
                  Security deposit and accumulated dividends remain locked to your address.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Details Box (Opt-in) */}
          {isTechnicalMode && (
            <div className="tech-details-box text-[11px] text-neutral-300 space-y-1">
              <p className="font-bold flex items-center gap-1 text-royal-400">
                <ShieldCheck className="w-3 h-3" /> Protocol Mandate Execution
              </p>
              <p>• Smart Contract: <code className="text-white">ChitGroup.payInstallment()</code></p>
              <p>• Token Amount: <code className="text-white">{installmentAmount} tMSTC</code></p>
              <p>• Total Group Members: <code className="text-white">{totalMembers}</code></p>
            </div>
          )}
        </div>

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
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="btn-primary"
          >
            {isProcessing ? "Authorizing..." : isMandateActive ? "Mandate Active" : "Confirm Mandate"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
