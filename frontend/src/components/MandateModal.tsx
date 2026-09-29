import React, { useState } from "react";
import { X, CheckCircle2, ShieldCheck, Clock, ArrowRight, Zap, Smartphone } from "lucide-react";
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
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiId, setUpiId] = useState("");
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
      icon: <Clock className="w-4 h-4 text-red-500" />,
      title: "Automatic on-time contributions",
      desc: "Your monthly installment automatically debits on round start.",
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-red-500" />,
      title: "Zero late penalties",
      desc: "Avoid accidental defaults or collateral deductions.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="bg-black max-w-lg w-full p-8 rounded-xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-500">
            <Zap className="w-4 h-4" />
            Recurring Auto-Debit Mandate
          </div>
          <h2 className="text-xl font-bold text-white font-display">
            UPI AutoPay Authorization
          </h2>
          <p className="text-xs text-neutral-400">
            Authorize recurring monthly debits for <strong className="text-white">{groupName || "Savings Circle"}</strong>
          </p>
        </div>

        <div className="p-4 rounded-lg bg-neutral-950 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Monthly Contribution:</span>
            <span className="font-bold text-white text-sm font-display">{inrInstallment}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Duration:</span>
            <span className="font-bold text-white">{totalMembers} Months</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Current Mandate Status:</span>
            <span className={`font-bold ${isMandateActive ? "text-green-400" : "text-neutral-400"}`}>
              {isMandateActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {!isMandateActive && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-red-500" />
              Enter UPI ID / VPA
            </label>
            <input
              type="text"
              placeholder="e.g. yourname@okhdfcbank"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full bg-neutral-950 rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none"
            />
          </div>
        )}

        <div className="space-y-3">
          {features.map((feat, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="p-1 text-red-500 mt-0.5">
                {feat.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{feat.title}</p>
                <p className="text-[11px] text-neutral-400">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          {isMandateActive ? (
            <button
              onClick={handleDisable}
              className="btn-secondary w-full text-red-400"
            >
              Cancel AutoPay Mandate
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="btn-primary w-full py-3"
            >
              {isProcessing ? "Authorizing..." : "Authorize UPI AutoPay"}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
