import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Key,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Check,
  UserCheck,
  ArrowRight,
  Sparkles,
  Lock
} from "lucide-react";
import {
  GroupGatekeeperService,
  GroupGatekeeperRecord,
  PendingJoinRequest
} from "../services/groupGatekeeperService";
import { formatRawINR } from "../utils/formatters";

interface AdminGatekeeperModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupAddress: string;
  groupName: string;
  currentAccount: string | null;
  onMemberApproved?: () => void;
}

export const AdminGatekeeperModal: React.FC<AdminGatekeeperModalProps> = ({
  isOpen,
  onClose,
  groupAddress,
  groupName,
  currentAccount,
  onMemberApproved,
}) => {
  const [record, setRecord] = useState<GroupGatekeeperRecord | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingJoinRequest[]>([]);
  const [secretInput, setSecretInput] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadGatekeeperData = () => {
    if (!groupAddress) return;
    const rec = GroupGatekeeperService.getRecordByAddress(groupAddress);
    setRecord(rec);
    const requests = GroupGatekeeperService.getGroupPendingRequests(groupAddress);
    setPendingRequests(requests);
  };

  useEffect(() => {
    if (isOpen && groupAddress) {
      loadGatekeeperData();
    }
  }, [isOpen, groupAddress]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApprove = (reqId: string) => {
    if (!secretInput.trim()) {
      setStatusMsg({ text: "Please enter your Admin Secret Passcode to authorize.", isError: true });
      return;
    }

    const res = GroupGatekeeperService.approveMemberRequest(reqId, secretInput);
    if (res.success) {
      setStatusMsg({ text: res.message, isError: false });
      loadGatekeeperData();
      if (onMemberApproved) onMemberApproved();
    } else {
      setStatusMsg({ text: res.message, isError: true });
    }
  };

  const handleReject = (reqId: string) => {
    GroupGatekeeperService.rejectMemberRequest(reqId);
    setStatusMsg({ text: "Request rejected.", isError: false });
    loadGatekeeperData();
  };

  return (
    <div className="v-overlay">
      <div className="v-modal p-6 sm:p-8 max-w-2xl space-y-6">
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
              <ShieldCheck className="w-6 h-6 text-[#00F5A0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">Gatekeeper Approval Console</h2>
                <span className="v-badge v-badge-emerald text-[9px]">Admin Panel</span>
              </div>
              <p className="text-xs text-[#7A889B] mt-0.5">{groupName} · Member Gating & Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7A889B] hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Code & Admin Secret Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Shareable Group Code */}
          <div
            className="p-4 rounded-2xl space-y-2"
            style={{ background: "rgba(13, 19, 31, 0.8)", border: "1px solid rgba(0, 245, 160, 0.25)" }}
          >
            <span className="text-[10px] text-[#00F5A0] font-semibold uppercase tracking-wider block">
              Shareable Hashed Group Code
            </span>
            <div className="flex items-center justify-between gap-2">
              <code className="text-white font-mono font-bold text-sm tracking-wide">
                {record?.groupCode || `VOUCH-${groupAddress.substring(2, 6).toUpperCase()}-CHAIN`}
              </code>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    record?.groupCode || `VOUCH-${groupAddress.substring(2, 6).toUpperCase()}-CHAIN`,
                    "grp-code"
                  )
                }
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#00F5A0] transition-all"
                title="Copy Invite Code"
              >
                {copiedKey === "grp-code" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-[#7A889B]">Share this code with participants to apply to this chain.</p>
          </div>

          {/* Admin Secret Passcode */}
          <div
            className="p-4 rounded-2xl space-y-2"
            style={{ background: "rgba(13, 19, 31, 0.8)", border: "1px solid rgba(121, 40, 202, 0.3)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#A78BFA] font-semibold uppercase tracking-wider block">
                Admin Secret Passcode
              </span>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-[10px] text-[#00D9F5] hover:underline flex items-center gap-1"
              >
                {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showSecret ? "Hide" : "Reveal"}</span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-[#A78BFA] font-mono font-bold text-sm tracking-wide">
                {showSecret ? record?.adminSecretPlain || "ADM-7892-SEC" : "••••••••••••"}
              </code>
              {showSecret && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(record?.adminSecretPlain || "ADM-7892-SEC", "adm-sec")}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#A78BFA] transition-all"
                >
                  {copiedKey === "adm-sec" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            <p className="text-[10px] text-[#7A889B]">Required by you (Admin) to approve pending applicants.</p>
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.isError
                ? "bg-red-950/40 border border-red-500/20 text-red-200"
                : "bg-emerald-950/40 border border-emerald-500/20 text-emerald-200"
            }`}
          >
            {statusMsg.isError ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-[#00F5A0]" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Pending Requests List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00F5A0]" />
              Pending Member Applications ({pendingRequests.length})
            </h3>
            <span className="text-[11px] text-[#7A889B]">Requires Secret Code Authorization</span>
          </div>

          {pendingRequests.length === 0 ? (
            <div
              className="p-8 rounded-2xl text-center space-y-2"
              style={{ background: "rgba(13, 19, 31, 0.5)", border: "1px dashed rgba(255, 255, 255, 0.1)" }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto text-[#7A889B]">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-white">No Pending Join Requests</p>
              <p className="text-[11px] text-[#7A889B] max-w-sm mx-auto">
                When prospective members submit this chain's Group Code with their KYC credentials, they will appear here for your approval.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl space-y-3"
                  style={{
                    background: "rgba(13, 19, 31, 0.8)",
                    border: "1px solid rgba(0, 245, 160, 0.2)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00F5A0] to-[#00D9F5] text-[#06080F] font-bold text-xs flex items-center justify-center font-display">
                        {req.userName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{req.userName}</span>
                          <span className="v-badge v-badge-emerald text-[9px]">Trust: {req.trustScore}/100</span>
                        </div>
                        <p className="text-[10px] font-mono text-[#7A889B]">
                          UPI: {req.upiId} · {req.userAddress.substring(0, 6)}...{req.userAddress.substring(req.userAddress.length - 4)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#7A889B] block">Collateral Pledge</span>
                      <span className="text-sm font-bold text-[#00F5A0] font-mono">
                        {formatRawINR(req.bufferDepositINR)}
                      </span>
                    </div>
                  </div>

                  {/* Approval Action */}
                  <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="w-full sm:w-64">
                      <input
                        type="password"
                        placeholder="Enter Admin Secret Code..."
                        value={secretInput}
                        onChange={(e) => setSecretInput(e.target.value)}
                        className="v-input font-mono text-xs py-1.5"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleReject(req.id)}
                        className="v-btn-secondary text-xs py-1.5 px-3"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(req.id)}
                        className="v-btn-primary text-xs py-1.5 px-4 font-bold flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Authorize & Admit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex justify-end">
          <button type="button" onClick={onClose} className="v-btn-secondary text-xs">
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
