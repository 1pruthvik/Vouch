import React, { useState, useEffect } from "react";
import { Plus, ArrowRight, Shield, CheckCircle2, Copy, Check, Users, Clock, CheckCheck, XCircle, Share2 } from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { VerificationService, JoinRequest, CircleRegistryEntry } from "../services/verificationService";

interface CreateGroupViewProps {
  account: string;
  onCreateGroup: (params: {
    groupName: string;
    memberCount: number;
    installmentAmount: string;
    cycleDuration: number;
    discountCapBps: number;
    reserveFeeBps: number;
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
  const [memberCount, setMemberCount] = useState<number | "">(5);
  const [installmentInr, setInstallmentInr] = useState<number | "">(5000);
  const [reserveFeeInr, setReserveFeeInr] = useState<number | "">(250);
  const [cycleDurationMonths, setCycleDurationMonths] = useState<number | "">(1);
  const [discountCapPercent, setDiscountCapPercent] = useState<number | "">(30);

  const [initializedCircles, setInitializedCircles] = useState<CircleRegistryEntry[]>([]);
  const [circleRequests, setCircleRequests] = useState<{ [circleAddr: string]: JoinRequest[] }>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const loadInitializerData = () => {
    if (!account) return;
    const myCircles = VerificationService.getCirclesByInitializer(account);
    setInitializedCircles(myCircles);

    const reqMap: { [circleAddr: string]: JoinRequest[] } = {};
    myCircles.forEach((c) => {
      reqMap[c.address] = VerificationService.getRequestsForCircle(c.address);
    });
    setCircleRequests(reqMap);
  };

  useEffect(() => {
    loadInitializerData();
  }, [account, deployedCircleAddress]);

  const numInstallmentInr = Number(installmentInr) || 0;
  const numMembers = Number(memberCount) || 1;
  const installmentTokens = (numInstallmentInr / INR_PER_TMSTC).toFixed(4);
  const totalPotInr = numMembers * numInstallmentInr;
  const numReserveFeeInr = Number(reserveFeeInr) || 0;

  const calculatedReserveFeeBps =
    totalPotInr > 0
      ? Math.min(2000, Math.max(100, Math.round((numReserveFeeInr / totalPotInr) * 10000)))
      : 500;

  const numMonths = Number(cycleDurationMonths) || 1;
  const cycleDurationSeconds = numMonths * 30 * 24 * 3600;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !memberCount || !installmentInr) return;

    const newAddress = await onCreateGroup({
      groupName,
      memberCount: Number(memberCount),
      installmentAmount: installmentTokens,
      cycleDuration: cycleDurationSeconds,
      discountCapBps: (Number(discountCapPercent) || 30) * 100,
      reserveFeeBps: calculatedReserveFeeBps,
    });

    if (newAddress) {
      VerificationService.registerCircle({
        address: newAddress,
        name: groupName,
        memberCount: Number(memberCount),
        installmentAmount: installmentTokens,
        cycleDuration: cycleDurationSeconds,
        initializer: account,
        createdAt: Date.now(),
      });
      loadInitializerData();
    }
  };

  const handleVerifyApplicant = (circleAddress: string, applicantAddress: string) => {
    VerificationService.verifyApplicant(circleAddress, applicantAddress);
    loadInitializerData();
    onShowNotification(`Verified applicant ${applicantAddress.substring(0, 6)}...`);
  };

  const handleRejectApplicant = (circleAddress: string, applicantAddress: string) => {
    VerificationService.rejectApplicant(circleAddress, applicantAddress);
    loadInitializerData();
    onShowNotification(`Rejected applicant ${applicantAddress.substring(0, 6)}...`);
  };

  const copyGroupLink = (circleAddr: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullLink = `${origin}/?circle=${circleAddr}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(circleAddr);
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
              placeholder="e.g. Friends & Family Chit Fund"
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
                Max Draw Discount (%)
              </label>
              <input
                type="number"
                min="5"
                max="50"
                required
                value={discountCapPercent}
                onChange={(e) =>
                  setDiscountCapPercent(e.target.value === "" ? "" : parseInt(e.target.value))
                }
                disabled={isDeploying}
                className="w-full bg-neutral-950 rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none transition-all"
              />
            </div>
          </div>

          {/* Pot summary */}
          <div className="p-5 bg-neutral-950 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-white font-semibold">
              <span className="text-neutral-400">Total Monthly Pot:</span>
              <span className="font-display text-lg text-white font-bold">{formatRawINR(totalPotInr)}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-500 text-[11px] font-mono">
              <span>Per Member Contribution:</span>
              <span>≈ {installmentTokens} tMSTC / month</span>
            </div>
          </div>

          {/* Deploy Button */}
          <button
            type="submit"
            disabled={isDeploying || !account || !groupName}
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
              Share the group link and verify applicant join requests below.
            </p>
          </div>

          <div className="space-y-4">
            {initializedCircles.map((circle) => {
              const requests = circleRequests[circle.address] || [];
              const pendingRequests = requests.filter((r) => r.status === "pending");
              const verifiedRequests = requests.filter((r) => r.status === "verified");

              return (
                <div key={circle.address} className="p-5 bg-neutral-950 rounded-xl space-y-4 text-xs">
                  {/* Circle Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-900 pb-3">
                    <div>
                      <h4 className="font-bold text-white text-sm">{circle.name}</h4>
                      <p className="font-mono text-[11px] text-neutral-500 break-all">
                        ID: {circle.address}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyGroupLink(circle.address)}
                      className="btn-secondary text-xs py-2 px-3 self-start sm:self-auto flex items-center gap-1.5"
                    >
                      {copiedLink === circle.address ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400 font-semibold">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Copy Group Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Pending Requests */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-neutral-400 text-[11px] font-semibold">
                      <span>Pending Join Requests ({pendingRequests.length})</span>
                    </div>

                    {pendingRequests.length === 0 ? (
                      <p className="text-[11px] text-neutral-600 italic py-1">
                        No pending join requests at this time. Share your group link with prospective members.
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
                                <span>Verify</span>
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
                        Verified Applicants ({verifiedRequests.length})
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
    </div>
  );
};
