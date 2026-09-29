import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Shield, Share2, Copy, Check, Users, Clock, CheckCircle2, AlertCircle, Coins, ArrowRight, XCircle, CheckCheck } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { VerificationService, CircleRegistryEntry, JoinRequest } from "../services/verificationService";
import { ContractService, GroupDetails, MemberDetails } from "../services/contractService";

interface DedicatedCirclePageProps {
  circleAddress: string;
  account: string;
  contractService: ContractService | null;
  onBack: () => void;
  onShowNotification: (msg: string, isError?: boolean) => void;
}

export const DedicatedCirclePage: React.FC<DedicatedCirclePageProps> = ({
  circleAddress,
  account,
  contractService,
  onBack,
  onShowNotification,
}) => {
  const [registryCircle, setRegistryCircle] = useState<CircleRegistryEntry | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [verifiedRequests, setVerifiedRequests] = useState<JoinRequest[]>([]);
  const [isPaying, setIsPaying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadCircleData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Registry Data
      const reg = VerificationService.getCircle(circleAddress);
      setRegistryCircle(reg);

      // 2. Initializer Requests
      const reqs = VerificationService.getRequestsForCircle(circleAddress);
      setPendingRequests(reqs.filter((r) => r.status === "pending"));
      setVerifiedRequests(reqs.filter((r) => r.status === "verified"));

      // 3. On-chain Details
      if (contractService && circleAddress.startsWith("0x")) {
        try {
          const gDetails = await contractService.getGroupDetails(circleAddress);
          setGroupDetails(gDetails);

          const mDetails = await contractService.getMemberDetails(circleAddress, account);
          setMemberDetails(mDetails);
        } catch (chainErr) {
          console.warn("On-chain details fetch error:", chainErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [circleAddress, account, contractService]);

  useEffect(() => {
    loadCircleData();
  }, [loadCircleData]);

  const isInitializer =
    (registryCircle && registryCircle.initializer.toLowerCase() === account.toLowerCase()) ||
    (groupDetails && groupDetails.members[0]?.toLowerCase() === account.toLowerCase());

  const handleVerifyApplicant = (applicantAddress: string) => {
    VerificationService.verifyApplicant(circleAddress, applicantAddress);
    loadCircleData();
    onShowNotification(`Verified applicant ${applicantAddress.substring(0, 6)}...`);
  };

  const handleRejectApplicant = (applicantAddress: string) => {
    VerificationService.rejectApplicant(circleAddress, applicantAddress);
    loadCircleData();
    onShowNotification(`Rejected applicant ${applicantAddress.substring(0, 6)}...`);
  };

  const handlePayContribution = async () => {
    if (!contractService || !groupDetails) return;
    setIsPaying(true);
    try {
      onShowNotification("Processing monthly contribution on blockchain...");
      await contractService.payInstallment(circleAddress, groupDetails.installmentAmount);
      onShowNotification("Monthly contribution confirmed!");
      await loadCircleData();
    } catch (err: any) {
      console.error(err);
      onShowNotification(err.message || "Payment failed", true);
    } finally {
      setIsPaying(false);
    }
  };

  const copyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullLink = `${origin}/?circle=${circleAddress}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    onShowNotification("Group invite link copied to clipboard!");
  };

  const copyId = () => {
    navigator.clipboard.writeText(circleAddress);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
    onShowNotification("Circle address copied to clipboard!");
  };

  const circleName = registryCircle?.name || groupDetails?.name || "Savings Circle";
  const memberCount = registryCircle?.memberCount || groupDetails?.memberCount || 5;
  const installmentMst = registryCircle?.installmentAmount || groupDetails?.installmentAmount || "1.0";
  const installmentInr = Math.round(parseFloat(installmentMst) * MST_TO_INR_RATE);
  const totalPotInr = memberCount * installmentInr;
  const currentPhase = groupDetails?.currentState || "Forming";

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 px-4 space-y-8">
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-red-500" />
          <span>Back to Circles</span>
        </button>

        <div className="flex items-center gap-2">
          {isInitializer ? (
            <span className="px-2.5 py-1 rounded-full bg-red-950/40 text-red-400 font-semibold text-[11px] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Circle Initializer</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-neutral-900 text-neutral-300 font-semibold text-[11px] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-red-500" />
              <span>Circle Member</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Circle Header ── */}
      <div className="p-6 bg-neutral-950 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
              Autonomous Rotating Pool
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-0.5">
              {circleName}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="font-mono text-xs text-neutral-400 break-all">
                {circleAddress}
              </span>
              <button
                type="button"
                onClick={copyId}
                className="p-1 text-neutral-500 hover:text-white bg-transparent border-none cursor-pointer"
                title="Copy Circle ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="btn-primary py-2.5 px-4 text-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share Group Link</span>
              </>
            )}
          </button>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-900">
          <div className="p-3 bg-black rounded-xl space-y-1">
            <span className="text-[11px] text-neutral-500">Total Pot</span>
            <p className="text-base sm:text-lg font-bold text-white font-display">
              {formatRawINR(totalPotInr)}
            </p>
          </div>

          <div className="p-3 bg-black rounded-xl space-y-1">
            <span className="text-[11px] text-neutral-500">Monthly Due</span>
            <p className="text-base sm:text-lg font-bold text-white font-display">
              {formatRawINR(installmentInr)}
            </p>
            <span className="text-[10px] text-neutral-500 font-mono block">
              ≈ {installmentMst} tMSTC
            </span>
          </div>

          <div className="p-3 bg-black rounded-xl space-y-1">
            <span className="text-[11px] text-neutral-500">Total Members</span>
            <p className="text-base sm:text-lg font-bold text-white font-display">
              {groupDetails?.members ? `${groupDetails.members.length} / ${memberCount}` : `${memberCount} Max`}
            </p>
          </div>

          <div className="p-3 bg-black rounded-xl space-y-1">
            <span className="text-[11px] text-neutral-500">Current Phase</span>
            <p className="text-base sm:text-lg font-bold text-red-400 font-display">
              {currentPhase}
            </p>
          </div>
        </div>
      </div>

      {/* ── Section for Initializer: Verification & Join Request Management ── */}
      {isInitializer && (
        <div className="p-6 bg-neutral-950 rounded-2xl space-y-5 text-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span>Initializer Verification Management</span>
              </h3>
              <p className="text-neutral-400 text-[11px]">
                Approve or reject applicant requests to join your circle.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-red-950/30 text-red-400 font-semibold text-[11px]">
              {pendingRequests.length} Pending
            </span>
          </div>

          {/* Pending Requests */}
          <div className="space-y-2">
            {pendingRequests.length === 0 ? (
              <p className="text-[11px] text-neutral-600 italic py-2">
                No pending join requests. Share your group invite link with members to let them apply.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 bg-black rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-mono text-white text-xs font-semibold">
                        {req.applicantAddress}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        Requested {new Date(req.requestedAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleVerifyApplicant(req.applicantAddress)}
                        className="px-3.5 py-1.5 rounded-lg bg-green-950/40 hover:bg-green-900/50 text-green-400 hover:text-green-300 font-semibold text-xs flex items-center gap-1 transition-all border-none cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Verify & Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectApplicant(req.applicantAddress)}
                        className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 hover:text-red-300 font-semibold text-xs flex items-center gap-1 transition-all border-none cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Members */}
          {verifiedRequests.length > 0 && (
            <div className="pt-3 border-t border-neutral-900">
              <span className="text-[11px] text-neutral-500 font-semibold block mb-2">
                Verified Applicants ({verifiedRequests.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {verifiedRequests.map((req) => (
                  <span
                    key={req.id}
                    className="px-2.5 py-1 rounded-lg bg-green-950/20 text-green-400 font-mono text-[11px] flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    {req.applicantAddress.substring(0, 6)}...{req.applicantAddress.substring(req.applicantAddress.length - 4)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Section for Member: Contribution Payment ── */}
      <div className="p-6 bg-neutral-950 rounded-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Coins className="w-4 h-4 text-red-500" />
              <span>Monthly Contribution</span>
            </h3>
            <p className="text-neutral-400 text-[11px]">
              Contribute your monthly installment to the decentralized pool.
            </p>
          </div>

          <span className="text-white font-bold text-sm">
            {formatRawINR(installmentInr)}
          </span>
        </div>

        <button
          type="button"
          onClick={handlePayContribution}
          disabled={isPaying || currentPhase === "Closed"}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          <Coins className="w-4 h-4" />
          <span>{isPaying ? "Submitting Contribution..." : `Pay Contribution (${installmentMst} tMSTC)`}</span>
        </button>
      </div>
    </div>
  );
};
