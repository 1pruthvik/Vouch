import React, { useState, useEffect } from "react";
import { Shield, Share2, ArrowRight, Plus, Copy, Check, Users, Clock, ExternalLink, Trash2, Edit3, Lock, Key, CheckCircle2, Sparkles } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { VerificationService, CircleRegistryEntry, JoinRequest } from "../services/verificationService";
import { ContractService } from "../services/contractService";
import { extractCircleAddress } from "./JoinCircleView";
import { EditCircleModal } from "./EditCircleModal";

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
  const [circles, setCircles] = useState<CircleRegistryEntry[]>([]);
  const [userRoleMap, setUserRoleMap] = useState<{ [addr: string]: "initializer" | "whitelisted" | "member" }>({});
  const [pendingRequestsMap, setPendingRequestsMap] = useState<{ [addr: string]: number }>({});
  const [startedMap, setStartedMap] = useState<{ [addr: string]: boolean }>({});
  const [filterTab, setFilterTab] = useState<"all" | "created" | "invited">("all");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [deletingAddr, setDeletingAddr] = useState<string | null>(null);

  // Edit circle modal
  const [editingCircle, setEditingCircle] = useState<CircleRegistryEntry | null>(null);

  const cleanAccount = (account || "").toLowerCase();

  const handleDeleteCircle = async (circleAddr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = extractCircleAddress(circleAddr);
    if (!window.confirm("Are you sure you want to delete this circle? This will remove it from the active registry.")) {
      return;
    }
    setDeletingAddr(clean);
    // Optimistic UI removal
    setCircles((prev) =>
      prev.filter((c) => {
        const addr = (c.address || "").toLowerCase();
        const target = clean.toLowerCase();
        return !addr.includes(target) && !target.includes(addr) && addr !== target;
      })
    );
    try {
      await VerificationService.deleteCircle(clean);
      await loadMyCircles();
      onShowNotification("Circle deleted successfully.");
    } catch (err: any) {
      await loadMyCircles();
      onShowNotification("Failed to delete circle.", true);
    } finally {
      setDeletingAddr(null);
    }
  };

  const loadMyCircles = async () => {
    if (!account) return;
    const cleanAcc = (account.match(/0x[a-fA-F0-9]{40}/i)?.[0] || account).toLowerCase();

    // 1. Fetch all user-relevant circles from backend
    try {
      const userCircles = await VerificationService.fetchCirclesForUser(cleanAcc);
      const allRegistered = await VerificationService.fetchAllCircles();

      // Combine and deduplicate
      const combinedMap = new Map<string, CircleRegistryEntry>();
      userCircles.forEach((c) => combinedMap.set(extractCircleAddress(c.address).toLowerCase(), c));
      allRegistered.forEach((c) => {
        const addr = extractCircleAddress(c.address).toLowerCase();
        const isInit = (c.initializer || "").toLowerCase().includes(cleanAcc) || cleanAcc.includes((c.initializer || "").toLowerCase());
        if (isInit) {
          combinedMap.set(addr, c);
        }
      });

      const list = Array.from(combinedMap.values());
      setCircles(list);

      const counts: { [addr: string]: number } = {};
      const newStartedMap: { [addr: string]: boolean } = {};
      const roles: { [addr: string]: "initializer" | "whitelisted" | "member" } = {};

      await Promise.all(
        list.map(async (c) => {
          const clean = extractCircleAddress(c.address);
          const isInit = (c.initializer || "").toLowerCase().includes(cleanAcc) || cleanAcc.includes((c.initializer || "").toLowerCase());

          // Check allowed members
          const isAllowed = await VerificationService.fetchIsMemberAllowed(clean, cleanAcc);

          // Requests count for initializer
          const reqs = await VerificationService.fetchRequestsForCircle(clean);
          counts[clean] = reqs.filter((r) => r.status === "pending").length;

          // Contract state
          let isMemberOnChain = false;
          if (contractService) {
            try {
              const details = await contractService.getGroupDetails(clean);
              if (details) {
                const isStarted = details.currentState !== "Forming" || (details.members && details.members.length >= details.memberCount && details.members.length > 0);
                newStartedMap[clean] = isStarted;
                isMemberOnChain = details.members.some((m) => m.toLowerCase().includes(cleanAcc) || cleanAcc.includes(m.toLowerCase()));
              }
            } catch {}
          }

          if (isInit) {
            roles[clean] = "initializer";
          } else if (isMemberOnChain) {
            roles[clean] = "member";
          } else if (isAllowed) {
            roles[clean] = "whitelisted";
          } else {
            roles[clean] = "whitelisted";
          }
        })
      );

      setPendingRequestsMap(counts);
      setStartedMap(newStartedMap);
      setUserRoleMap(roles);
    } catch (err) {
      console.warn("Error loading my circles:", err);
    }
  };

  useEffect(() => {
    loadMyCircles();
    const interval = setInterval(loadMyCircles, 3000);
    return () => clearInterval(interval);
  }, [account, contractService]);

  // Listen for storage events (e.g. join requests from other tabs)
  useEffect(() => {
    const handleStorage = () => loadMyCircles();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [account]);

  const copyGroupLink = (circleAddr: string) => {
    const clean = extractCircleAddress(circleAddr);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullLink = `${origin}/grouplink?circle=${clean}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(clean);
    setTimeout(() => setCopiedLink(null), 2500);
    onShowNotification("Group invite link copied to clipboard!");
  };

  const filteredCircles = circles.filter((c) => {
    const clean = extractCircleAddress(c.address);
    const role = userRoleMap[clean];
    if (filterTab === "created") return role === "initializer";
    if (filterTab === "invited") return role === "whitelisted" || role === "member";
    return true;
  });

  const createdCount = circles.filter((c) => userRoleMap[extractCircleAddress(c.address)] === "initializer").length;
  const invitedCount = circles.filter((c) => userRoleMap[extractCircleAddress(c.address)] !== "initializer").length;

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-red-500 mb-1">
          <Shield className="w-3.5 h-3.5" />
          <span>My Savings Hub</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
          My Savings Circles
        </h2>
      </div>

      {/* Filter Tabs */}
      {circles.length > 0 && (
        <div className="flex items-center justify-center gap-2 p-1.5 bg-neutral-950 rounded-xl w-fit mx-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all border-none cursor-pointer ${
              filterTab === "all" ? "bg-red-950 text-red-400" : "bg-transparent text-neutral-400 hover:text-white"
            }`}
          >
            All Circles ({circles.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("created")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all border-none cursor-pointer ${
              filterTab === "created" ? "bg-red-950 text-red-400" : "bg-transparent text-neutral-400 hover:text-white"
            }`}
          >
            Created by Me ({createdCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("invited")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all border-none cursor-pointer ${
              filterTab === "invited" ? "bg-red-950 text-red-400" : "bg-transparent text-neutral-400 hover:text-white"
            }`}
          >
            Whitelisted / Invited ({invitedCount})
          </button>
        </div>
      )}

      {/* Circles List */}
      {filteredCircles.length === 0 ? (
        <div className="p-8 bg-neutral-950 rounded-2xl text-center space-y-4">
          <div className="p-3 text-neutral-600 flex items-center justify-center">
            <Users className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Circles Found</h3>
          </div>
          <button
            type="button"
            onClick={onCreateNewCircle}
            className="btn-primary py-3 px-6 text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create a Circle</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCircles.map((circle) => {
            const clean = extractCircleAddress(circle.address);
            const pendingCount = pendingRequestsMap[clean] || pendingRequestsMap[circle.address] || 0;
            const approxInr = Math.round(parseFloat(circle.installmentAmount || "1.0") * MST_TO_INR_RATE);
            const totalPotInr = (circle.memberCount || 5) * approxInr;
            const isStarted = Boolean(startedMap[clean]);
            const role = userRoleMap[clean] || "initializer";
            const isInitializer = role === "initializer";

            return (
              <div
                key={circle.address}
                className="p-5 bg-neutral-950 hover:bg-neutral-900/80 transition-all rounded-2xl space-y-4 text-xs"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isInitializer ? (
                        <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 font-semibold text-[10px] flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>Initializer</span>
                        </span>
                      ) : role === "member" ? (
                        <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 font-semibold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-neutral-400" />
                          <span>Member</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 font-semibold text-[10px] flex items-center gap-1">
                          <Key className="w-3 h-3 text-neutral-400" />
                          <span>Whitelisted</span>
                        </span>
                      )}

                      {isStarted ? (
                        <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 font-semibold text-[10px] flex items-center gap-1">
                          <Lock className="w-3 h-3 text-neutral-400" />
                          <span>Started</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 font-semibold text-[10px]">
                          Forming
                        </span>
                      )}

                      {isInitializer && pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-red-950/30 text-red-400 font-semibold text-[10px]">
                          {pendingCount} Pending Request{pendingCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white font-display">
                      {circle.name}
                    </h3>
                    <p className="font-mono text-[11px] text-neutral-500 break-all">
                      ID: {clean}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => copyGroupLink(clean)}
                      className="p-2.5 rounded-lg bg-black hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors border-none cursor-pointer flex items-center gap-1.5"
                      title="Copy Invite Link"
                    >
                      {copiedLink === clean ? (
                        <Check className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span className="text-[11px] font-mono">{copiedLink === clean ? "Copied" : "Share Link"}</span>
                    </button>

                    {/* Edit and Delete are available ONLY TO INITIALIZER BEFORE circle starts */}
                    {isInitializer && !isStarted && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCircle(circle);
                          }}
                          className="p-2.5 rounded-lg bg-black hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors border-none cursor-pointer flex items-center gap-1"
                          title="Edit Circle"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-[11px]">Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteCircle(clean, e)}
                          disabled={deletingAddr === clean}
                          className="p-2.5 rounded-lg bg-black hover:bg-red-950/40 text-neutral-500 hover:text-red-400 transition-colors border-none cursor-pointer flex items-center gap-1"
                          title="Delete Circle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectCircle(clean)}
                      className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{isInitializer ? "Manage Circle" : "Open Circle"}</span>
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

      {/* Edit Circle Modal */}
      {editingCircle && (
        <EditCircleModal
          isOpen={Boolean(editingCircle)}
          onClose={() => setEditingCircle(null)}
          circle={editingCircle}
          account={account}
          isCircleStarted={Boolean(startedMap[extractCircleAddress(editingCircle.address)])}
          onSuccess={(msg) => {
            onShowNotification(msg);
            loadMyCircles();
          }}
        />
      )}
    </div>
  );
};
