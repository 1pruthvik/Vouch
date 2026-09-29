import React, { useState } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Coins,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Lock,
  HeartHandshake,
  CheckCircle2,
  Zap,
  Code2,
  Plus,
  UserPlus
} from "lucide-react";
import { formatINR, getTrafficLightStatus, getFriendlyMemberName } from "../utils/formatters";
import { GroupDetails, MemberDetails } from "../services/contractService";
import { RiskPredictionResponse } from "../services/aiService";

interface MemberDashboardProps {
  account: string | null;
  groupDetails: GroupDetails | null;
  memberDetails: MemberDetails | null;
  riskAdvisory: RiskPredictionResponse | null;
  isTechnicalMode: boolean;
  onPayInstallment: () => Promise<void>;
  onOpenMandateModal: () => void;
  onOpenDrawTab: () => void;
  onJoinGroup: () => void;
  onCreateGroup?: () => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  account,
  groupDetails,
  memberDetails,
  riskAdvisory,
  isTechnicalMode,
  onPayInstallment,
  onOpenMandateModal,
  onOpenDrawTab,
  onJoinGroup,
  onCreateGroup,
}) => {
  const [isBackupLayersExpanded, setIsBackupLayersExpanded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // If no group is loaded, display welcoming state
  if (!groupDetails) {
    return (
      <div className="content-card text-center py-16 px-6 space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-[#141414] text-royal-400 flex items-center justify-center mx-auto">
          <Coins className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-white font-display">No Active Chit Group Selected</h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {onCreateGroup && (
            <button onClick={onCreateGroup} className="btn-primary">
              <Plus className="w-4 h-4" />
              Create New Group
            </button>
          )}
          <button onClick={onJoinGroup} className="btn-secondary">
            <UserPlus className="w-4 h-4" />
            Join Existing Group
          </button>
        </div>
      </div>
    );
  }

  const groupName = groupDetails.name;
  const currentRound = groupDetails.currentRound || 1;
  const totalRounds = groupDetails.memberCount || 1;
  const rawInstallment = groupDetails.installmentAmount || "0";
  const formattedInstallment = formatINR(rawInstallment);

  const bufferBalance = memberDetails?.bufferBalance || "0";
  const lockedDividends = memberDetails?.lockedDividends || "0";
  const hasPaidCurrentRound = memberDetails?.hasPaidCurrentRound || false;
  const isMember = !!memberDetails;

  // Traffic light status
  const trafficLight = getTrafficLightStatus(memberDetails?.solvency, memberDetails?.isDefaulted);

  // Progress percentage
  const progressPercent = Math.min(100, Math.round((currentRound / totalRounds) * 100));

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
    <div className="space-y-6">
      {/* 1. HERO CARD — Next Payment, Mandate & Month Progress */}
      <div className="content-card relative overflow-hidden space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-md bg-[#141414] text-xs font-semibold text-white">
                {groupName}
              </span>
              <span className={`badge ${trafficLight.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${trafficLight.status === 'green' ? 'bg-green-400' : trafficLight.status === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                {trafficLight.label}
              </span>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-neutral-400 font-medium">Monthly Contribution</p>
              <div className="flex items-baseline gap-3 mt-0.5">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
                  {formattedInstallment}
                </h2>
                <span className="text-xs text-neutral-400 font-mono">
                  ({rawInstallment} tMSTC)
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
              {hasPaidCurrentRound
                ? `You have completed this month's contribution. The draw is currently in progress!`
                : `Monthly contribution due for Round ${currentRound}. Approved mandates execute automatically.`}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {!isMember ? (
              <button
                onClick={onJoinGroup}
                className="btn-primary w-full sm:w-auto"
              >
                Join Group with Deposit
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                {!hasPaidCurrentRound ? (
                  <button
                    onClick={handlePay}
                    disabled={isProcessingPayment}
                    className="btn-primary w-full sm:w-auto"
                  >
                    {isProcessingPayment ? "Processing..." : `Pay ${formattedInstallment}`}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onOpenDrawTab}
                    className="btn-primary w-full sm:w-auto"
                  >
                    View Round Draw
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onOpenMandateModal}
                  className="btn-secondary w-full sm:w-auto"
                >
                  <Zap className="w-4 h-4 text-royal-400" />
                  Auto-Debit Mandate
                </button>
              </>
            )}
          </div>
        </div>

        {/* Month Progress Bar */}
        <div className="pt-4 border-t border-neutral-900 relative z-10">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-white font-display">Round {currentRound} of {totalRounds}</span>
            <span className="text-neutral-400">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black overflow-hidden">
            <div
              className="h-full bg-royal-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. CORE STANDING METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Metric 1: Security Deposit */}
        <div className="content-card p-5 relative">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Your Security Deposit</span>
            <div className="p-2 rounded-md bg-[#141414] text-royal-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white font-display">{formatINR(bufferBalance)}</p>
          <p className="text-xs text-neutral-400 font-medium mt-1">100% Refundable at Cycle End</p>
        </div>

        {/* Metric 2: Accumulated Savings */}
        <div className="content-card p-5 relative">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Accumulated Dividends</span>
            <div className="p-2 rounded-md bg-[#141414] text-royal-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white font-display">{formatINR(lockedDividends)}</p>
          <p className="text-xs text-neutral-400 font-medium mt-1">Earned from Reverse Auction Discounts</p>
        </div>

        {/* Metric 3: Standing Status */}
        <div className="content-card p-5 relative">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Standing Status</span>
            <div className="p-2 rounded-md bg-[#141414] text-royal-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-white font-display flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${trafficLight.status === 'green' ? 'bg-green-400' : 'bg-yellow-400'}`} />
            {trafficLight.label}
          </p>
          <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{trafficLight.description}</p>
        </div>
      </div>

      {/* 3. THE 5-LAYER BACKUP GUARANTEE EXPLAINER */}
      <div className="content-card">
        <div
          onClick={() => setIsBackupLayersExpanded(!isBackupLayersExpanded)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#141414] text-royal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                Protected by 5 layers of on-chain backup
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Every contribution is shielded by autonomous smart contract guarantees. Click to expand.
              </p>
            </div>
          </div>
          <button className="p-2 text-neutral-400 hover:text-white transition-colors">
            {isBackupLayersExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Expanded 5 Layers */}
        {isBackupLayersExpanded && (
          <div className="mt-6 pt-5 border-t border-neutral-900 grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Layer 1 */}
            <div className="p-4 rounded-lg bg-black space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#141414] text-royal-400">
                Layer 1
              </span>
              <h4 className="text-xs font-bold text-white font-display">Buffer Deposit</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                If a member misses an installment, their collateral buffer deposit covers it automatically.
              </p>
            </div>

            {/* Layer 2 */}
            <div className="p-4 rounded-lg bg-black space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#141414] text-royal-400">
                Layer 2
              </span>
              <h4 className="text-xs font-bold text-white font-display">Locked Dividends</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Accrued savings dividends from prior rounds backstop the member's remaining obligation.
              </p>
            </div>

            {/* Layer 3 */}
            <div className="p-4 rounded-lg bg-black space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#141414] text-royal-400">
                Layer 3
              </span>
              <h4 className="text-xs font-bold text-white font-display">Social Voucher</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                The member's staked voucher backer absorbs deficits from their staked collateral.
              </p>
            </div>

            {/* Layer 4 */}
            <div className="p-4 rounded-lg bg-black space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#141414] text-royal-400">
                Layer 4
              </span>
              <h4 className="text-xs font-bold text-white font-display">Reserve Pool</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                The group's protocol reserve fund cushions any remaining shortfall.
              </p>
            </div>

            {/* Layer 5 */}
            <div className="p-4 rounded-lg bg-black space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#141414] text-royal-400">
                Layer 5
              </span>
              <h4 className="text-xs font-bold text-white font-display">Mutual Adjustment</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                A shared adjustment guaranteeing that the monthly pot is always distributed.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. OPT-IN TECHNICAL DETAILS */}
      {isTechnicalMode && (
        <div className="tech-details-box text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="font-bold text-neutral-200 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-royal-400" />
              On-Chain Protocol State & Invariants
            </span>
            <span className="text-[10px] font-mono text-neutral-400">MST Testnet (Chain ID 91562037)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div>
              <p className="text-neutral-500">Contract Address</p>
              <p className="font-mono text-neutral-300 truncate">{groupDetails?.address || "0x..."}</p>
            </div>
            <div>
              <p className="text-neutral-500">Raw Buffer / Dividends</p>
              <p className="font-mono text-neutral-300">{bufferBalance} / {lockedDividends} tMSTC</p>
            </div>
            <div>
              <p className="text-neutral-500">Solvency Invariant</p>
              <p className="font-mono text-neutral-300">
                (Buffer + Divs) ≥ (Rem. × {groupDetails?.safetyFactorBps || 12000} bps)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
