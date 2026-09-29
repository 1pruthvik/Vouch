import React, { useState, useEffect, useCallback } from "react";
import { UserPlus, ArrowRight, Shield, CheckCircle2, Clock, XCircle, Search, Copy, Check, Coins, Lock, Users, Sparkles, ExternalLink, Mail, Wallet, AlertTriangle } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE, parseWalletError } from "../utils/formatters";
import { VerificationService, CircleRegistryEntry } from "../services/verificationService";
import { ContractService, GroupDetails } from "../services/contractService";
import { ChitGroupABI } from "../contracts/abis";
import { MST_TESTNET } from "../config/network";
import { ethers } from "ethers";

interface JoinCircleViewProps {
  account: string;
  contractService: ContractService | null;
  onJoinSuccess: (circleAddress: string) => void;
  initialCircleId?: string;
  onShowNotification: (msg: string, isError?: boolean) => void;
}

export function extractCircleAddress(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  const match = trimmed.match(/0x[a-fA-F0-9]{40}/);
  if (match) {
    return match[0];
  }
  return trimmed;
}

export const JoinCircleView: React.FC<JoinCircleViewProps> = ({
  account,
  contractService,
  onJoinSuccess,
  initialCircleId = "",
  onShowNotification,
}) => {
  const [groupIdInput, setGroupIdInput] = useState(extractCircleAddress(initialCircleId));
  const [invitationToken, setInvitationToken] = useState<string>("");
  const [invitationData, setInvitationData] = useState<any | null>(null);
  const [searchedCircle, setSearchedCircle] = useState<CircleRegistryEntry | null>(null);
  const [chainGroupDetails, setChainGroupDetails] = useState<GroupDetails | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "rejected" | "none">("none");
  const [isAllowedMember, setIsAllowedMember] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinStep, setJoinStep] = useState<"idle" | "signing" | "broadcasting" | "confirming" | "success">("idle");
  const [confirmedTxHash, setConfirmedTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Extract invite token from URL if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("invite") || params.get("token") || params.get("invitation");
      if (token) {
        setInvitationToken(token);
        VerificationService.fetchInvitationById(token).then((inv) => {
          if (inv) {
            setInvitationData(inv);
            if (inv.group_address) {
              const clean = extractCircleAddress(inv.group_address);
              setGroupIdInput(clean);
              handleLookup(clean, inv);
            }
          }
        });
      }
    }
  }, []);

  const handleLookup = useCallback(async (targetInput: string, explicitInvitation?: any) => {
    const cleanAddr = extractCircleAddress(targetInput);
    if (!cleanAddr) return;

    setIsLoading(true);
    setSearchedCircle(null);
    setChainGroupDetails(null);

    try {
      // 1. Check local registry first
      let circleEntry = VerificationService.getCircle(cleanAddr);

      // 2. Query backend circle registry
      const backendCircle = await VerificationService.fetchCircle(cleanAddr);
      if (backendCircle) {
        circleEntry = backendCircle;
        setSearchedCircle(backendCircle);
      } else if (circleEntry) {
        setSearchedCircle(circleEntry);
      }

      // 3. Query on-chain using direct JSON-RPC provider
      if (cleanAddr.startsWith("0x") && cleanAddr.length === 42) {
        try {
          const checksumAddr = ethers.getAddress(cleanAddr);
          const rpcProv = new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl);
          const group = new ethers.Contract(checksumAddr, ChitGroupABI, rpcProv);

          const [gName, mCount, instAmt, members] = await Promise.all([
            group.groupName().catch(() => "Savings Circle"),
            group.memberCount().catch(() => 5n),
            group.installmentAmount().catch(() => ethers.parseEther("1.0")),
            group.getMembers().catch(() => []),
          ]);

          const count = Number(mCount) || 5;
          const installmentTokens = ethers.formatEther(instAmt);

          const entry: CircleRegistryEntry = {
            address: checksumAddr,
            name: gName || (circleEntry ? circleEntry.name : "Savings Circle"),
            memberCount: count,
            installmentAmount: installmentTokens,
            initializer: (members && members[0]) ? members[0] : (circleEntry ? circleEntry.initializer : "Circle Initializer"),
            createdAt: circleEntry ? circleEntry.createdAt : Date.now(),
          };

          circleEntry = entry;
          setSearchedCircle(entry);
          VerificationService.registerCircle(entry).catch(() => {});
        } catch (chainErr) {
          console.warn("Direct RPC circle details fetch error:", chainErr);
        }
      }

      // 4. Check Whitelist (Allowed IDs List) & Verification status
      if (account) {
        const isInit = circleEntry && circleEntry.initializer.toLowerCase() === account.toLowerCase();
        const allowed = isInit || (await VerificationService.fetchIsMemberAllowed(cleanAddr, account));
        setIsAllowedMember(allowed);

        const status = await VerificationService.fetchApplicantStatus(cleanAddr, account);
        setVerificationStatus(status);
        if (status === "verified" || isInit) {
          setIsAllowedMember(true);
        }
      }
    } catch (err: any) {
      console.error(err);
      onShowNotification("Could not find circle with this address.", true);
    } finally {
      setIsLoading(false);
    }
  }, [account, onShowNotification]);

  useEffect(() => {
    if (initialCircleId) {
      const clean = extractCircleAddress(initialCircleId);
      setGroupIdInput(clean);
      handleLookup(clean);
    }
  }, [initialCircleId, handleLookup]);

  // Real-time synchronization for Allowed list & approvals from initializer
  useEffect(() => {
    let pollTimer: any = null;
    if (searchedCircle && account) {
      pollTimer = setInterval(async () => {
        try {
          const freshStatus = await VerificationService.fetchApplicantStatus(searchedCircle.address, account);
          const allowed = await VerificationService.fetchIsMemberAllowed(searchedCircle.address, account);
          if (freshStatus) {
            setVerificationStatus(freshStatus);
          }
          if (allowed || freshStatus === "verified") {
            setIsAllowedMember(true);
          }
        } catch {}
      }, 2500);
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [searchedCircle, account]);

  const handleRequestVerification = async () => {
    if (!searchedCircle || !account) return;
    try {
      setVerificationStatus("pending");
      await VerificationService.submitJoinRequest(searchedCircle.address, account);
      onShowNotification("Verification request submitted! Waiting for Initializer approval...");
    } catch (err: any) {
      onShowNotification(err.message || "Failed to submit request", true);
    }
  };

  const handleConfirmJoin = async () => {
    if (!searchedCircle || !account) return;

    // Check invitation wallet address match if invitation is present
    if (invitationData && invitationData.wallet_address) {
      const invitedWallet = invitationData.wallet_address.toLowerCase();
      const connectedWallet = account.toLowerCase();
      if (invitedWallet !== connectedWallet) {
        onShowNotification(
          `Wallet Mismatch: Connected wallet does not match the invitation address (${invitationData.wallet_address}).`,
          true
        );
        return;
      }
    }

    setIsJoining(true);
    setJoinStep("signing");
    try {
      const depositAmount = searchedCircle.installmentAmount || "1.0";
      onShowNotification("Waiting for BridgeKey signature...");

      const srv = contractService || new ContractService();
      
      setJoinStep("broadcasting");
      const txHash = await srv.joinGroup(searchedCircle.address, depositAmount);
      setConfirmedTxHash(txHash);

      setJoinStep("confirming");
      onShowNotification("Transaction confirmed on MST Blockchain! Updating membership...");

      // Update backend invitation status if available
      if (invitationData?.id) {
        await VerificationService.updateInvitationStatus(invitationData.id, "ACTIVE");
      }

      setJoinStep("success");
      onShowNotification("Successfully joined savings circle!");
      
      setTimeout(() => {
        onJoinSuccess(searchedCircle.address);
      }, 1500);
    } catch (err: any) {
      console.error("Join transaction error:", err);
      setJoinStep("idle");
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
  const totalPotInr = memberCount * approxInr;
  const initializerAddr = searchedCircle?.initializer || "Circle Initializer";

  const isInitializer = searchedCircle && searchedCircle.initializer.toLowerCase() === account.toLowerCase();
  
  // Wallet mismatch verification logic for invitations
  const hasInvitation = Boolean(invitationData && invitationData.wallet_address);
  const isWalletMatched = hasInvitation
    ? (invitationData.wallet_address.toLowerCase() === account.toLowerCase())
    : true;

  const canViewInfo = isInitializer || isAllowedMember || verificationStatus === "verified" || (hasInvitation && isWalletMatched);

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-red-500 mb-1">
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite & Whitelist Access</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
          Join a Circle
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
          {hasInvitation
            ? `You have a personalized invitation for ${invitationData.name || "Member"}. Verify your BridgeKey wallet to join.`
            : "Paste the Circle Address or invitation link to connect and deposit collateral on MST Blockchain."}
        </p>
      </div>

      {/* Invitation Card Banner if coming from an invite link */}
      {invitationData && (
        <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>Personal Invitation</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 font-mono text-[10px]">
              ID: {invitationData.id}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white font-display">
              Invited: {invitationData.name} ({invitationData.email})
            </h4>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
              <Wallet className="w-3.5 h-3.5 text-neutral-500" />
              <span>Invited Wallet: {invitationData.wallet_address}</span>
            </div>
          </div>

          {/* Wallet Match / Mismatch Banner */}
          {isWalletMatched ? (
            <div className="p-2.5 bg-green-950/30 border border-green-900/50 rounded-lg flex items-center gap-2 text-green-400 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Connected BridgeKey wallet matches invitation. Ready to deposit collateral.</span>
            </div>
          ) : (
            <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-lg flex items-start gap-2 text-red-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">Wallet Address Mismatch</p>
                <p className="text-[11px] text-red-300/80 mt-0.5">
                  Connected: <span className="font-mono text-white">{account.substring(0, 8)}...{account.substring(36)}</span>
                  <br />
                  Expected: <span className="font-mono text-white">{invitationData.wallet_address}</span>
                  <br />
                  Please switch to your invited wallet address in BridgeKey.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input / Search Box */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-neutral-300">
          Circle ID or Contract Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={groupIdInput}
            onChange={(e) => {
              const val = e.target.value;
              setGroupIdInput(val);
              const extracted = extractCircleAddress(val);
              if (extracted && extracted.length === 42) {
                handleLookup(extracted);
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLookup(groupIdInput)}
            placeholder="0x..."
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

      {/* Circle Details Card */}
      {searchedCircle && (
        <div className="p-6 bg-neutral-950 rounded-xl space-y-6 text-xs transition-all">
          {/* Top Bar */}
          <div className="flex items-start justify-between gap-4 border-b border-neutral-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                  Circle Found
                </span>
                {canViewInfo ? (
                  <span className="px-2 py-0.5 rounded bg-green-950/40 text-green-400 font-semibold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Access Granted</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 font-semibold text-[10px] flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Restricted Access</span>
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white font-display mt-0.5">
                {canViewInfo ? circleName : "Private Savings Circle"}
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

          {/* Unlocked Details Display */}
          {canViewInfo ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-black rounded-xl space-y-1">
                  <span className="text-neutral-500 block text-[11px]">Monthly Contribution</span>
                  <span className="text-white font-semibold text-sm">
                    {formatRawINR(approxInr)}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono block">
                    ≈ {installment} tMSTC
                  </span>
                </div>
                <div className="p-3.5 bg-black rounded-xl space-y-1">
                  <span className="text-neutral-500 block text-[11px]">Total Pot</span>
                  <span className="text-white font-semibold text-sm">
                    {formatRawINR(totalPotInr)}
                  </span>
                  <span className="text-[10px] text-neutral-500 block">
                    {memberCount} Members Capacity
                  </span>
                </div>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px] mb-1">Circle Initializer</span>
                <span className="font-mono text-neutral-300 text-[11px] break-all">
                  {initializerAddr}
                </span>
              </div>

              {/* Status Action Buttons */}
              {isInitializer ? (
                <div className="p-4 rounded-lg bg-red-950/20 text-red-400 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Shield className="w-4 h-4 text-red-500" />
                    <span>You are the Initializer of this circle</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    You have administrative rights to invite members and manage the pool.
                  </p>
                  <button
                    type="button"
                    onClick={() => onJoinSuccess(searchedCircle.address)}
                    className="btn-primary w-full py-3 text-xs mt-2"
                  >
                    Open Circle Console
                  </button>
                </div>
              ) : isWalletMatched ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-green-950/20 text-green-300 space-y-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>Verified BridgeKey Public Key</span>
                    </div>
                    <p className="text-[11px] text-green-400/80">
                      Deposit 1 installment ({installment} tMSTC) as your refundable collateral buffer on MST Blockchain.
                    </p>
                  </div>

                  {joinStep !== "idle" && joinStep !== "success" && (
                    <div className="p-3.5 bg-black border border-neutral-800 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between text-neutral-400 font-mono text-[11px]">
                        <span>Blockchain Progress</span>
                        <span className="text-red-400 font-semibold uppercase">{joinStep}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <Clock className="w-4 h-4 text-red-500 animate-spin flex-shrink-0" />
                        <span>
                          {joinStep === "signing" && "Waiting for BridgeKey wallet confirmation..."}
                          {joinStep === "broadcasting" && "Submitting transaction to MST RPC..."}
                          {joinStep === "confirming" && "Awaiting MST Blockchain block confirmation..."}
                        </span>
                      </div>
                    </div>
                  )}

                  {confirmedTxHash && (
                    <div className="p-3 bg-black rounded-lg border border-neutral-900 flex items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-neutral-400">Tx: {confirmedTxHash.substring(0, 10)}...</span>
                      <a
                        href={`${MST_TESTNET.explorerUrl}/tx/${confirmedTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <span>View on Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmJoin}
                    disabled={isJoining || (hasInvitation && !isWalletMatched)}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Coins className="w-4 h-4" />
                    <span>
                      {isJoining
                        ? "Confirming on Blockchain..."
                        : `Deposit Collateral & Join (${installment} tMSTC)`}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Wallet Mismatch</span>
                  </div>
                  <p className="text-neutral-300 text-[11px]">
                    This invitation is registered for <span className="font-mono text-white">{invitationData?.wallet_address}</span>. Please switch to this account in your BridgeKey wallet to proceed.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* LOCKED: Not on Allowed IDs List - Requires Initializer Verification */
            <div className="space-y-5">
              <div className="p-5 bg-black rounded-xl space-y-3 text-center border-none">
                <div className="w-10 h-10 rounded-full bg-red-950/40 text-red-500 flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm">Access Restricted: Allowed IDs Only</h4>
                  <p className="text-neutral-400 text-[11px] max-w-sm mx-auto">
                    Your connected wallet is not on the allowed list for this savings circle.
                    Only the <span className="text-white font-semibold">Initializer</span> can verify and add your wallet ID to the allowed list.
                  </p>
                </div>
                <div className="p-2.5 bg-neutral-950 rounded-lg text-[11px] font-mono text-neutral-400 break-all text-left">
                  <span className="text-neutral-600 block text-[10px]">Your Wallet ID:</span>
                  <span>{account}</span>
                </div>
              </div>

              {/* Verification Request CTA */}
              {verificationStatus === "none" ? (
                <button
                  type="button"
                  onClick={handleRequestVerification}
                  className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>Request Verification from Initializer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : verificationStatus === "pending" ? (
                <div className="p-4 rounded-lg bg-yellow-950/20 text-yellow-300 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
                    <span>Verification Pending</span>
                  </div>
                  <p className="text-[11px] text-yellow-400/80">
                    Your request was sent to the initializer. Once approved, the group info and join action will automatically unlock.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleLookup(searchedCircle.address)}
                    className="mt-1 text-[11px] text-white hover:text-red-400 underline bg-transparent border-none cursor-pointer"
                  >
                    Check status now
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-red-950/20 text-red-400 space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Access Denied by Initializer</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    The circle initializer declined your join request.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
