import React, { useState } from "react";
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ExternalLink,
  Users,
  ChevronRight,
  Info,
  Clock,
  Coins
} from "lucide-react";
import { formatRawINR, formatINR, MST_TO_INR_RATE } from "../utils/formatters";
import { GroupDetails, MemberDetails } from "../services/contractService";
import { RiskPredictionResponse } from "../services/aiService";

interface HomeViewProps {
  account: string | null;
  groupDetails: GroupDetails | null;
  memberDetails: MemberDetails | null;
  riskAdvisory: RiskPredictionResponse | null;
  isMandateActive: boolean;
  isTechnicalMode: boolean;
  onPayInstallment: () => Promise<void>;
  onOpenMandateModal: () => void;
  onOpenDrawTab: () => void;
  onOpenPoolTab: () => void;
  onOpenTreasuryTab: () => void;
  onOpenActivityTab: () => void;
  onJoinGroup: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  account,
  groupDetails,
  memberDetails,
  riskAdvisory,
  isMandateActive,
  isTechnicalMode,
  onPayInstallment,
  onOpenMandateModal,
  onOpenDrawTab,
  onOpenPoolTab,
  onOpenTreasuryTab,
  onOpenActivityTab,
  onJoinGroup,
}) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Group financial parameters (defaults to realistic Community 07 demo)
  const groupName = groupDetails?.name || "Community 07";
  const monthlyContributionINR = groupDetails
    ? Math.round(parseFloat(groupDetails.installmentAmount) * MST_TO_INR_RATE)
    : 25000;
  const memberCount = groupDetails?.memberCount || 20;
  const totalPoolINR = monthlyContributionINR * memberCount;
  const currentRound = groupDetails?.currentRound || 5;
  const totalRounds = memberCount;
  const progressPercent = Math.min(100, Math.round((currentRound / totalRounds) * 100));

  const securityReserveINR = 50000;
  const isMember = memberDetails?.isMember ?? true;
  const hasPaidCurrentRound = memberDetails?.hasPaidCurrentRound ?? false;
  const nextDebitDate = "5 October, 2026";
  const nextDrawDate = "10 October, 2026";

  const handlePay = async () => {
    try {
      setIsProcessingPayment(true);
      await onPayInstallment();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6 anim-fade-up">
      {/* ── TOP GREETING & STANDING ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9ca3b4]">
              {groupName} · Member Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
            Good morning{account ? `, Member` : ""} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#9ca3b4] mt-0.5">
            Your monthly contribution and standing instruction overview.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="v-badge v-badge-green py-1.5 px-3">
            <ShieldCheck className="w-4 h-4 text-[#2dd4a8]" />
            <span className="font-semibold">Good Standing · All Dues Clear</span>
          </div>
        </div>
      </div>

      {/* ── PRIMARY FINANCIAL HERO CARD ── */}
      <div className="v-card-hero p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="v-badge v-badge-amber text-[11px]">
                <Calendar className="w-3.5 h-3.5" />
                Next Due: {nextDebitDate}
              </span>
              <span className="v-badge v-badge-green text-[11px]">
                {isMandateActive ? "Mandate Active ✓" : "Manual Payment Ready"}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9ca3b4]">
                Monthly Contribution
              </p>
              <div className="flex items-baseline gap-3 mt-1">
                <h2 className="text-4xl sm:text-5xl font-bold text-white font-display tracking-tight">
                  {formatRawINR(monthlyContributionINR)}
                </h2>
                <span className="text-xs text-[#5f6578]">/ member per round</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#9ca3b4] max-w-lg leading-relaxed">
              {hasPaidCurrentRound
                ? `Your Month ${currentRound} contribution is complete. The community pool is funded and ready for draw settlement.`
                : isMandateActive
                ? `Your UPI AutoPay mandate is active. ${formatRawINR(monthlyContributionINR)} will auto-debit on ${nextDebitDate}.`
                : `Due on ${nextDebitDate}. Pay manually below or enable 1-click UPI AutoPay to protect your standing score.`}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:flex-shrink-0">
            {!hasPaidCurrentRound ? (
              <button
                onClick={handlePay}
                disabled={isProcessingPayment}
                className="v-btn-primary"
              >
                {isProcessingPayment ? "Processing..." : `Pay ${formatRawINR(monthlyContributionINR)}`}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={onOpenDrawTab} className="v-btn-primary">
                View Month {currentRound} Draw
                <Sparkles className="w-4 h-4" />
              </button>
            )}

            <button onClick={onOpenMandateModal} className="v-btn-secondary">
              <Zap className="w-4 h-4 text-[#2dd4a8]" />
              {isMandateActive ? "Manage AutoPay" : "Enable AutoPay"}
            </button>
          </div>
        </div>

        {/* Pool Cycle Progress Track */}
        <div className="mt-8 pt-6 relative z-10 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-3">
            <span className="text-white font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2dd4a8]" />
              Pool Progress: Month {currentRound} of {totalRounds}
            </span>
            <span className="text-[#2dd4a8] font-bold">{progressPercent}% Completed</span>
          </div>
          <div className="v-progress-track">
            <div className="v-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* ── 3-COLUMN ESSENTIAL SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Pool Value */}
        <div onClick={onOpenPoolTab} className="v-card p-5 cursor-pointer hover:border-[#2dd4a8]/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#9ca3b4] uppercase tracking-wider">Total Pool Value</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#2dd4a8]/10 text-[#2dd4a8]">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white font-display">
            {formatRawINR(totalPoolINR)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#9ca3b4]">
            <span>{memberCount} Verified Members</span>
            <span className="text-[#2dd4a8] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
              View Pool <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Security Reserve */}
        <div className="v-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#9ca3b4] uppercase tracking-wider">Security Reserve</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/10 text-[#f5a623]">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white font-display">
            {formatRawINR(securityReserveINR)}
          </p>
          <div className="mt-2 text-xs text-[#9ca3b4]">
            <span className="text-[#2dd4a8] font-medium">Default Protection Layer</span> · 100% Refundable
          </div>
        </div>

        {/* Next Draw Date */}
        <div onClick={onOpenDrawTab} className="v-card p-5 cursor-pointer hover:border-[#8b5cf6]/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#9ca3b4] uppercase tracking-wider">Next Monthly Draw</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-500/10 text-[#8b5cf6]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white font-display">
            {nextDrawDate}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#9ca3b4]">
            <span>Confidential Reverse Auction</span>
            <span className="text-[#8b5cf6] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
              Enter Draw <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* ── UPI AUTOPAY & RECENT ACTIVITY SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Mandate & Yield Card */}
        <div className="lg:col-span-2 space-y-4">
          {/* UPI Mandate Banner */}
          <div className="v-card p-5 sm:p-6 border border-[#2dd4a8]/20 bg-gradient-to-r from-[#2dd4a8]/[0.05] to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: isMandateActive ? 'rgba(45, 212, 168, 0.15)' : 'rgba(245, 166, 35, 0.15)' }}>
                  <Zap className={`w-6 h-6 ${isMandateActive ? 'text-[#2dd4a8]' : 'text-[#f5a623]'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white font-display">
                      UPI AutoPay Mandate
                    </h3>
                    <span className={`v-badge ${isMandateActive ? 'v-badge-green' : 'v-badge-amber'}`}>
                      {isMandateActive ? "Active ✓" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-[#9ca3b4] mt-0.5">
                    {isMandateActive
                      ? `Approved standing instruction: ${formatRawINR(monthlyContributionINR)} automatically debits on the 1st of every round.`
                      : `Set up a recurring e-mandate to avoid manual reminders and protect your standing score.`}
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenMandateModal}
                className="v-btn-secondary text-xs flex-shrink-0 self-start sm:self-center"
              >
                {isMandateActive ? "Manage AutoPay" : "Enable AutoPay"}
              </button>
            </div>
          </div>

          {/* Treasury Snapshot Banner */}
          <div
            onClick={onOpenTreasuryTab}
            className="v-card p-5 flex items-center justify-between cursor-pointer hover:border-[#38bdf8]/30 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-[#38bdf8] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  Pool Treasury & Capital Management
                  <span className="v-badge v-badge-green text-[10px]">Within Policy ✓</span>
                </h4>
                <p className="text-xs text-[#9ca3b4] mt-0.5">
                  ₹3,60,000 idle funds generating simulated yield · ₹90,000 liquid reserve maintained
                </p>
              </div>
            </div>
            <div className="text-right text-[#38bdf8] text-xs font-semibold flex items-center gap-1">
              View Treasury <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Right: Recent Activity Snapshot */}
        <div className="v-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-bold text-white font-display">Recent Activity</h3>
            <button
              onClick={onOpenActivityTab}
              className="text-xs text-[#2dd4a8] hover:underline font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#2dd4a8]/10 text-[#2dd4a8] flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-white">Month 4 Contribution</p>
                  <p className="text-[10px] text-[#5f6578]">5 Sep, 2026 · Mandate</p>
                </div>
              </div>
              <p className="font-bold text-white font-display">₹25,000</p>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-[#8b5cf6] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-white">Draw Settlement Dividend</p>
                  <p className="text-[10px] text-[#5f6578]">10 Sep, 2026 · Round 4</p>
                </div>
              </div>
              <p className="font-bold text-[#2dd4a8] font-display">+₹1,200</p>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5a623] flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-white">Security Reserve Staked</p>
                  <p className="text-[10px] text-[#5f6578]">Term Initiation</p>
                </div>
              </div>
              <p className="font-bold text-white font-display">₹50,000</p>
            </div>
          </div>

          {/* Subtle Blockchain Verification link */}
          <div className="pt-2 border-t border-white/[0.06] text-center">
            <button
              onClick={() => setShowVerificationModal(true)}
              className="text-[11px] text-[#5f6578] hover:text-[#2dd4a8] transition-colors inline-flex items-center gap-1 font-mono"
            >
              <span>⛓️ Smart Contract State Verified</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── SUBTLE BLOCKCHAIN VERIFICATION POPUP ── */}
      {showVerificationModal && (
        <div className="v-overlay" onClick={() => setShowVerificationModal(false)}>
          <div className="v-modal p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2dd4a8]" />
                <h3 className="text-base font-bold text-white font-display">Blockchain Verification</h3>
              </div>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-[#5f6578] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-[#9ca3b4]">
                All pool actions, contributions, and draw payouts are immutably logged on the MST Testnet smart contracts.
              </p>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 font-mono text-[11px]">
                <div>
                  <p className="text-[#5f6578]">Pool Contract Address</p>
                  <p className="text-white truncate">{groupDetails?.address || "0xAf378D33B037A6668fOd128c4BBA28bb65974D9b"}</p>
                </div>
                <div>
                  <p className="text-[#5f6578]">Network & Chain ID</p>
                  <p className="text-[#2dd4a8]">MST Testnet (91562037)</p>
                </div>
                <div>
                  <p className="text-[#5f6578]">Deterministic Invariant</p>
                  <p className="text-[#9ca3b4]">Solvency backed by 5-layer waterfall guarantee.</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/[0.06] flex justify-end">
              <button
                onClick={() => setShowVerificationModal(false)}
                className="v-btn-primary text-xs"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
