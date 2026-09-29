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

  const features = [
    { icon: <Clock className="w-4 h-4 text-[#f5a623]" />, title: "Never miss a cycle", desc: "Your monthly deposit arrives on time so your standing stays green." },
    { icon: <ShieldCheck className="w-4 h-4 text-[#2dd4a8]" />, title: "Full transparency", desc: `Funds go directly to the ${groupName || "Circle"} autonomous pool. You earn dividends every round.` },
    { icon: <Lock className="w-4 h-4 text-[#8b5cf6]" />, title: "Cancel anytime", desc: "You maintain full ownership of your deposit and accumulated savings." },
  ];

  return (
    <div className="v-overlay">
      <div className="v-modal p-6 sm:p-7 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245, 166, 35, 0.1)', border: '1px solid rgba(245, 166, 35, 0.2)' }}>
              <Zap className="w-5 h-5 text-[#f5a623] stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Setup Auto-Debit</h2>
              <p className="text-xs text-[#5f6578]">Seamless monthly contributions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#5f6578] hover:text-white hover:bg-white/5 transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 mt-5">
          {/* Amount */}
          <div className="p-5 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-[#5f6578] font-medium mb-1">Monthly Contribution</p>
            <p className="text-3xl font-bold text-white font-display tracking-tight">
              {inrInstallment}
            </p>
            <div className="v-badge v-badge-green mt-3 mx-auto" style={{ width: 'fit-content' }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Auto-debits on cycle start
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2.5 stagger-children">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="mt-0.5 flex-shrink-0">{f.icon}</div>
                <div>
                  <p className="text-xs font-semibold text-white">{f.title}</p>
                  <p className="text-[11px] text-[#5f6578] mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Technical */}
          {isTechnicalMode && (
            <div className="v-tech-box text-[11px] space-y-1">
              <p className="font-bold text-[#8b5cf6] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Protocol Mandate Execution
              </p>
              <p className="text-[#9ca3b4]">• Smart Contract: <code className="text-white/80">ChitGroup.payInstallment()</code></p>
              <p className="text-[#9ca3b4]">• Raw Amount: <code className="text-white/80">{installmentAmount} tMSTC</code></p>
              <p className="text-[#9ca3b4]">• Auto-triggers Commit transition once all {totalMembers} members execute.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-5 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="v-btn-secondary text-xs">Cancel</button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="v-btn-primary text-xs w-full sm:w-auto"
          >
            {isProcessing ? "Authorizing..." : isMandateActive ? "Mandate Active" : "Confirm Auto-Debit"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
