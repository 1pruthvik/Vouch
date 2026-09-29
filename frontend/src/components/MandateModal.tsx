import React, { useState } from "react";
import { X, CheckCircle2, ShieldCheck, Clock, ArrowRight, Lock, Zap, HelpCircle } from "lucide-react";
import { formatINR, formatRawINR } from "../utils/formatters";

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
  cycleDurationSeconds,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="cred-card max-w-md w-full p-6 sm:p-7 border-emerald-500/20 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Setup Auto-Debit Mandate</h2>
              <p className="text-xs text-slate-400">UPI Autopay & Seamless Monthly Contributions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 my-5">
          {/* Amount Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12151d] to-[#0d0f14] border border-white/10 text-center">
            <p className="text-xs text-slate-400 font-medium mb-1">Monthly Contribution Amount</p>
            <p className="text-3xl font-extrabold text-white font-display tracking-tight">
              {inrInstallment}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Auto-debits on cycle start
            </div>
          </div>

          {/* Mandate Summary Points */}
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <Clock className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Never miss a cycle</p>
                <p className="text-slate-400 text-[11px]">
                  Ensures your monthly deposit arrives on time so your credit reputation stays in Good Standing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Full Security & Transparency</p>
                <p className="text-slate-400 text-[11px]">
                  Funds go directly to the {groupName} autonomous pool. You earn monthly savings dividends on every round.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <Lock className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Cancel anytime</p>
                <p className="text-slate-400 text-[11px]">
                  You maintain full ownership of your security deposit and accumulated savings.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Details Box (Opt-in) */}
          {isTechnicalMode && (
            <div className="tech-details-box text-[11px] text-indigo-300 space-y-1">
              <p className="font-bold flex items-center gap-1 text-indigo-400">
                <ShieldCheck className="w-3 h-3" /> Protocol Mandate Execution
              </p>
              <p>• Smart Contract: <code className="text-slate-200">ChitGroup.payInstallment()</code></p>
              <p>• Raw Amount: <code className="text-slate-200">{installmentAmount} tMSTC</code></p>
              <p>• Auto-triggers Commit transition once all {totalMembers} members execute.</p>
            </div>
          )}
        </div>

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
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="btn-cred-primary text-xs w-full sm:w-auto"
          >
            {isProcessing ? "Authorizing..." : isMandateActive ? "Mandate Already Active" : "Confirm Auto-Debit Mandate"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
