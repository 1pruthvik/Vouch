import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Shield, Share2, Copy, Check, Users, Clock, CheckCircle2, AlertCircle, Coins, ArrowRight, XCircle, CheckCheck, Lock, UserPlus, Trash2, KeyRound, Edit3 } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { VerificationService, CircleRegistryEntry, JoinRequest } from "../services/verificationService";
import { ContractService, GroupDetails, MemberDetails } from "../services/contractService";
import { extractCircleAddress } from "./JoinCircleView";
import { EditCircleModal } from "./EditCircleModal";
import { MSTChainVisualizer3D } from "./MSTChainVisualizer3D";
import { ethers } from "ethers";

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
  const cleanCircleAddress = extractCircleAddress(circleAddress);

  const [activeTab, setActiveTab] = useState<"visualizer" | "management">("visualizer");
  const [registryCircle, setRegistryCircle] = useState<CircleRegistryEntry | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [verifiedRequests, setVerifiedRequests] = useState<JoinRequest[]>([]);
  const [allowedMembers, setAllowedMembers] = useState<string[]>([]);
  const [newPublicKeyInput, setNewPublicKeyInput] = useState<string>("");
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadCircleData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // 1. Registry Data (local + backend)
      const reg = VerificationService.getCircle(cleanCircleAddress);
      setRegistryCircle(reg);
      VerificationService.fetchCircle(cleanCircleAddress).then((r) => {
        if (r) setRegistryCircle(r);
      });

      // 2. Initializer Requests (local + backend)
      const localReqs = VerificationService.getRequestsForCircle(cleanCircleAddress);
      setPendingRequests(localReqs.filter((r) => r.status === "pending"));
      setVerifiedRequests(localReqs.filter((r) => r.status === "verified"));

      const remoteReqs = await VerificationService.fetchRequestsForCircle(cleanCircleAddress);
      if (Array.isArray(remoteReqs)) {
        setPendingRequests(remoteReqs.filter((r) => r.status === "pending"));
        setVerifiedRequests(remoteReqs.filter((r) => r.status === "verified"));
      }

      // 3. Allowed IDs list
      const allowed = await VerificationService.fetchAllowedMembers(cleanCircleAddress);
      setAllowedMembers(allowed);

      // 4. On-chain Details
      if (contractService && cleanCircleAddress.startsWith("0x")) {
        try {
          const gDetails = await contractService.getGroupDetails(cleanCircleAddress);
          setGroupDetails(gDetails);

          const mDetails = await contractService.getMemberDetails(cleanCircleAddress, account);
          setMemberDetails(mDetails);
        } catch (chainErr) {
          console.warn("On-chain details fetch error:", chainErr);
        }
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [cleanCircleAddress, account, contractService]);

  useEffect(() => {
    loadCircleData(false);
    const interval = setInterval(() => {
      loadCircleData(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [loadCircleData]);

  const cleanAccount = (account || "").toLowerCase();
  const isInitializer =
    (registryCircle && registryCircle.initializer.toLowerCase() === cleanAccount) ||
    (groupDetails && groupDetails.members[0]?.toLowerCase() === cleanAccount) ||
    (allowedMembers.length > 0 && allowedMembers[0]?.toLowerCase() === cleanAccount) ||
    (registryCircle?.initializer === "Circle Initializer" && allowedMembers.includes(cleanAccount));

  const handleAddPublicKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = newPublicKeyInput.trim();
    if (!candidate) return;

    if (!candidate.startsWith("0x") || candidate.length < 42) {
      onShowNotification("Please enter a valid 0x public key address (42 characters)", true);
      return;
    }

    setIsAddingKey(true);
    try {
      await VerificationService.addAllowedMember(cleanCircleAddress, candidate, account);
      setNewPublicKeyInput("");
      await loadCircleData(true);
      onShowNotification(`Added ${candidate.substring(0, 8)}... to the Allowed List!`);
    } catch (err: any) {
      onShowNotification(err.message || "Failed to add public key", true);
    } finally {
      setIsAddingKey(false);
    }
  };

  const handleRemoveAllowedMember = async (memberAddress: string) => {
    try {
      await VerificationService.removeAllowedMember(cleanCircleAddress, memberAddress);
      await loadCircleData(true);
      onShowNotification(`Removed ${memberAddress.substring(0, 6)}... from Allowed List`);
    } catch (err: any) {
      onShowNotification("Failed to remove member", true);
    }
  };

  const handleVerifyApplicant = async (applicantAddress: string) => {
    await VerificationService.verifyApplicant(cleanCircleAddress, applicantAddress);
    await loadCircleData(true);
    onShowNotification(`Verified applicant and added to Allowed IDs list!`);
  };

  const handleRejectApplicant = async (applicantAddress: string) => {
    await VerificationService.rejectApplicant(cleanCircleAddress, applicantAddress);
    await loadCircleData(true);
    onShowNotification(`Rejected applicant ${applicantAddress.substring(0, 6)}...`);
  };

  const handleDeleteThisCircle = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this circle?")) {
      return;
    }
    try {
      await VerificationService.deleteCircle(cleanCircleAddress);
      onShowNotification("Circle deleted successfully.");
      onBack();
    } catch (err: any) {
      onShowNotification("Failed to delete circle", true);
    }
  };

  const handlePayContribution = async () => {
    if (!contractService || !groupDetails) return;
    setIsPaying(true);
    try {
      onShowNotification("Processing monthly contribution on blockchain...");
      await contractService.payInstallment(cleanCircleAddress, groupDetails.installmentAmount);
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
    const fullLink = `${origin}/grouplink?circle=${cleanCircleAddress}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    onShowNotification("Group invite link copied to clipboard!");
  };

  const copyId = () => {
    navigator.clipboard.writeText(cleanCircleAddress);
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

  const isCircleStarted = groupDetails
    ? groupDetails.currentState !== "Forming" ||
      (groupDetails.members && groupDetails.members.length >= groupDetails.memberCount && groupDetails.members.length > 0)
    : false;

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
          {isCircleStarted && (
            <span className="px-2.5 py-1 rounded-full bg-green-950/40 text-green-400 font-semibold text-[11px] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Started & Locked</span>
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
                {cleanCircleAddress}
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

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isInitializer && !isCircleStarted && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="p-2.5 rounded-xl bg-black hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors border border-neutral-900 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Edit Circle Configuration"
              >
                <Edit3 className="w-3.5 h-3.5 text-red-500" />
                <span>Edit Circle</span>
              </button>
            )}

            <button
              type="button"
              onClick={copyLink}
              className="btn-primary py-2.5 px-4 text-xs flex items-center gap-2 cursor-pointer"
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

      {/* ── Sub Navigation Tabs: 3D Visualizer vs Console Management ── */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 pt-1 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("visualizer")}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === "visualizer"
              ? "bg-red-950/50 text-red-400 border-red-500 shadow-[0_0_15px_rgba(255,23,68,0.3)]"
              : "bg-neutral-950 text-neutral-400 border-neutral-900 hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4 text-red-500" />
          <span>3D Chain & Bidding Visualizer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("management")}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === "management"
              ? "bg-red-950/50 text-red-400 border-red-500 shadow-[0_0_15px_rgba(255,23,68,0.3)]"
              : "bg-neutral-950 text-neutral-400 border-neutral-900 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 text-red-500" />
          <span>Circle Whitelist & Console</span>
        </button>
      </div>

      {/* ── View 1: 3D Blockchain Explorer & Bidding Lifecycle ── */}
      {activeTab === "visualizer" ? (
        <MSTChainVisualizer3D
          circleAddress={cleanCircleAddress}
          circleName={circleName}
          memberCount={memberCount}
          installmentAmount={installmentMst}
          allowedMembers={allowedMembers}
          currentAccount={account}
          isInitializer={Boolean(isInitializer)}
          onPayDues={handlePayContribution}
          onCommitBid={async (bidAmt, salt) => {
            if (contractService) {
              try {
                const amtBN = ethers.parseEther(bidAmt);
                const cleanSalt = salt.startsWith("0x") ? salt.padEnd(66, "0") : ("0x" + salt).padEnd(66, "0");
                const hash = ethers.solidityPackedKeccak256(
                  ["uint256", "bytes32", "address"],
                  [amtBN, cleanSalt, account]
                );
                await contractService.commitBid(cleanCircleAddress, hash);
                onShowNotification("Secret bid committed successfully on MST Blockchain!");
                await loadCircleData(true);
              } catch (err: any) {
                console.warn("On-chain commit error (using simulated commitment):", err);
              }
            }
          }}
          onShowNotification={onShowNotification}
        />
      ) : (
        <>
          {/* ── View 2: Whitelist & Access Console ── */}
          {isInitializer && (
            <div className="p-6 bg-neutral-950 rounded-2xl space-y-6 text-xs">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span>Initializer Whitelist & Access Console</span>
              </h3>
              <p className="text-neutral-400 text-[11px]">
                People with BridgeKey public keys in the Allowed List are granted access to <span className="text-white font-mono">localhost:3000/grouplink</span>.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-red-950/30 text-red-400 font-semibold text-[11px]">
              {pendingRequests.length} Pending
            </span>
          </div>

          {/* Direct Add Public Key Form */}
          <div className="p-4 bg-black rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-red-500" />
              <h4 className="font-semibold text-white text-xs">Add Member Public Key (BridgeKey ID)</h4>
            </div>
            <form onSubmit={handleAddPublicKey} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter member public key address (0x...)"
                value={newPublicKeyInput}
                onChange={(e) => setNewPublicKeyInput(e.target.value)}
                className="flex-1 bg-neutral-900 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none"
              />
              <button
                type="submit"
                disabled={isAddingKey || !newPublicKeyInput.trim()}
                className="btn-primary px-4 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAddingKey ? "Adding..." : "Add to Allowed List"}</span>
              </button>
            </form>
          </div>

          {/* Pending Verification Requests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-neutral-300 text-xs">Pending Join Requests ({pendingRequests.length})</h4>
              <span className="text-[10px] text-neutral-500 font-mono">Auto-syncing live</span>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-[11px] text-neutral-600 italic py-1">
                No pending join requests. Add public keys directly above or share your group link.
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
                        <span>Approve & Whitelist</span>
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

          {/* Allowed IDs Whitelist List */}
          <div className="pt-4 border-t border-neutral-900 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300">
                Allowed Public Keys Whitelist ({allowedMembers.length})
              </span>
              <span className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Granted Access</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {allowedMembers.map((addr) => {
                const isThisInit = (registryCircle && registryCircle.initializer.toLowerCase() === addr.toLowerCase()) || addr.toLowerCase() === cleanAccount;
                return (
                  <span
                    key={addr}
                    className="px-3 py-1.5 rounded-lg bg-black text-neutral-200 font-mono text-[11px] flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <span>{addr.substring(0, 6)}...{addr.substring(addr.length - 4)}</span>
                    {isThisInit ? (
                      <span className="px-1.5 py-0.2 rounded bg-red-950/60 text-red-400 text-[9px] font-sans font-semibold">
                        Initializer
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveAllowedMember(addr)}
                        className="text-neutral-500 hover:text-red-400 p-0.5 bg-transparent border-none cursor-pointer"
                        title="Remove from allowed list"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Danger Zone: Delete Circle (Shown only before circle starts) */}
          {!isCircleStarted ? (
            <div className="pt-4 border-t border-neutral-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-950/10 p-4 rounded-xl">
              <div className="space-y-0.5">
                <h5 className="font-semibold text-red-400 text-xs">Delete Savings Circle</h5>
                <p className="text-[11px] text-neutral-400">
                  Permanently delete this circle and remove all whitelist registrations.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDeleteThisCircle}
                className="px-4 py-2 rounded-lg bg-red-950 hover:bg-red-900 text-red-400 hover:text-red-200 text-xs font-semibold flex items-center gap-1.5 border-none cursor-pointer self-start sm:self-auto transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Circle</span>
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-neutral-900 flex items-center gap-3 bg-neutral-900/40 p-4 rounded-xl text-xs">
              <Lock className="w-4 h-4 text-green-400 shrink-0" />
              <div>
                <h5 className="font-semibold text-neutral-200 text-xs">Circle In Progress (Locked)</h5>
                <p className="text-[11px] text-neutral-400">
                  All members have contributed and agreed to start. Circle configuration, participants, and deletion are permanently locked.
                </p>
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
      </>
      )}

      {/* Edit Circle Modal */}
      {isEditModalOpen && (
        <EditCircleModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          circle={registryCircle}
          account={account}
          isCircleStarted={isCircleStarted}
          onSuccess={(msg) => {
            onShowNotification(msg);
            loadCircleData(true);
          }}
        />
      )}
    </div>
  );
};
