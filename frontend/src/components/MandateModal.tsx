import React, { useState } from "react";
import { CheckCircle2, ShieldCheck, Clock, ArrowRight, Lock, Zap, Smartphone, AlertCircle } from "lucide-react";
import { formatINR } from "../utils/formatters";
import { Modal } from "./ui/Modal";

interface MandateModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  installmentAmount: string;
  cycleDurationSeconds: number;
  totalMembers: number;
  isMandateActive: boolean;
  onActivateMandate: () => Promise<void>;
  onCancelMandate?: () => void;
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
  onCancelMandate,
  isTechnicalMode,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiId, setUpiId] = useState("user@okhdfcbank");
  const inrInstallment = formatINR(installmentAmount);

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

  const handleDisable = () => {
    if (onCancelMandate) {
      onCancelMandate();
    }
    onClose();
  };

  const features = [
    {
      icon: <Clock className="w-4 h-4 text-[#E9B949]" />,
      title: "Never miss a cycle draw",
      desc: "Your monthly installment automatically debits on round start so your solvency standing stays green.",
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      title: "Zero Penalty & Direct Escrow",
      desc: `Funds go straight into ${groupName || "the Circle"} autonomous vault on MST Testnet.`,
    },
    {
      icon: <Lock className="w-4 h-4 text-indigo-600" />,
      title: "100% Control · Cancel Anytime",
      desc: "You maintain complete control. Disable AutoPay with one click at any time without fees.",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="UPI AutoPay & Mandate"
      description="Recurring automated community savings on-chain"
      icon={<Zap className="w-5 h-5 text-[#946800]" />}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Amount Card */}
        <div className="p-5 rounded-2xl text-center bg-white border border-black/[0.06] shadow-sm">
          <p className="text-xs text-[#5F6368] font-medium mb-1">Monthly AutoPay Deduction</p>
          <p className="text-3xl font-extrabold text-[#121316] font-display tracking-tight tabular-nums">
            {inrInstallment}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className={`v-badge ${isMandateActive ? 'v-badge-green' : 'v-badge-amber'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isMandateActive ? 'bg-emerald-600' : 'bg-amber-600'}`} />
              {isMandateActive ? "AutoPay Active ✓" : "Mandate Not Configured"}
            </span>
          </div>
        </div>

        {/* UPI ID Setup */}
        <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-2">
          <label className="block text-xs font-semibold text-[#5F6368] flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            Linked UPI / Payment ID
          </label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="e.g. mobile@upi or username@okhdfcbank"
            className="v-input text-xs"
          />
          <p className="text-[11px] text-[#8F959E]">
            Simulated e-Mandate authorization via smart contract allowance.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-2">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-black/[0.05]">
              <div className="mt-0.5 flex-shrink-0">{f.icon}</div>
              <div>
                <p className="text-xs font-semibold text-[#121316]">{f.title}</p>
                <p className="text-[11px] text-[#5F6368] mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Details */}
        {isTechnicalMode && (
          <div className="v-tech-box text-[11px] space-y-1">
            <p className="font-bold text-[#121316] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> On-Chain Mandate Specs
            </p>
            <p className="text-[#5F6368]">• Contract Method: <code className="text-[#121316] font-mono">ChitGroup.payInstallment()</code></p>
            <p className="text-[#5F6368]">• Amount: <code className="text-[#121316] font-mono">{installmentAmount} tMSTC</code></p>
            <p className="text-[#5F6368]">• Execution Trigger: Keeper bot calls automatically at cycle start</p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 flex items-center justify-between gap-3">
          {isMandateActive ? (
            <button
              type="button"
              onClick={handleDisable}
              className="px-4 py-2 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200"
            >
              Cancel AutoPay
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="btn-pill-secondary text-xs px-4 py-2"
            >
              Close
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="btn-pill-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
          >
            {isProcessing ? "Authorizing..." : isMandateActive ? "Update AutoPay" : "Enable UPI AutoPay"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
