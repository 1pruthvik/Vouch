import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  ArrowLeft,
  UserPlus,
  Users,
  Coins,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  ChevronRight,
  TrendingUp,
  Award,
  Check,
  Play,
  RotateCcw,
  FastForward,
  Copy,
  Gift,
  Trophy,
  Code2,
  HelpCircle,
  Activity,
  Calendar,
  Landmark,
  Building,
  Zap,
} from "lucide-react";
import gsap from "gsap";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { MST_TESTNET } from "../config/network";
import {
  CircleData,
  CircleLifecycleService,
  ParticipantInput,
} from "../services/circleLifecycleService";
import { InviteMembersModal } from "./InviteMembersModal";

interface CircleWorkspaceProps {
  circleIdOrAddress: string;
  account: string | null;
  balance: string;
  isTechnicalMode: boolean;
  onBackToDirectory: () => void;
  onOpenConnectModal: () => void;
  onShowNotification: (msg: string, isError?: boolean) => void;
}

export const CircleWorkspace: React.FC<CircleWorkspaceProps> = ({
  circleIdOrAddress,
  account,
  balance,
  isTechnicalMode,
  onBackToDirectory,
  onOpenConnectModal,
  onShowNotification,
}) => {
  const [circle, setCircle] = useState<CircleData | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auction form state
  const [requestedPayoutINR, setRequestedPayoutINR] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdminSteppedDown, setIsAdminSteppedDown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load circle data
  const refreshCircle = () => {
    const data = CircleLifecycleService.getCircleByIdOrAddress(circleIdOrAddress);
    if (data) {
      setCircle(data);
      if (requestedPayoutINR === 0 && data.currentPotINR > 0) {
        setRequestedPayoutINR(Math.round(data.currentPotINR * 0.9));
      }
    }
  };

  useEffect(() => {
    refreshCircle();
  }, [circleIdOrAddress]);

  // GSAP entrance animation
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !containerRef.current) return;

    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
  }, [circleIdOrAddress, circle?.status]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!circle) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-black/[0.04] flex items-center justify-center mx-auto text-[#5F6368]">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-[#121316] font-display">Circle Not Found</h2>
        <p className="text-sm text-[#5F6368] max-w-md mx-auto">
          The requested savings circle (<code>{circleIdOrAddress}</code>) could not be located in your active workspace.
        </p>
        <button
          type="button"
          onClick={onBackToDirectory}
          className="v-btn-primary text-xs inline-flex items-center gap-2 mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Circle Directory
        </button>
      </div>
    );
  }

  // Lifecycle calculations
  const totalPot = circle.currentPotINR || circle.memberCount * circle.installmentAmountINR;
  const minBidAllowed = Math.round(totalPot * (1 - circle.discountCapBps / 10000));
  const discountOffered = Math.max(0, totalPot - (requestedPayoutINR || totalPot * 0.9));
  const memberSavingsShare = circle.memberCount > 0 ? Math.round(discountOffered / circle.memberCount) : 0;
  const joinedCount = circle.members.length;
  const capacity = circle.memberCount;
  const pendingInvites = circle.invitations.filter((i) => i.status === "PENDING");

  // Lifecycle state handler actions
  const handleSendInvitations = (participantsToInvite: ParticipantInput[]) => {
    const res = CircleLifecycleService.sendManualInvitations(circle.id, participantsToInvite);
    if (res.success && res.circle) {
      setCircle(res.circle);
      onShowNotification(`${participantsToInvite.length} invitation${participantsToInvite.length === 1 ? "" : "s"} sent to participants`);
    } else if (res.error) {
      onShowNotification(res.error, true);
    }
  };

  const handleCancelInvitation = (invitationId: string) => {
    const updated = CircleLifecycleService.cancelInvitation(circle.id, invitationId);
    if (updated) {
      setCircle(updated);
      onShowNotification("Invitation cancelled");
    }
  };

  const handleAcceptInvitation = (invitationId: string) => {
    const updated = CircleLifecycleService.acceptInvitation(circle.id, invitationId);
    if (updated) {
      setCircle(updated);
      onShowNotification("Member joined circle and deposited buffer!");
    }
  };

  const handleAcceptAllInvitations = () => {
    const updated = CircleLifecycleService.acceptAllInvitations(circle.id);
    if (updated) {
      setCircle(updated);
      onShowNotification("All invited members joined the circle!");
    }
  };

  const handleStartContributionRound = () => {
    const updated = CircleLifecycleService.startContributionRound(circle.id);
    if (updated) {
      setCircle(updated);
      onShowNotification(`Round ${circle.currentRound} contribution period started!`);
    }
  };

  const handlePayContribution = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const userAddr = account || circle.members[0]?.address || "0x71C8F21c83B386f786f4a3E0b90494F3c419392B";
      const updated = CircleLifecycleService.payContribution(circle.id, userAddr);
      if (updated) {
        setCircle(updated);
        onShowNotification(`Monthly contribution of ₹${circle.installmentAmountINR.toLocaleString("en-IN")} confirmed!`);
      }
      setIsProcessing(false);
    }, 600);
  };

  const handleCommitBid = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      const userAddr = account || circle.members[0]?.address || "0x71C8F21c83B386f786f4a3E0b90494F3c419392B";
      const updated = CircleLifecycleService.commitBid(circle.id, userAddr, requestedPayoutINR);
      if (updated) {
        setCircle(updated);
        onShowNotification("Secret bid commitment anchored on MST Blockchain!");
      }
      setIsProcessing(false);
    }, 600);
  };

  const handleRevealAndSettle = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const updated = CircleLifecycleService.revealAndSettleAuction(
        circle.id,
        circle.members[0]?.address,
        requestedPayoutINR || Math.round(totalPot * 0.85)
      );
      if (updated) {
        setCircle(updated);
        onShowNotification(`Round ${circle.currentRound} auction settled! Pot distributed.`);
      }
      setIsProcessing(false);
    }, 600);
  };

  const handleAdvanceRound = () => {
    const updated = CircleLifecycleService.advanceToNextRound(circle.id);
    if (updated) {
      setCircle(updated);
      onShowNotification(`Advanced to Round ${updated.currentRound}!`);
    }
  };

  // Timeline Steps
  const timelineSteps = [
    { label: "1. Created", active: true, done: true },
    {
      label: "2. Inviting",
      active: circle.status === "WAITING_FOR_MEMBERS" && circle.invitations.length > 0,
      done: circle.members.length > 0,
    },
    {
      label: "3. Filled",
      active: circle.status === "READY",
      done: circle.members.length >= circle.memberCount,
    },
    {
      label: "4. Contributions",
      active: circle.status === "COLLECTING",
      done: circle.status === "AUCTION_COMMIT" || circle.status === "AUCTION_REVEAL" || circle.status === "AUCTION_SETTLED",
    },
    {
      label: "5. Secret Auction",
      active: circle.status === "AUCTION_COMMIT",
      done: circle.status === "AUCTION_REVEAL" || circle.status === "AUCTION_SETTLED",
    },
    {
      label: "6. Reveal & Settle",
      active: circle.status === "AUCTION_REVEAL" || circle.status === "AUCTION_SETTLED",
      done: circle.status === "AUCTION_SETTLED",
    },
    {
      label: "7. Next Round",
      active: circle.status === "AUCTION_SETTLED",
      done: circle.currentRound > 1,
    },
  ];

  return (
    <div ref={containerRef} className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ── 1. TOP BREADCRUMB & WORKSPACE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.05]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDirectory}
            className="p-2 rounded-full bg-black/[0.03] hover:bg-black/[0.07] text-[#5F6368] hover:text-[#121316] transition-colors"
            title="Back to Circle Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#946800] uppercase tracking-wider">
                Dedicated Savings Circle Workspace
              </span>
              <span className="text-[#8F959E]">·</span>
              <span className="text-[11px] font-mono text-[#5F6368]">
                ID: {circle.id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#121316] font-display tracking-tight mt-0.5">
              {circle.name}
            </h1>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2">
          {circle.status === "WAITING_FOR_MEMBERS" && (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="v-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#E9B949]" />
              Invite Members
            </button>
          )}

          {circle.status === "READY" && (
            <button
              type="button"
              onClick={handleStartContributionRound}
              className="v-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-[#E9B949] fill-current" />
              Start Round 1
            </button>
          )}

          {circle.status === "COLLECTING" && (
            <button
              type="button"
              onClick={handlePayContribution}
              disabled={isProcessing}
              className="v-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5 text-[#E9B949]" />
              {isProcessing ? "Processing..." : `Pay Contribution (₹${circle.installmentAmountINR.toLocaleString("en-IN")})`}
            </button>
          )}

          {circle.status === "AUCTION_SETTLED" && (
            <button
              type="button"
              onClick={handleAdvanceRound}
              className="v-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <FastForward className="w-3.5 h-3.5 text-[#E9B949]" />
              Advance to Round {circle.currentRound + 1}
            </button>
          )}
        </div>
      </div>

      {/* ── 2. JUDGE DEMO ACCELERATION BAR (Hackathon Demo Aid) ── */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#5E4080]/[0.05] border border-[#5E4080]/[0.15] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#5E4080]/15 text-[#5E4080]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-[#121316] flex items-center gap-2">
              Chit Fund Lifecycle Simulator
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#5E4080]/10 text-[#5E4080] border border-[#5E4080]/20">
                Hackathon Demo Aid
              </span>
            </p>
            <p className="text-[11px] text-[#5F6368]">
              Fast-forward circle lifecycle states to demonstrate the entire financial cycle to judges.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {circle.status === "WAITING_FOR_MEMBERS" && (
            <button
              type="button"
              onClick={() => {
                if (circle.invitations.length === 0 && circle.members.length === 0) {
                  const sampleParticipants: ParticipantInput[] = [
                    { name: "Rahul N", email: "rahul.n@gmail.com", walletAddress: "0x91F221A378D33B037A6668fOd128c4BBA28bb659" },
                    { name: "Ananya Rao", email: "ananya.rao@gmail.com", walletAddress: "0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f" },
                    { name: "Vikram Patel", email: "vikram.patel@gmail.com", walletAddress: "0xb794f5ea0ba39494ce839613fffba74279579268" },
                    { name: "Sneha Iyer", email: "sneha.iyer@gmail.com", walletAddress: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512" },
                    { name: "Priya Sharma", email: "priya.sharma@gmail.com", walletAddress: "0x39A88F110B74f5ea0ba39494ce839613fffba742" },
                  ].slice(0, circle.memberCount);
                  const res = CircleLifecycleService.sendManualInvitations(circle.id, sampleParticipants);
                  if (res.success && res.circle) {
                    setCircle(res.circle);
                    setTimeout(() => handleAcceptAllInvitations(), 250);
                  }
                } else {
                  handleAcceptAllInvitations();
                }
              }}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-black/[0.03] border border-black/[0.08] text-[11px] font-semibold text-[#121316] shadow-sm flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              Simulate Members Joining
            </button>
          )}

          {circle.status === "READY" && (
            <button
              type="button"
              onClick={handleStartContributionRound}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-black/[0.03] border border-black/[0.08] text-[11px] font-semibold text-[#121316] shadow-sm flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-indigo-600 fill-current" />
              Start Contribution Phase
            </button>
          )}

          {circle.status === "COLLECTING" && (
            <button
              type="button"
              onClick={handlePayContribution}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-black/[0.03] border border-black/[0.08] text-[11px] font-semibold text-[#121316] shadow-sm flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              Collect All Dues & Open Auction
            </button>
          )}

          {circle.status === "AUCTION_COMMIT" && (
            <button
              type="button"
              onClick={handleRevealAndSettle}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-black/[0.03] border border-black/[0.08] text-[11px] font-semibold text-[#121316] shadow-sm flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-[#946800]" />
              Settle Auction (₹21,250 Payout)
            </button>
          )}

          {circle.status === "AUCTION_SETTLED" && (
            <button
              type="button"
              onClick={handleAdvanceRound}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-black/[0.03] border border-black/[0.08] text-[11px] font-semibold text-[#121316] shadow-sm flex items-center gap-1.5"
            >
              <FastForward className="w-3.5 h-3.5 text-emerald-600" />
              Advance to Next Round ({circle.currentRound + 1}/{circle.totalRounds})
            </button>
          )}
        </div>
      </div>

      {/* ── 3. VISUAL LIFECYCLE PROGRESS STEPPER ── */}
      <div className="v-card p-4 sm:p-5 border border-black/[0.06] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#121316] uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#946800]" />
            Chit Fund Lifecycle State Machine
          </span>
          <span className="font-mono text-[11px] text-[#5F6368]">
            Status: <strong className="text-[#121316]">{circle.status.replace(/_/g, " ")}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
          {timelineSteps.map((step, i) => (
            <div
              key={i}
              className={`p-2 rounded-full border text-center transition-all text-[11px] ${
                step.active
                  ? "bg-[#121316] border-[#121316] text-white font-semibold shadow-sm"
                  : step.done
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium"
                  : "bg-black/[0.02] border-black/[0.05] text-[#8F959E]"
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                {step.done && <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />}
                <span className="truncate">{step.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. KEY SUMMARY METRICS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Contribution */}
        <div className="v-card p-5 space-y-1.5 border border-black/[0.06]">
          <span className="text-xs font-semibold text-[#5F6368]">Monthly Contribution</span>
          <p className="text-2xl font-bold text-[#121316] font-display tracking-tight tabular-nums">
            {formatRawINR(circle.installmentAmountINR)}
          </p>
          <p className="text-[11px] text-[#5F6368] font-mono">
            {circle.installmentAmount} tMSTC per member
          </p>
        </div>

        {/* Total Circle Pot */}
        <div className="v-card p-5 space-y-1.5 border border-black/[0.06]">
          <span className="text-xs font-semibold text-[#5F6368]">Total Circle Pot Value</span>
          <p className="text-2xl font-bold text-emerald-700 font-display tracking-tight tabular-nums">
            {formatRawINR(totalPot)}
          </p>
          <p className="text-[11px] text-[#5F6368]">
            {circle.memberCount} members × {formatRawINR(circle.installmentAmountINR)}
          </p>
        </div>

        {/* Member Capacity Progress */}
        <div className="v-card p-5 space-y-1.5 border border-black/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6368]">Members Joined</span>
            <span className={`text-[11px] font-bold font-mono ${joinedCount >= capacity ? "text-emerald-700" : "text-[#946800]"}`}>
              {joinedCount} / {capacity}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {Array.from({ length: capacity }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-2 rounded-full transition-all ${
                  idx < joinedCount ? "bg-emerald-500 shadow-xs" : "bg-black/[0.08]"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-[#5F6368]">
            {joinedCount >= capacity
              ? "All slots filled · Circle full"
              : `${capacity - joinedCount} spot${capacity - joinedCount === 1 ? "" : "s"} remaining`}
          </p>
        </div>

        {/* Round Progress */}
        <div className="v-card p-5 space-y-1.5 border border-black/[0.06]">
          <span className="text-xs font-semibold text-[#5F6368]">Chit Round</span>
          <p className="text-2xl font-bold text-indigo-700 font-display tracking-tight tabular-nums">
            Round {circle.currentRound} / {circle.totalRounds}
          </p>
          <p className="text-[11px] text-[#5F6368]">
            {circle.status === "AUCTION_SETTLED" ? "Round settled" : "Active cycle"}
          </p>
        </div>
      </div>

      {/* ── 5. MAIN STAGE WORKSPACE AREA ── */}

      {/* STATE A: WAITING FOR MEMBERS (Zero members or unfilled) */}
      {circle.status === "WAITING_FOR_MEMBERS" && (
        <div className="space-y-6">
          {/* Hero Empty / Setup State Card */}
          <div className="v-card-hero p-6 sm:p-8 border border-black/[0.06] text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[#8C6400] text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[#E9B949]" />
                  <span>WAITING FOR MEMBERS ({joinedCount} / {capacity})</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#121316] font-display">
                  {joinedCount === 0
                    ? "No participants have joined this circle yet."
                    : `${joinedCount} of ${capacity} participants joined.`}
                </h2>
                <p className="text-xs sm:text-sm text-[#5F6368] leading-relaxed">
                  Invite your colleagues, family, or savings peers to lock their refundable security buffer on MST Blockchain. Once all {capacity} members join, Round 1 will activate autonomously.
                </p>
              </div>

              <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="v-btn-primary text-xs px-5 py-2.5 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-[#E9B949]" />
                  Invite Members Now
                </button>
                <span className="text-[11px] text-[#8F959E] font-mono">
                  {capacity - joinedCount} invitation slot{capacity - joinedCount === 1 ? "" : "s"} open
                </span>
              </div>
            </div>
          </div>

          {/* Pending Invitations Section */}
          {pendingInvites.length > 0 && (
            <div className="v-card p-5 sm:p-6 border border-black/[0.06] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#121316] font-display flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#946800]" />
                    Pending Participant Invitations ({pendingInvites.length})
                  </h3>
                  <p className="text-xs text-[#5F6368]">
                    Awaiting participant response and refundable security buffer deposit.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAcceptAllInvitations}
                  className="px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[11px] font-semibold text-[#121316] transition-colors"
                >
                  Simulate All Acceptances →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {pendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-black/[0.05] space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-xs text-[#121316] truncate">{inv.participantName}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-[#8C6400] font-medium flex-shrink-0">
                          Pending
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5F6368] font-mono truncate mt-0.5">
                        {inv.participantEmail}
                      </p>
                      <p className="text-[10px] text-[#8F959E] font-mono truncate">
                        {inv.walletAddress}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-black/[0.04]">
                      <button
                        type="button"
                        onClick={() => handleAcceptInvitation(inv.id)}
                        className="flex-1 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-black/[0.08] hover:border-emerald-300 text-[11px] font-semibold text-[#121316] hover:text-emerald-800 shadow-2xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        Accept & Join
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelInvitation(inv.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-black/[0.08] hover:border-rose-300 text-[11px] font-medium text-[#5F6368] hover:text-rose-700 transition-colors"
                        title="Cancel Invitation"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE B: CIRCLE READY (All members filled, ready to start) */}
      {circle.status === "READY" && (
        <div className="v-card-hero p-6 sm:p-8 border border-black/[0.06] text-center sm:text-left space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>ALL {capacity} MEMBER SLOTS FILLED</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#121316] font-display">
                Circle Ready to Begin Round 1
              </h2>
              <p className="text-xs sm:text-sm text-[#5F6368] leading-relaxed">
                All {circle.memberCount} members have locked their refundable security buffers in the ChitGroup smart contract. The first monthly contribution cycle can now commence.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartContributionRound}
              className="v-btn-primary text-xs px-6 py-3 flex items-center justify-center gap-2 flex-shrink-0"
            >
              <Play className="w-4 h-4 text-[#E9B949] fill-current" />
              Start Contribution Period
            </button>
          </div>
        </div>
      )}

      {/* STATE C: CONTRIBUTIONS DUE */}
      {circle.status === "COLLECTING" && (
        <div className="v-card p-6 sm:p-7 border border-black/[0.06] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.05]">
            <div>
              <div className="v-badge v-badge-gold mb-2">
                <Coins className="w-3.5 h-3.5" />
                ROUND {circle.currentRound} DUES COLLECTION
              </div>
              <h3 className="text-lg font-bold text-[#121316] font-display">
                Monthly Contributions Due
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Each member deposits ₹{circle.installmentAmountINR.toLocaleString("en-IN")} into the community escrow pot.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePayContribution}
              disabled={isProcessing}
              className="v-btn-primary text-xs px-6 py-3 flex items-center gap-2 flex-shrink-0"
            >
              <Coins className="w-4 h-4 text-[#E9B949]" />
              {isProcessing ? "Confirming on-chain..." : `Deposit ₹${circle.installmentAmountINR.toLocaleString("en-IN")}`}
            </button>
          </div>

          {/* Member Payment Status Grid */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#5F6368]">Participant Payment Status</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {circle.members.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FAF9F5] border border-black/[0.05] flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-[#121316] truncate">{m.name}</p>
                    <p className="text-[10px] text-[#8F959E] font-mono truncate">{m.address}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                      m.hasPaidContribution
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {m.hasPaidContribution ? "Paid ✓" : "Dues Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STATE D: REVERSE AUCTION (Commit Phase) */}
      {circle.status === "AUCTION_COMMIT" && (
        <div className="v-card p-6 sm:p-7 border border-black/[0.06] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.05]">
            <div>
              <div className="v-badge v-badge-purple mb-2">
                <Lock className="w-3.5 h-3.5" />
                SECRET COMMIT-REVEAL REVERSE AUCTION
              </div>
              <h3 className="text-lg font-bold text-[#121316] font-display">
                Request Early Pot Payout (Round {circle.currentRound})
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Total Pot: <strong className="text-[#121316]">₹{totalPot.toLocaleString("en-IN")}</strong>. How much less would you accept? Best discount wins.
              </p>
            </div>

            <div className="text-right font-mono">
              <span className="text-[11px] text-[#8F959E]">Available Pot</span>
              <p className="text-2xl font-bold text-emerald-700 font-display">
                ₹{totalPot.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <form onSubmit={handleCommitBid} className="space-y-6">
            {/* Range Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#5F6368]">Your Requested Payout:</span>
                <span className="text-xl font-bold font-display text-emerald-700 tabular-nums font-mono">
                  ₹{requestedPayoutINR.toLocaleString("en-IN")}
                </span>
              </div>

              <input
                type="range"
                min={minBidAllowed}
                max={totalPot}
                step={100}
                value={requestedPayoutINR}
                onChange={(e) => setRequestedPayoutINR(Number(e.target.value))}
                className="w-full"
              />

              <div className="flex justify-between text-[11px] text-[#8F959E] font-mono">
                <span>Floor Cap: ₹{minBidAllowed.toLocaleString("en-IN")} (30% Max Discount)</span>
                <span>Full Pot: ₹{totalPot.toLocaleString("en-IN")} (0% Discount)</span>
              </div>
            </div>

            {/* Impact Calculation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.05]">
                <p className="text-[11px] text-[#5F6368] font-medium">Discount Shared with Circle</p>
                <p className="text-lg font-bold text-purple-700 font-display mt-0.5 tabular-nums">
                  ₹{discountOffered.toLocaleString("en-IN")} ({totalPot > 0 ? ((discountOffered / totalPot) * 100).toFixed(1) : 0}%)
                </p>
                <p className="text-[10px] text-[#8F959E] mt-0.5">Larger discount increases win probability</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.05]">
                <p className="text-[11px] text-[#5F6368] font-medium">Each Peer Earns</p>
                <p className="text-lg font-bold text-[#946800] font-display mt-0.5 tabular-nums">
                  +₹{memberSavingsShare.toLocaleString("en-IN")} / member
                </p>
                <p className="text-[10px] text-[#8F959E] mt-0.5">Credited directly to everyone's savings balance</p>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-[#5F6368]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Encrypted via keccak256 hash commitment — nobody peeks at your bid.</span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="v-btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-[#E9B949]" />
                {isProcessing ? "Anchoring on MST Blockchain..." : `Commit Secret Bid (₹${requestedPayoutINR.toLocaleString("en-IN")})`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STATE E: REVEAL & SETTLE */}
      {circle.status === "AUCTION_REVEAL" && (
        <div className="v-card p-6 sm:p-7 border border-black/[0.06] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-black/[0.05]">
            <div>
              <div className="v-badge v-badge-purple mb-2">
                <Unlock className="w-3.5 h-3.5" />
                PLAINTEXT REVEAL PHASE
              </div>
              <h3 className="text-lg font-bold text-[#121316] font-display">
                Reveal Verified Plaintext Bids
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Commit period closed. Smart contract will verify plaintext bids against the stored Keccak256 commitment hashes.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRevealAndSettle}
              disabled={isProcessing}
              className="v-btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-[#E9B949]" />
              {isProcessing ? "Verifying & Settling..." : "Reveal & Finalize Winner"}
            </button>
          </div>
        </div>
      )}

      {/* STATE F: AUCTION SETTLED & POT PAID */}
      {circle.status === "AUCTION_SETTLED" && (
        <div className="v-card p-6 sm:p-8 border border-black/[0.06] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-black/[0.05]">
            <div className="space-y-1.5">
              <div className="v-badge v-badge-green mb-1">
                <Trophy className="w-3.5 h-3.5 text-emerald-700" />
                ROUND {circle.currentRound} AUCTION SETTLED
              </div>
              <h2 className="text-2xl font-bold text-[#121316] font-display">
                Pot Awarded to {circle.winnerName || "Arjun Kumar"}
              </h2>
              <p className="text-xs text-[#5F6368]">
                Settlement executed autonomously by the ChitGroup smart contract on MST Testnet.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#5F6368] font-medium">Winner Payout</span>
              <p className="text-3xl font-bold text-emerald-700 font-display tabular-nums">
                ₹{(circle.winningBidINR || Math.round(totalPot * 0.85)).toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-[#8F959E] font-mono">
                Gross Pot: ₹{totalPot.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.05]">
              <span className="text-[#5F6368]">Winning Discount</span>
              <p className="text-lg font-bold text-purple-700 font-display mt-0.5">
                ₹{(totalPot - (circle.winningBidINR || Math.round(totalPot * 0.85))).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.05]">
              <span className="text-[#5F6368]">Dividend Yield / Member</span>
              <p className="text-lg font-bold text-[#946800] font-display mt-0.5">
                +₹{(circle.discountSavingsPerMemberINR || 750).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.05]">
              <span className="text-[#5F6368]">Cryptographic Receipt</span>
              <a
                href={`${MST_TESTNET.explorerUrl}/tx/${circle.settlementTxHash || "0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f"}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono font-semibold text-emerald-700 hover:underline flex items-center gap-1 mt-1 truncate"
              >
                mstscan.com <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleAdvanceRound}
              className="v-btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
            >
              <FastForward className="w-4 h-4 text-[#E9B949]" />
              Advance to Round {circle.currentRound + 1}
            </button>
          </div>
        </div>
      )}

      {/* ── 5.5. AUTONOMOUS CHIT FUND FINANCIAL PIPELINE & STAGNANT FD COMPARISON ── */}
      <div className="v-card p-5 sm:p-6 border border-black/[0.06] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.05]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#946800] uppercase tracking-wider mb-1">
              <Landmark className="w-3.5 h-3.5" />
              Community Self-Help Fund vs Stagnant Bank FDs
            </div>
            <h3 className="text-base font-bold text-[#121316] font-display">
              Autonomous Financial Cycle & 5–9% P.A. Extra Profit Engine
            </h3>
            <p className="text-xs text-[#5F6368]">
              Empowers communities who don't want or can't invest in banks, generating higher yields through DeFi and overcollateralized currency exchange.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdminSteppedDown ? (
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Decentralized Community Timelock
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsAdminSteppedDown(true);
                  onShowNotification("Admin stepped down. Full circle governance transferred to autonomous community timelock.");
                }}
                className="px-3 py-1.5 rounded-full bg-black/[0.03] hover:bg-black/[0.07] border border-black/[0.08] text-[11px] font-semibold text-[#121316] transition-colors flex items-center gap-1.5"
                title="Transfer administrative control to decentralized community timelock"
              >
                <Unlock className="w-3.5 h-3.5 text-[#946800]" />
                Step Down Admin
              </button>
            )}
          </div>
        </div>

        {/* 4-Stage Monthly Financial Pipeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Stage 1: 1st of Month */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.05] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                1st of Month
              </span>
              <Coins className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="font-bold text-[#121316] font-display text-sm">Monthly Pooling</p>
            <p className="text-[11px] text-[#5F6368] leading-relaxed">
              All {circle.memberCount} members' monthly contributions (₹{circle.installmentAmountINR.toLocaleString("en-IN")}) pooled into autonomous smart contract escrow via OMNET mandates.
            </p>
          </div>

          {/* Stage 2: 2nd - 30th of Month */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.05] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                2nd – 30th of Month
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="font-bold text-[#121316] font-display text-sm">Aave DeFi & FX Loans</p>
            <p className="text-[11px] text-[#5F6368] leading-relaxed">
              Pooled funds deployed into Aave DeFi + 150% overcollateralized currency exchange (borrower fails to repay ➔ protocol seizes higher collateral).
            </p>
          </div>

          {/* Stage 3: 31st of Month */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.05] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                31st of Month
              </span>
              <Trophy className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="font-bold text-[#121316] font-display text-sm">Bidding & BIT Cut</p>
            <p className="text-[11px] text-[#5F6368] leading-relaxed">
              Reverse auction settles winner. 5% cut as BIT (Buffer & Insurance Tranche, pooled for interest) + discount shared as dividends to non-winning peers.
            </p>
          </div>

          {/* Stage 4: End of Term */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.05] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#946800] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                End of Term
              </span>
              <Award className="w-3.5 h-3.5 text-[#946800]" />
            </div>
            <p className="font-bold text-[#121316] font-display text-sm">Dividends + BIT + 5–9% P.A.</p>
            <p className="text-[11px] text-[#5F6368] leading-relaxed">
              100% Principal returned + Accumulated BIT reserve + All Dividends + 5–9% P.A. extra gained interest, beating stagnant bank Fixed Deposits!
            </p>
          </div>
        </div>
      </div>

      {/* ── 6. MEMBERS DIRECTORY SECTION ── */}
      <div className="v-card p-5 sm:p-6 border border-black/[0.06] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#121316] font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-[#946800]" />
              Circle Participants ({joinedCount} / {capacity})
            </h3>
            <p className="text-xs text-[#5F6368]">
              Non-custodial participants in this rotating savings cycle.
            </p>
          </div>

          {joinedCount < capacity && (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="text-xs font-semibold text-[#946800] hover:text-[#7A5400] flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite More
            </button>
          )}
        </div>

        {joinedCount === 0 ? (
          <div className="p-8 text-center bg-[#FAF9F5] border border-black/[0.05] rounded-2xl space-y-2">
            <Users className="w-8 h-8 text-[#8F959E] mx-auto opacity-60" />
            <p className="font-semibold text-sm text-[#121316]">No members joined yet</p>
            <p className="text-xs text-[#5F6368] max-w-sm mx-auto">
              This circle is currently waiting for participants. Invite friends or peers to fill the {capacity} spots.
            </p>
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="v-btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 mt-2"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#E9B949]" />
              Invite Participants
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {circle.members.map((member, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-black/[0.05] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#121316] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#121316] truncate">{member.name}</p>
                      <p className="text-[10px] text-[#5F6368] font-mono truncate">{member.address}</p>
                    </div>
                  </div>

                  {member.hasWon ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Won Rd {member.winRound}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/[0.04] text-[#5F6368]">
                      Active
                    </span>
                  )}
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-[#5F6368] border-t border-black/[0.04]">
                  <span>Buffer: <strong className="text-emerald-700">100% Locked</strong></span>
                  <span>Dues: {member.hasPaidContribution ? "Paid ✓" : "Pending"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 7. IMMUTABLE CIRCLE AUDIT TRAIL ── */}
      <div className="v-card p-5 sm:p-6 border border-black/[0.06] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#121316] font-display flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" />
              Circle Audit Ledger & Cryptographic Receipts
            </h3>
            <p className="text-xs text-[#5F6368]">
              Immutable log of smart contract state transitions on MST Blockchain.
            </p>
          </div>

          <span className="text-[11px] font-mono text-[#5F6368]">
            Chain ID: 91562037
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {circle.auditTrail.map((ev) => (
            <div
              key={ev.id}
              className="p-3 rounded-2xl bg-[#FAF9F5] border border-black/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#121316]">{ev.eventName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/[0.04] text-[#5F6368]">
                    Actor: {ev.actor}
                  </span>
                  <span className="text-[10px] text-[#8F959E]">{ev.timestamp}</span>
                </div>
                <p className="text-[11px] text-[#5F6368]">{ev.description}</p>
              </div>

              {ev.txHash ? (
                <a
                  href={`${MST_TESTNET.explorerUrl}/tx/${ev.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-emerald-700 hover:underline inline-flex items-center gap-1 flex-shrink-0"
                >
                  Verify on MSTScan <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span className="text-[10px] font-mono text-[#8F959E] flex-shrink-0">
                  Application State
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 8. INVITE MEMBERS MODAL ── */}
      <InviteMembersModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        circle={circle}
        onSendInvitations={handleSendInvitations}
      />
    </div>
  );
};
