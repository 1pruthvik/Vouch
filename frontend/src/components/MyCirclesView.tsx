import React, { useState, useEffect } from "react";
import { Shield, Share2, ArrowRight, Plus, Copy, Check, Users, Clock, ExternalLink } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { VerificationService, CircleRegistryEntry, JoinRequest } from "../services/verificationService";
import { ContractService } from "../services/contractService";

interface MyCirclesViewProps {
  account: string;
  contractService: ContractService | null;
  onSelectCircle: (circleAddress: string) => void;
  onCreateNewCircle: () => void;
  onShowNotification: (msg: string, isError?: boolean) => void;
}

export const MyCirclesView: React.FC<MyCirclesViewProps> = ({
  account,
  contractService,
  onSelectCircle,
  onCreateNewCircle,
  onShowNotification,
}) => {
  const [createdCircles, setCreatedCircles] = useState<CircleRegistryEntry[]>([]);
  const [pendingRequestsMap, setPendingRequestsMap] = useState<{ [addr: string]: number }>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const loadMyCircles = () => {
    if (!account) return;
    const myCircles = VerificationService.getCirclesByInitializer(account);
    setCreatedCircles(myCircles);

    const counts: { [addr: string]: number } = {};
    myCircles.forEach((c) => {
      const reqs = VerificationService.getRequestsForCircle(c.address);
      counts[c.address] = reqs.filter((r) => r.status === "pending").length;
    });
    setPendingRequestsMap(counts);
  };

  useEffect(() => {
    loadMyCircles();
  }, [account]);

  // Listen for storage events (e.g. join requests from other tabs)
  useEffect(() => {
    const handleStorage = () => loadMyCircles();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [account]);

  const copyGroupLink = (circleAddr: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullLink = `${origin}/?circle=${circleAddr}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(circleAddr);
    setTimeout(() => setCopiedLink(null), 2500);
    onShowNotification("Group invite link copied to clipboard!");
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-red-500 mb-1">
          <Shield className="w-3.5 h-3.5" />
          <span>Initializer Hub</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
          My Created Circles
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
          Manage all the savings circles you have initialized, share invite links, and review member requests.
        </p>
      </div>

      {/* Circles List */}
      {createdCircles.length === 0 ? (
        <div className="p-8 bg-neutral-950 rounded-2xl text-center space-y-4">
          <div className="p-3 text-neutral-600 flex items-center justify-center">
            <Users className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Circles Created Yet</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              You haven't created any savings circles yet. Deploy a new circle to start saving with your community.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateNewCircle}
            className="btn-primary py-3 px-6 text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create a Circle Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {createdCircles.map((circle) => {
            const pendingCount = pendingRequestsMap[circle.address] || 0;
            const approxInr = Math.round(parseFloat(circle.installmentAmount || "1.0") * MST_TO_INR_RATE);
            const totalPotInr = (circle.memberCount || 5) * approxInr;

            return (
              <div
                key={circle.address}
                className="p-5 bg-neutral-950 hover:bg-neutral-900/80 transition-all rounded-2xl space-y-4 text-xs"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 font-semibold text-[10px]">
                        Initializer
                      </span>
                      {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-yellow-950/40 text-yellow-400 font-semibold text-[10px] animate-pulse">
                          {pendingCount} Pending Request{pendingCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white font-display">
                      {circle.name}
                    </h3>
                    <p className="font-mono text-[11px] text-neutral-500 break-all">
                      ID: {circle.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => copyGroupLink(circle.address)}
                      className="p-2.5 rounded-lg bg-black hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors border-none cursor-pointer flex items-center gap-1.5"
                      title="Copy Invite Link"
                    >
                      {copiedLink === circle.address ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span className="text-[11px] font-mono">{copiedLink === circle.address ? "Copied" : "Share Link"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectCircle(circle.address)}
                      className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Manage Circle</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-900 text-center sm:text-left">
                  <div className="p-2.5 bg-black rounded-xl space-y-0.5">
                    <span className="text-[10px] text-neutral-500 block">Total Pot</span>
                    <span className="text-xs sm:text-sm font-bold text-white font-display">
                      {formatRawINR(totalPotInr)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-black rounded-xl space-y-0.5">
                    <span className="text-[10px] text-neutral-500 block">Monthly Contribution</span>
                    <span className="text-xs sm:text-sm font-bold text-white font-display">
                      {formatRawINR(approxInr)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-black rounded-xl space-y-0.5">
                    <span className="text-[10px] text-neutral-500 block">Member Capacity</span>
                    <span className="text-xs sm:text-sm font-bold text-white font-display">
                      {circle.memberCount} Members
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
