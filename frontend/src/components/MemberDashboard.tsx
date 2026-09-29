import React, { useState } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Coins,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
  Zap,
  Lock,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Code2
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
}) => {
  const [isBackupLayersExpanded, setIsBackupLayersExpanded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Defaults if no group is loaded
  const groupName = groupDetails?.name || "Alpha Savings Circle";
  const currentRound = groupDetails?.currentRound || 1;
  const totalRounds = groupDetails?.memberCount || 5;
  const rawInstallment = groupDetails?.installmentAmount || "0.5";
  const formattedInstallment = formatINR(rawInstallment);

  const bufferBalance = memberDetails?.bufferBalance || "0.5";
  const lockedDividends = memberDetails?.lockedDividends || "0.08";
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
      <div className="cred-hero-card p-6 sm:p-8 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-200">
                {groupName}
              </span>
              <span className={`badge ${trafficLight.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${trafficLight.status === 'green' ? 'bg-emerald-400' : trafficLight.status === 'yellow' ? 'bg-amber-400' : 'bg-red-400'}`} />
                {trafficLight.label}
              </span>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">Next Monthly Contribution</p>
              <div className="flex items-baseline gap-3 mt-0.5">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
                  {formattedInstallment}
                </h2>
                <span className="text-xs sm:text-sm text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Auto-Mandate Ready
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              {hasPaidCurrentRound
                ? `You have completed this month's contribution. The draw is currently in progress!`
                : `Your monthly contribution is due for Month ${currentRound}. Approved mandates execute automatically.`}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {!isMember ? (
              <button
                onClick={onJoinGroup}
                className="btn-cred-primary text-sm w-full sm:w-auto"
              >
                Join Circle with Deposit
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                {!hasPaidCurrentRound ? (
                  <button
                    onClick={handlePay}
                    disabled={isProcessingPayment}
                    className="btn-cred-primary text-sm w-full sm:w-auto"
                  >
                    {isProcessingPayment ? "Processing..." : `Pay ${formattedInstallment}`}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onOpenDrawTab}
                    className="btn-cred-primary text-sm w-full sm:w-auto"
                  >
                    View This Month's Draw
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onOpenMandateModal}
                  className="btn-cred-secondary text-sm w-full sm:w-auto"
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Setup Mandate
                </button>
              </>
            )}
          </div>
        </div>

        {/* Month Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-white font-display">Month {currentRound} of {totalRounds}</span>
            <span className="text-emerald-400">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-900 border border-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out shadow-sm shadow-emerald-500/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. CORE STANDING METRICS (SCREEN 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Security Deposit */}
        <div className="cred-card p-5 border-white/5 relative group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Security Deposit</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white font-display">{formatINR(bufferBalance)}</p>
          <p className="text-xs text-emerald-400/90 font-medium mt-1">100% Refundable at Cycle End</p>
          
          {parseFloat(bufferBalance) <= 0 && (
            <button
              onClick={onJoinGroup}
              className="mt-3 w-full py-1.5 px-3 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30 hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              Complete your deposit to activate
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Metric 2: Your Savings So Far */}
        <div className="cred-card p-5 border-white/5 relative group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Savings So Far</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white font-display">{formatINR(lockedDividends)}</p>
          <p className="text-xs text-purple-400/90 font-medium mt-1">Earned from Draw Discounts</p>
        </div>

        {/* Metric 3: Backer Details */}
        <div className="cred-card p-5 border-white/5 relative group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Backer</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              P
            </div>
            <div>
              <p className="text-sm font-bold text-white font-display">Backed by Priya R.</p>
              <p className="text-[11px] text-slate-400">Active Social Trust Bond</p>
            </div>
          </div>
        </div>

        {/* Metric 4: Traffic Light Standing */}
        <div className="cred-card p-5 border-white/5 relative group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Standing Status</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-white font-display flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${trafficLight.status === 'green' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'}`} />
            {trafficLight.label}
          </p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{trafficLight.description}</p>
        </div>
      </div>

      {/* 3. THE 5-LAYER BACKUP GUARANTEE (PLAIN LANGUAGE EXPLAINER) */}
      <div className="cred-card p-6 border-white/5">
        <div
          onClick={() => setIsBackupLayersExpanded(!isBackupLayersExpanded)}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                Protected by 5 layers of backup — your money never depends on one person.
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every rupee is shielded by autonomous on-chain guarantees. Tap to see how your money is safe.
              </p>
            </div>
          </div>
          <button className="p-2 rounded-lg text-slate-400 group-hover:text-white transition-colors">
            {isBackupLayersExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Expanded 5 Layers */}
        {isBackupLayersExpanded && (
          <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-1 md:grid-cols-5 gap-3 animate-fadeIn">
            {/* Layer 1 */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Layer 1
              </span>
              <h4 className="text-xs font-bold text-white font-display">Their Own Deposit</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                If a member misses a month, their personal security deposit covers it instantly.
              </p>
            </div>

            {/* Layer 2 */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Layer 2
              </span>
              <h4 className="text-xs font-bold text-white font-display">Accumulated Savings</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Past savings and dividends accrued by the member backstop their obligation.
              </p>
            </div>

            {/* Layer 3 */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Layer 3
              </span>
              <h4 className="text-xs font-bold text-white font-display">Trusted Backer</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The member's nominated backer absorbs the deficit from their staked collateral.
              </p>
            </div>

            {/* Layer 4 */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Layer 4
              </span>
              <h4 className="text-xs font-bold text-white font-display">Circle Safety Fund</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The community's reserve pool built from discount slices cushions any remaining shortfall.
              </p>
            </div>

            {/* Layer 5 */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Layer 5
              </span>
              <h4 className="text-xs font-bold text-white font-display">Rare Shared Adjustment</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                An ultra-rare mutual adjustment ensuring the circle pot is 100% paid out every single round.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. OPT-IN TECHNICAL DETAILS (FOR JUDGES & EVALUATORS) */}
      {isTechnicalMode && (
        <div className="tech-details-box text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-indigo-400" />
              On-Chain Protocol State & Invariants
            </span>
            <span className="text-[10px] font-mono text-indigo-300">MST Testnet (Chain ID 91562037)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div>
              <p className="text-slate-400">Contract Address</p>
              <p className="font-mono text-slate-200 truncate">{groupDetails?.address || "0x..."}</p>
            </div>
            <div>
              <p className="text-slate-400">Raw Buffer / Dividends</p>
              <p className="font-mono text-slate-200">{bufferBalance} / {lockedDividends} tMSTC</p>
            </div>
            <div>
              <p className="text-slate-400">Solvency Invariant</p>
              <p className="font-mono text-emerald-400">
                (Buffer + Divs + Vouch) ≥ (Rem. × {groupDetails?.safetyFactorBps || 10000} bps)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
