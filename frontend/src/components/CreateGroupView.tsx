import React, { useState, useEffect } from "react";
import { Plus, ArrowRight, Shield, CheckCircle2, Copy, Check, Users, Clock, CheckCheck, XCircle, Share2, Key, X, Edit3, Trash2, Lock } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { VerificationService, JoinRequest, CircleRegistryEntry } from "../services/verificationService";
import { extractCircleAddress } from "./JoinCircleView";
import { EditCircleModal } from "./EditCircleModal";

interface CreateGroupViewProps {
  account: string;
  onCreateGroup: (params: {
    groupName: string;
    memberCount: number;
    installmentAmount: string;
    cycleDuration: number;
    discountCapBps: number;
    reserveFeeBps: number;
    minWalletAmt?: string;
    allowedKeys?: string[];
  }) => Promise<string | undefined>;
  isDeploying?: boolean;
  deployedCircleAddress?: string | null;
  onShowNotification: (msg: string, isError?: boolean) => void;
}

export const INR_PER_TMSTC = MST_TO_INR_RATE;

export const CreateGroupView: React.FC<CreateGroupViewProps> = ({
  account,
  onCreateGroup,
  isDeploying = false,
  deployedCircleAddress,
  onShowNotification,
}) => {
  const [groupName, setGroupName] = useState("");
  const [memberCount, setMemberCount] = useState<number | "">("");
  const [installmentInr, setInstallmentInr] = useState<number | "">("");
  const [cycleDurationMonths, setCycleDurationMonths] = useState<number | "">("");
  const [minWalletAmtInr, setMinWalletAmtInr] = useState<number | "">("");

  // Allowed public keys list before deployment
  const [allowedKeys, setAllowedKeys] = useState<string[]>([]);
  const [newKeyInput, setNewKeyInput] = useState("");

  const [initializedCircles, setInitializedCircles] = useState<CircleRegistryEntry[]>([]);
  const [circleRequests, setCircleRequests] = useState<{ [circleAddr: string]: JoinRequest[] }>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Edit circle modal state
  const [editingCircle, setEditingCircle] = useState<CircleRegistryEntry | null>(null);

  const loadInitializerData = async () => {
    if (!account) return;
    // 1. Local cached
    const myCircles = VerificationService.getCirclesByInitializer(account);
    setInitializedCircles(myCircles);

    const reqMap: { [circleAddr: string]: JoinRequest[] } = {};
    myCircles.forEach((c) => {
      const clean = extractCircleAddress(c.address);
      reqMap[clean] = VerificationService.getRequestsForCircle(clean);
    });
    setCircleRequests(reqMap);

    // 2. Fetch from backend
    try {
      const backendCircles = await VerificationService.fetchCirclesByInitializer(account);
      setInitializedCircles(backendCircles);

      const updatedReqMap: { [circleAddr: string]: JoinRequest[] } = {};
      await Promise.all(
        backendCircles.map(async (c) => {
          const clean = extractCircleAddress(c.address);
          const reqs = await VerificationService.fetchRequestsForCircle(clean);
          updatedReqMap[clean] = reqs;
        })
      );
      setCircleRequests(updatedReqMap);
    } catch (err) {
      console.warn("Error refreshing initializer data:", err);
    }
  };

  useEffect(() => {
    loadInitializerData();
    const interval = setInterval(loadInitializerData, 3000);
    return () => clearInterval(interval);
  }, [account, deployedCircleAddress]);

  const numMembers = typeof memberCount === "number" ? memberCount : 0;
  const numInstallment = typeof installmentInr === "number" ? installmentInr : 0;
  const numMinWalletAmt = typeof minWalletAmtInr === "number" ? minWalletAmtInr : 0;
  const totalPotInr = numMembers * numInstallment;
  const installmentTokens = numInstallment > 0 ? (numInstallment / INR_PER_TMSTC).toFixed(4) : "0.0000";

  const numMonths = typeof cycleDurationMonths === "number" ? cycleDurationMonths : 1;
  const cycleDurationSeconds = numMonths * 30 * 24 * 3600;

  const handleAddAllowedKey = () => {
    const trimmed = newKeyInput.trim();
    if (!trimmed) return;
    const cleanKey = extractCircleAddress(trimmed);
    if (!cleanKey) return;
    if (allowedKeys.some((k) => k.toLowerCase() === cleanKey.toLowerCase())) {
      setNewKeyInput("");
      return;
    }
    setAllowedKeys([...allowedKeys, cleanKey]);
    setNewKeyInput("");
  };

  const handleRemoveAllowedKey = (keyToRemove: string) => {
    setAllowedKeys(allowedKeys.filter((k) => k.toLowerCase() !== keyToRemove.toLowerCase()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !numMembers || !numInstallment) {
      onShowNotification("Please fill in all required circle fields.", true);
      return;
    }

    const calculatedReserveFeeBps =
      totalPotInr > 0
        ? Math.min(2000, Math.max(100, Math.round((numMinWalletAmt / totalPotInr) * 10000)))
        : 500;

    const newAddress = await onCreateGroup({
      groupName: groupName.trim(),
      memberCount: numMembers,
      installmentAmount: installmentTokens,
      cycleDuration: cycleDurationSeconds,
      discountCapBps: 3000,
      reserveFeeBps: calculatedReserveFeeBps,
      minWalletAmt: numMinWalletAmt.toString(),
      allowedKeys: allowedKeys,
    });

    if (newAddress) {
      const cleanAddr = extractCircleAddress(newAddress);
      await VerificationService.registerCircle({
        address: cleanAddr,
        name: groupName.trim(),
        memberCount: numMembers,
        installmentAmount: installmentTokens,
        cycleDuration: cycleDurationSeconds,
        initializer: account,
        minWalletAmt: numMinWalletAmt.toString(),
        createdAt: Date.now(),
      });

      // Add initializer to whitelist
      await VerificationService.addAllowedMember(cleanAddr, account, account);

      // Add all pre-specified allowed member public keys
      for (const key of allowedKeys) {
        await VerificationService.addAllowedMember(cleanAddr, key, account);
      }

      setGroupName("");
      setMemberCount("");
      setInstallmentInr("");
      setCycleDurationMonths("");
      setMinWalletAmtInr("");
      setAllowedKeys([]);
      setNewKeyInput("");
      await loadInitializerData();
    }
  };

  const handleVerifyApplicant = async (circleAddress: string, applicantAddress: string) => {
    const clean = extractCircleAddress(circleAddress);
    await VerificationService.verifyApplicant(clean, applicantAddress);
    await loadInitializerData();
    onShowNotification(`Verified applicant ${applicantAddress.substring(0, 6)}... and whitelisted for group link access!`);
  };

  const handleRejectApplicant = async (circleAddress: string, applicantAddress: string) => {
    const clean = extractCircleAddress(circleAddress);
    await VerificationService.rejectApplicant(clean, applicantAddress);
    await loadInitializerData();
    onShowNotification(`Rejected applicant ${applicantAddress.substring(0, 6)}...`);
  };

  const handleDeleteCircle = async (circleAddress: string) => {
    const clean = extractCircleAddress(circleAddress);
    if (!window.confirm("Are you sure you want to delete this circle? This action is permanent.")) {
      return;
    }
    try {
      await VerificationService.deleteCircle(clean);
      await loadInitializerData();
      onShowNotification("Circle deleted successfully.");
    } catch {
      onShowNotification("Failed to delete circle.", true);
    }
  };

  const copyGroupLink = (circleAddr: string) => {
    const clean = extractCircleAddress(circleAddr);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullLink = `${origin}/grouplink?circle=${clean}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(clean);
    setTimeout(() => setCopiedLink(null), 2500);
    onShowNotification("Group invite link copied to clipboard!");
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4 space-y-12">
      {/* ── Section 1: Create Group Form ── */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-red-500 mb-1">
            <Plus className="w-3.5 h-3.5" />
            <span>Initializer Console</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
            Create a Savings Circle
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            You will be designated as the <span className="text-red-400 font-semibold">Initializer</span>. Members can join only via your group link and must be verified by you.
          </p>
        </div>

        {/* Creation Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Circle Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Phoenix Savings Circle"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isDeploying}
              className="w-full bg-neutral-950 rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Total Members
              </label>
              <input
                type="number"
                min="2"
                max="50"
                required
                placeholder="e.g. 5"
                value={memberCount}
                onChange={(e) =>
                  setMemberCount(e.target.value === "" ? "" : parseInt(e.target.value))
                }
                disabled={isDeploying}
                className="w-full bg-neutral-950 rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Monthly Contribution (₹)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                required
                placeholder="e.g. 5000"
                value={installmentInr}
                onChange={(e) =>
                  setInstallmentInr(e.target.value === "" ? "" : parseFloat(e.target.value))
                }
                disabled={isDeploying}
                className="w-full bg-neutral-950 rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Round Duration (Months)
              </label>
              <input
                type="number"
                min="1"
                max="12"
                required
                placeholder="e.g. 1"
                value={cycleDurationMonths}
                onChange={(e) =>
                  setCycleDurationMonths(e.target.value === "" ? "" : parseInt(e.target.value))
                }
                disabled={isDeploying}
                className="w-full bg-neutral-950 rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Min Wallet Amt (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="Optional reserve required"
                value={minWalletAmtInr}
                onChange={(e) =>
                  setMinWalletAmtInr(e.target.value === "" ? "" : parseFloat(e.target.value))
                }
                disabled={isDeploying}
                className="w-full bg-neutral-950 rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none transition-all"
              />
            </div>
          </div>

          {/* ── Allowed Public Keys (Access Control for localhost:3000/grouplink) ── */}
          <div className="p-4 bg-neutral-950 rounded-xl space-y-3">
            <div className="space-y-0.5">
              <label className="block text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-red-500" />
                <span>Allowed Public Keys (Group Link Access)</span>
              </label>
              <p className="text-[11px] text-neutral-500">
                Define the public keys allowed on <code className="text-red-400 font-mono text-[10px]">localhost:3000/grouplink</code>. You can add more public keys here or approve requests later.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter member's BridgeKey or 0x Public Key"
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddAllowedKey();
                  }
                }}
                disabled={isDeploying}
                className="flex-1 bg-black rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none"
              />
              <button
                type="button"
                onClick={handleAddAllowedKey}
                disabled={isDeploying || !newKeyInput.trim()}
                className="px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs flex items-center gap-1.5 border-none cursor-pointer transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 text-red-500" />
                <span>Add Key</span>
              </button>
            </div>

            {allowedKeys.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allowedKeys.map((key) => (
                  <span
                    key={key}
                    className="px-2.5 py-1 rounded-lg bg-black text-neutral-300 font-mono text-[11px] flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span>{key.substring(0, 6)}...{key.substring(key.length - 4)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAllowedKey(key)}
                      className="text-neutral-500 hover:text-red-400 p-0.5 bg-transparent border-none cursor-pointer ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pot summary */}
          <div className="p-5 bg-neutral-950 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-white font-semibold">
              <span className="text-neutral-400">Total Monthly Pot:</span>
              <span className="font-display text-lg text-white font-bold">{formatRawINR(totalPotInr)}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-500 text-[11px] font-mono">
              <span>Per Member Contribution:</span>
              <span>
                {numInstallment > 0 ? `₹${numInstallment.toLocaleString("en-IN")}` : "₹0"}
                {numInstallment > 0 ? ` (≈ ${installmentTokens} tMSTC / month)` : ""}
              </span>
            </div>
            {numMinWalletAmt > 0 && (
              <div className="flex items-center justify-between text-neutral-500 text-[11px] font-mono">
                <span>Min Wallet Requirement:</span>
                <span>₹{numMinWalletAmt.toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>

          {/* Deploy Button */}
          <button
            type="submit"
            disabled={isDeploying || !account || !groupName.trim() || !numMembers || !numInstallment}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeploying ? (
              <span>Deploying Circle to MST Blockchain...</span>
            ) : (
              <>
                <span>Deploy Circle as Initializer</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Section 2: Initializer Circles & Verification Manager ── */}
      {initializedCircles.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-neutral-900">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              <span>Circles You Initialized ({initializedCircles.length})</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Manage settings, approve applicant requests, or whitelist public keys before circles start.
            </p>
          </div>

          <div className="space-y-4">
            {initializedCircles.map((circle) => {
              const clean = extractCircleAddress(circle.address);
              const requests = circleRequests[clean] || circleRequests[circle.address] || [];
              const pendingRequests = requests.filter((r) => r.status === "pending");
              const verifiedRequests = requests.filter((r) => r.status === "verified");

              // If all members joined & verified, or circle has started
              const isStarted = verifiedRequests.length >= (circle.memberCount || 5);

              return (
                <div key={circle.address} className="p-5 bg-neutral-950 rounded-xl space-y-4 text-xs">
                  {/* Circle Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-900 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{circle.name}</h4>
                        {isStarted ? (
                          <span className="px-2 py-0.5 rounded bg-green-950/40 text-green-400 font-semibold text-[10px] flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Started & Locked</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-yellow-950/40 text-yellow-400 font-semibold text-[10px]">
                            Forming / Whitelisting
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-neutral-500 break-all">
                        ID: {clean}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => copyGroupLink(clean)}
                        className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                      >
                        {copiedLink === clean ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-red-500" />
                            <span>Group Link</span>
                          </>
                        )}
                      </button>

                      {/* Edit and Delete buttons are shown ONLY BEFORE circle starts */}
                      {!isStarted && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingCircle(circle)}
                            className="p-2 rounded-lg bg-black hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors border-none cursor-pointer flex items-center gap-1"
                            title="Edit Circle Configuration"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-[11px]">Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCircle(clean)}
                            className="p-2 rounded-lg bg-black hover:bg-red-950/40 text-neutral-500 hover:text-red-400 transition-colors border-none cursor-pointer flex items-center gap-1"
                            title="Delete Circle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pending Requests */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-neutral-400 text-[11px] font-semibold">
                      <span>Pending Join Requests ({pendingRequests.length})</span>
                    </div>

                    {pendingRequests.length === 0 ? (
                      <p className="text-[11px] text-neutral-600 italic py-1">
                        No pending join requests. Share your group link with prospective members.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {pendingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="p-3 bg-black rounded-lg flex items-center justify-between gap-3 border-none"
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
                                onClick={() => handleVerifyApplicant(circle.address, req.applicantAddress)}
                                className="px-3 py-1.5 rounded-md bg-green-950/30 hover:bg-green-900/40 text-green-400 hover:text-green-300 font-semibold text-xs flex items-center gap-1 transition-all border-none cursor-pointer"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Verify & Whitelist</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectApplicant(circle.address, req.applicantAddress)}
                                className="px-2.5 py-1.5 rounded-md bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 font-semibold text-xs flex items-center gap-1 transition-all border-none cursor-pointer"
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
                    <div className="pt-2 border-t border-neutral-900/60">
                      <span className="text-[11px] text-neutral-500 font-medium block mb-1.5">
                        Whitelisted / Verified Members ({verifiedRequests.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {verifiedRequests.map((req) => (
                          <span
                            key={req.id}
                            className="px-2 py-0.5 rounded bg-green-950/30 text-green-400 font-mono text-[10px] flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            {req.applicantAddress.substring(0, 6)}...{req.applicantAddress.substring(req.applicantAddress.length - 4)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Circle Modal */}
      {editingCircle && (
        <EditCircleModal
          isOpen={Boolean(editingCircle)}
          onClose={() => setEditingCircle(null)}
          circle={editingCircle}
          account={account}
          isCircleStarted={false}
          onSuccess={(msg) => {
            onShowNotification(msg);
            loadInitializerData();
          }}
        />
      )}
    </div>
  );
};
