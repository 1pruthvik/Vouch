import React, { useState } from "react";
import { X, CheckCircle2, ShieldCheck, Clock, ArrowRight, Lock, Zap, Smartphone, AlertCircle } from "lucide-react";
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

  const handleDisable = () => {
    if (onCancelMandate) {
      onCancelMandate();
    }
    onClose();
  };

  const features = [
    {
      icon: <Clock className="w-4 h-4 text-[#f5a623]" />,
      title: "Never miss a cycle draw",
      desc: "Your monthly installment automatically debits on round start so your solvency standing stays green.",
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-[#2dd4a8]" />,
      title: "Zero Penalty & Direct Escrow",
      desc: `Funds go straight into ${groupName || "the Circle"} autonomous vault on MST Testnet.`,
    },
    {
      icon: <Lock className="w-4 h-4 text-[#8b5cf6]" />,
      title: "100% Control · Cancel Anytime",
      desc: "You maintain complete control. Disable AutoPay with one click at any time without fees.",
    },
  ];

  return (
    <div className="v-overlay">
      <div className="v-modal p-6 sm:p-7 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(45, 212, 168, 0.1)', border: '1px solid rgba(45, 212, 168, 0.2)' }}>
              <Zap className="w-5 h-5 text-[#2dd4a8] stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">UPI AutoPay & Mandate</h2>
              <p className="text-xs text-[#5f6578]">Recurring automated savings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#5f6578] hover:text-white hover:bg-white/5 transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 mt-5">
          {/* Amount Card */}
          <div className="p-5 rounded-2xl text-center relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-[#9ca3b4] font-medium mb-1">Monthly AutoPay Deduction</p>
            <p className="text-3xl font-bold text-white font-display tracking-tight">
              {inrInstallment}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className={`v-badge ${isMandateActive ? 'v-badge-green' : 'v-badge-amber'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isMandateActive ? 'bg-[#2dd4a8]' : 'bg-[#f5a623]'}`} />
                {isMandateActive ? "AutoPay Active ✓" : "Mandate Not Configured"}
              </span>
            </div>
          </div>

          {/* UPI ID Setup */}
          <div className="p-4 rounded-2xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <label className="block text-xs font-semibold text-[#9ca3b4] flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#2dd4a8]" />
              Linked UPI / Payment ID
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. mobile@upi or username@okhdfcbank"
              className="v-input text-xs"
            />
            <p className="text-[11px] text-[#5f6578]">
              Simulated e-Mandate authorization via smart contract allowance.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-2.5">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="mt-0.5 flex-shrink-0">{f.icon}</div>
                <div>
                  <p className="text-xs font-semibold text-white">{f.title}</p>
                  <p className="text-[11px] text-[#9ca3b4] mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Technical Details */}
          {isTechnicalMode && (
            <div className="v-tech-box text-[11px] space-y-1">
              <p className="font-bold text-[#8b5cf6] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> On-Chain Mandate Specs
              </p>
              <p className="text-[#9ca3b4]">• Contract Method: <code className="text-white/80">ChitGroup.payInstallment()</code></p>
              <p className="text-[#9ca3b4]">• Amount: <code className="text-white/80">{installmentAmount} tMSTC</code></p>
              <p className="text-[#9ca3b4]">• Execution Trigger: Keeper bot calls automatically at cycle start</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-5 flex items-center justify-between gap-3">
          {isMandateActive ? (
            <button
              type="button"
              onClick={handleDisable}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
            >
              Cancel AutoPay
            </button>
          ) : (
            <button type="button" onClick={onClose} className="v-btn-secondary text-xs">
              Close
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="v-btn-primary text-xs"
          >
            {isProcessing ? "Authorizing..." : isMandateActive ? "Update AutoPay" : "Enable UPI AutoPay"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
