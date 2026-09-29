import React, { useState, useEffect, useCallback } from "react";
import { UserPlus, ArrowRight, Shield, CheckCircle2, Clock, XCircle, Search, Copy, Check } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE, parseWalletError } from "../utils/formatters";
import { VerificationService, CircleRegistryEntry } from "../services/verificationService";
import { ContractService, GroupDetails } from "../services/contractService";
import { ethers } from "ethers";

interface JoinCircleViewProps {
  account: string;
  contractService: ContractService | null;
  onJoinSuccess: (circleAddress: string) => void;
  initialCircleId?: string;
  onShowNotification: (msg: string, isError?: boolean) => void;
}

export const JoinCircleView: React.FC<JoinCircleViewProps> = ({
  account,
  contractService,
  onJoinSuccess,
  initialCircleId = "",
  onShowNotification,
}) => {
  const [groupIdInput, setGroupIdInput] = useState(initialCircleId);
  const [searchedCircle, setSearchedCircle] = useState<CircleRegistryEntry | null>(null);
  const [chainGroupDetails, setChainGroupDetails] = useState<GroupDetails | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "rejected" | "none">("none");
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLookup = useCallback(async (targetId: string) => {
    const cleanId = targetId.trim();
    if (!cleanId) return;
    setIsLoading(true);
    setSearchedCircle(null);
    setChainGroupDetails(null);

    try {
      // 1. Check local registry
      const localCircle = VerificationService.getCircle(cleanId);
      if (localCircle) {
        setSearchedCircle(localCircle);
      }

      // 2. Query on-chain if valid address
      if (cleanId.startsWith("0x") && cleanId.length === 42) {
        try {
          const srv = contractService || new ContractService();
          const gDetails = await srv.getGroupDetails(cleanId);
          setChainGroupDetails(gDetails);
          if (!localCircle) {
            setSearchedCircle({
              address: cleanId,
              name: gDetails.name,
              memberCount: gDetails.memberCount,
              installmentAmount: gDetails.installmentAmount,
              initializer: gDetails.members[0] || "Unknown Initializer",
              createdAt: Date.now(),
            });
          }
        } catch (chainErr) {
          console.warn("On-chain circle details fetch error:", chainErr);
        }
      }

      // 3. Check applicant verification status
      const status = VerificationService.getApplicantStatus(cleanId, account);
      setVerificationStatus(status);
    } catch (err: any) {
      console.error(err);
      onShowNotification("Could not find circle with this ID.", true);
    } finally {
      setIsLoading(false);
    }
  }, [account, contractService, onShowNotification]);

  useEffect(() => {
    if (initialCircleId) {
      setGroupIdInput(initialCircleId);
      handleLookup(initialCircleId);
    }
  }, [initialCircleId, handleLookup]);

  // Real-time synchronization for approvals from initializer
  useEffect(() => {
    const handleStorageChange = () => {
      if (searchedCircle) {
        const status = VerificationService.getApplicantStatus(searchedCircle.address, account);
        setVerificationStatus(status);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [searchedCircle, account]);

  const handleRequestVerification = () => {
    if (!searchedCircle || !account) return;
    try {
      VerificationService.submitJoinRequest(searchedCircle.address, account);
      setVerificationStatus("pending");
      onShowNotification("Verification request submitted to the circle initializer!");
    } catch (err: any) {
      onShowNotification(err.message || "Failed to submit request", true);
    }
  };

  const handleConfirmJoin = async () => {
    if (!searchedCircle || !account) return;
    if (verificationStatus !== "verified") {
      onShowNotification("You must be verified by the circle initializer before joining.", true);
      return;
    }

    setIsJoining(true);
    try {
      const depositAmount = searchedCircle.installmentAmount || "1.0";
      onShowNotification("Depositing collateral and joining circle on blockchain...");
      const srv = contractService || new ContractService();
      await srv.joinGroup(searchedCircle.address, depositAmount);
      onShowNotification("Successfully joined the savings circle!");
      onJoinSuccess(searchedCircle.address);
    } catch (err: any) {
      console.error(err);
      onShowNotification(parseWalletError(err), true);
    } finally {
      setIsJoining(false);
    }
  };

  const copyGroupId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const circleName = searchedCircle?.name || chainGroupDetails?.name || "Savings Circle";
  const memberCount = searchedCircle?.memberCount || chainGroupDetails?.memberCount || 5;
  const installment = searchedCircle?.installmentAmount || chainGroupDetails?.installmentAmount || "1.0";
  const approxInr = Math.round(parseFloat(installment) * MST_TO_INR_RATE);
  const initializerAddr = searchedCircle?.initializer || "Initializer Contract";

  const isInitializer = searchedCircle && searchedCircle.initializer.toLowerCase() === account.toLowerCase();

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-red-500 mb-1">
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite-Only Access</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
          Join a Circle
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
          Enter the Circle Group ID or invitation address provided by the circle initializer.
        </p>
      </div>

      {/* Input / Search Box */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-neutral-300">
          Enter Group ID / Circle Contract Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={groupIdInput}
            onChange={(e) => setGroupIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup(groupIdInput)}
            className="flex-1 bg-neutral-950 rounded-lg px-4 py-3.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500 border-none transition-all"
          />
          <button
            type="button"
            onClick={() => handleLookup(groupIdInput)}
            disabled={isLoading || !groupIdInput.trim()}
            className="btn-primary px-5 py-3.5 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? "Searching..." : "Lookup"}</span>
          </button>
        </div>
      </div>

      {/* Circle Details & Verification Status Card */}
      {searchedCircle && (
        <div className="p-6 bg-neutral-950 rounded-xl space-y-6 text-xs transition-all">
          {/* Top Bar */}
          <div className="flex items-start justify-between gap-4 border-b border-neutral-900 pb-4">
            <div>
              <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                Circle Found
              </span>
              <h3 className="text-lg font-bold text-white font-display mt-0.5">
                {circleName}
              </h3>
            </div>
            <button
              onClick={() => copyGroupId(searchedCircle.address)}
              className="p-1.5 text-neutral-500 hover:text-white bg-transparent border-none cursor-pointer flex items-center gap-1.5"
              title="Copy Group Address"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span className="text-[11px] font-mono">{copied ? "Copied" : "Copy ID"}</span>
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-neutral-500 block text-[11px]">Monthly Contribution</span>
              <span className="text-white font-semibold text-sm">
                {formatRawINR(approxInr)}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono block">
                ≈ {installment} tMSTC
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px]">Circle Capacity</span>
              <span className="text-white font-semibold text-sm">
                {memberCount} Members
              </span>
            </div>
          </div>

          <div>
            <span className="text-neutral-500 block text-[11px] mb-1">Group Initializer</span>
            <span className="font-mono text-neutral-300 text-[11px] break-all">
              {initializerAddr}
            </span>
          </div>

          {/* Verification Status Banner */}
          {isInitializer ? (
            <div className="p-4 rounded-lg bg-red-950/20 text-red-400 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <Shield className="w-4 h-4 text-red-500" />
                <span>You are the Initializer of this circle</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                You created this circle. You can view it from your dedicated circle dashboard.
              </p>
            </div>
          ) : verificationStatus === "none" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-neutral-900 text-neutral-300 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Shield className="w-4 h-4 text-red-500" />
                  <span>Initializer Verification Required</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  To ensure community security, people can join only with the initializer's approval. Click below to send your join request to the initializer.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRequestVerification}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
              >
                <span>Request Verification to Join</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : verificationStatus === "pending" ? (
            <div className="p-4 rounded-lg bg-yellow-950/20 text-yellow-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
                <span>Verification Pending</span>
              </div>
              <p className="text-[11px] text-yellow-400/80">
                Your join request has been sent. Waiting for the circle initializer (<span className="font-mono">{initializerAddr.substring(0, 8)}...</span>) to verify and approve your address.
              </p>
              <button
                type="button"
                onClick={() => handleLookup(searchedCircle.address)}
                className="mt-2 text-[11px] text-white hover:text-red-400 underline bg-transparent border-none cursor-pointer"
              >
                Check status again
              </button>
            </div>
          ) : verificationStatus === "verified" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-950/20 text-green-300 space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span>Verified by Initializer!</span>
                </div>
                <p className="text-[11px] text-green-400/80">
                  The initializer has verified your wallet. You can now deposit collateral and officially join this savings circle.
                </p>
              </div>

              <button
                type="button"
                onClick={handleConfirmJoin}
                disabled={isJoining}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isJoining ? "Depositing & Joining Circle..." : "Confirm Collateral & Join Circle"}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-red-950/20 text-red-400 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <XCircle className="w-4 h-4 text-red-500" />
                <span>Request Declined</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                The circle initializer declined this join request.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
