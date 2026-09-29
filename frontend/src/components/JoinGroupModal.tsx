import React, { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Lock,
  ArrowRight,
  Code2,
  ShieldCheck,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key
} from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import {
  GroupGatekeeperService,
  GroupGatekeeperRecord
} from "../services/groupGatekeeperService";
import { UserKYCProfile } from "./KYCOnboarding";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGroupAddress?: string;
  defaultDepositINR?: number;
  userProfile?: UserKYCProfile | null;
  account?: string | null;
  onJoin: (groupAddress: string, bufferDeposit: string) => void;
  isTechnicalMode: boolean;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  defaultGroupAddress = "",
  defaultDepositINR = 10000,
  userProfile,
  account,
  onJoin,
  isTechnicalMode,
}) => {
  const [codeInput, setCodeInput] = useState(defaultGroupAddress);
  const [resolvedGroup, setResolvedGroup] = useState<GroupGatekeeperRecord | null>(null);
  const [bufferDepositINR, setBufferDepositINR] = useState<number | "">(defaultDepositINR);
  const [isJoining, setIsJoining] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (defaultGroupAddress) {
      setCodeInput(defaultGroupAddress);
      const res = GroupGatekeeperService.resolveGroup(defaultGroupAddress);
      setResolvedGroup(res);
    }
    if (defaultDepositINR) {
      setBufferDepositINR(defaultDepositINR);
    }
    setRequestSubmitted(false);
    setStatusMessage(null);
  }, [defaultGroupAddress, defaultDepositINR, isOpen]);

  // Live code resolution
  useEffect(() => {
    if (codeInput.trim()) {
      const res = GroupGatekeeperService.resolveGroup(codeInput.trim());
      setResolvedGroup(res);
    } else {
      setResolvedGroup(null);
    }
  }, [codeInput]);

  if (!isOpen) return null;

  const depositInr = Number(bufferDepositINR) || 0;
  const bufferMST = (depositInr / MST_TO_INR_RATE).toFixed(4);
  const effectiveAddress = resolvedGroup ? resolvedGroup.groupAddress : codeInput.trim();

  // Check if member request is pending or approved
  const requestStatus = account && effectiveAddress
    ? GroupGatekeeperService.getUserRequestStatus(effectiveAddress, account)
    : "none";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveAddress || !bufferDepositINR) return;

    // If gatekeeper enabled and not approved yet, submit join request to admin
    if (resolvedGroup?.isGatekeeperEnabled && requestStatus !== "approved") {
      GroupGatekeeperService.submitJoinRequest({
        groupAddress: effectiveAddress,
        groupCode: resolvedGroup.groupCode,
        userAddress: account || "0x0000000000000000000000000000000000000000",
        userName: userProfile?.fullName || "Verified Member",
        upiId: userProfile?.upiId || "member@upi",
        phone: userProfile?.phone || "+91 98765 43210",
        trustScore: userProfile?.trustScore || 98,
        bufferDepositINR: depositInr,
        bufferDepositMST: bufferMST,
      });
      setRequestSubmitted(true);
      setStatusMessage(
        "Your application has been submitted to the Chain Admin for Secret Passcode Authorization!"
      );
      return;
    }

    // Direct On-Chain Join
    try {
      setIsJoining(true);
      onJoin(effectiveAddress, bufferMST);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="v-overlay">
      <div className="v-modal p-6 sm:p-8 max-w-lg space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, rgba(0, 245, 160, 0.25) 0%, rgba(0, 217, 245, 0.1) 100%)",
                border: "1px solid rgba(0, 245, 160, 0.35)",
              }}
            >
              <UserPlus className="w-6 h-6 text-[#00F5A0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">Join Community Chain</h2>
                <span className="v-badge v-badge-emerald text-[9px]">Gated Access</span>
              </div>
              <p className="text-xs text-[#7A889B] mt-0.5">Enter secret Hashed Group Code or contract address</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7A889B] hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {requestSubmitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0] flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-display">Application Sent to Admin</h3>
              <p className="text-xs text-[#7A889B] max-w-sm mx-auto leading-relaxed">
                {statusMessage}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-left max-w-sm mx-auto space-y-1 font-mono">
              <p className="text-[#7A889B]">Chain Code: <span className="text-[#00F5A0]">{resolvedGroup?.groupCode || codeInput}</span></p>
              <p className="text-[#7A889B]">Applicant: <span className="text-white">{userProfile?.fullName || account}</span></p>
              <p className="text-[#7A889B]">Collateral Pledge: <span className="text-[#00D9F5]">₹{depositInr} ({bufferMST} tMSTC)</span></p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="v-btn-primary w-full text-xs font-bold py-3"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Chain Code / Address */}
            <div>
              <label className="block font-semibold text-[#E6EDF3] mb-1.5 flex items-center justify-between">
                <span>Enter Hashed Group Code or Address</span>
                <span className="text-[10px] text-[#7A889B]">e.g. VOUCH-ALPHA-8D33</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="VOUCH-XXXX-XXXX or 0x..."
                  className="v-input font-mono text-xs pl-8 uppercase"
                  required
                />
                <Search className="w-4 h-4 text-[#7A889B] absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Resolved Group Badge */}
              {resolvedGroup && (
                <div className="mt-2 p-3 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block font-display">{resolvedGroup.groupName}</span>
                    <span className="text-[10px] text-[#7A889B] font-mono">{resolvedGroup.groupAddress}</span>
                  </div>
                  <span className="v-badge v-badge-emerald text-[9px]">Verified Chain</span>
                </div>
              )}
            </div>

            {/* Refundable Collateral Buffer */}
            <div>
              <label className="block font-semibold text-[#E6EDF3] mb-1.5">
                Refundable Security Buffer Deposit (₹)
              </label>
              <input
                type="number"
                min="500"
                step="500"
                value={bufferDepositINR}
                onChange={(e) => setBufferDepositINR(e.target.value === "" ? "" : parseFloat(e.target.value))}
                placeholder="e.g. 10000"
                className="v-input text-xs font-mono text-[#00F5A0]"
                required
              />
              <span className="text-[10px] text-[#7A889B] mt-1 block">≈ {bufferMST} tMSTC</span>

              <div className="mt-2.5 p-3.5 rounded-xl bg-[#00D9F5]/[0.06] border border-[#00D9F5]/20 space-y-1">
                <p className="text-[11px] text-[#00D9F5] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Refundable Smart Escrow
                </p>
                <p className="text-[10px] text-[#7A889B] leading-relaxed">
                  Deposited into the autonomous chit contract. Returned in full upon final round draw settlement.
                </p>
              </div>
            </div>

            {/* Technical Pro Parameters */}
            {isTechnicalMode && (
              <div className="p-3 rounded-xl bg-violet-500/[0.08] border border-violet-500/25 text-[10px] font-mono space-y-1 text-[#A78BFA]">
                <p className="font-bold flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5" /> Call: ChitGroup.joinGroup(deposit: {bufferMST} tMSTC)
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="v-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isJoining || !effectiveAddress || !bufferDepositINR}
                className="v-btn-primary text-xs font-bold flex items-center gap-1.5"
              >
                {isJoining
                  ? "Joining on Chain..."
                  : resolvedGroup?.isGatekeeperEnabled && requestStatus !== "approved"
                  ? "Request Member Admission"
                  : "Deposit Collateral & Join"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

