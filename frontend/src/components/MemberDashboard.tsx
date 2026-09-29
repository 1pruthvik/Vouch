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

  const statusDotColor = trafficLight.status === 'green' ? '#2dd4a8' : trafficLight.status === 'yellow' ? '#f5a623' : '#f43f5e';
  const statusBadgeClass = trafficLight.status === 'green' ? 'v-badge-green' : trafficLight.status === 'yellow' ? 'v-badge-amber' : 'v-badge-rose';

  const backupLayers = [
    { num: 1, title: "Personal Deposit", desc: "If a member misses a month, their security deposit covers it instantly.", color: '#2dd4a8', bg: 'rgba(45, 212, 168, 0.08)' },
    { num: 2, title: "Accrued Savings", desc: "Past savings and dividends backstop any obligation.", color: '#f5a623', bg: 'rgba(245, 166, 35, 0.08)' },
    { num: 3, title: "Trusted Backer", desc: "The member's nominated backer absorbs the deficit from staked collateral.", color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
    { num: 4, title: "Circle Safety Fund", desc: "The community reserve pool cushions any remaining shortfall.", color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.08)' },
    { num: 5, title: "Shared Adjustment", desc: "An ultra-rare mutual adjustment ensuring the pot is 100% paid out every round.", color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.08)' },
  ];

  return (
    <div className="space-y-5 anim-fade-up">
      {/* ── HERO CARD ── */}
      <div className="v-card-hero p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 flex-1">
            {/* Status pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium px-3 py-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3b4' }}>
                {groupName}
              </span>
              <span className={`v-badge ${statusBadgeClass}`}>
                <span className="w-2 h-2 rounded-full" style={{ background: statusDotColor }} />
                {trafficLight.label}
              </span>
            </div>

            {/* Amount */}
            <div>
              <p className="text-sm text-[#9ca3b4] font-medium">Next Monthly Contribution</p>
              <div className="flex items-baseline gap-3 mt-1">
                <h2 className="text-4xl sm:text-5xl font-bold text-white font-display tracking-tight">
                  {formattedInstallment}
                </h2>
                <span className="v-badge v-badge-green text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Auto-Mandate Ready
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-[#9ca3b4] max-w-lg leading-relaxed">
              {hasPaidCurrentRound
                ? `This month's contribution is complete! The draw is in progress.`
                : `Due for Month ${currentRound}. Approved mandates execute automatically.`}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:flex-shrink-0">
            {!isMember ? (
              <button onClick={onJoinGroup} className="v-btn-primary">
                Join Circle with Deposit
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                {!hasPaidCurrentRound ? (
                  <button
                    onClick={handlePay}
                    disabled={isProcessingPayment}
                    className="v-btn-primary"
                  >
                    {isProcessingPayment ? "Processing..." : `Pay ${formattedInstallment}`}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={onOpenDrawTab} className="v-btn-primary">
                    View This Month's Draw
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
                <button onClick={onOpenMandateModal} className="v-btn-secondary">
                  <Zap className="w-4 h-4 text-[#2dd4a8]" />
                  Auto-Debit
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-8 pt-6 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between text-sm font-medium mb-3">
            <span className="text-white font-display">Month {currentRound} of {totalRounds}</span>
            <span className="text-[#2dd4a8] font-semibold">{progressPercent}%</span>
          </div>
          <div className="v-progress-track">
            <div className="v-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {/* Security Deposit */}
        <div className="v-metric">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#9ca3b4] uppercase tracking-wider">Security Deposit</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(45, 212, 168, 0.1)' }}>
              <Lock className="w-4 h-4 text-[#2dd4a8]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white font-display">{formatINR(bufferBalance)}</p>
          <p className="text-xs text-[#2dd4a8] font-medium mt-1.5">100% Refundable at Cycle End</p>

          {parseFloat(bufferBalance) <= 0 && (
            <button
              onClick={onJoinGroup}
              className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200"
              style={{ background: 'rgba(45, 212, 168, 0.1)', border: '1px solid rgba(45, 212, 168, 0.2)', color: '#2dd4a8' }}
            >
              Complete deposit to activate
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Savings So Far */}
        <div className="v-metric">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#9ca3b4] uppercase tracking-wider">Savings So Far</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245, 166, 35, 0.1)' }}>
              <TrendingUp className="w-4 h-4 text-[#f5a623]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white font-display">{formatINR(lockedDividends)}</p>
          <p className="text-xs font-medium mt-1.5" style={{ color: '#f5a623' }}>Earned from Draw Discounts</p>
        </div>

        {/* Backer */}
        <div className="v-metric">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#9ca3b4] uppercase tracking-wider">Your Backer</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <HeartHandshake className="w-4 h-4 text-[#8b5cf6]" />
            </div>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
              P
            </div>
            <div>
              <p className="text-sm font-bold text-white font-display">Priya R.</p>
              <p className="text-[11px] text-[#9ca3b4]">Active Trust Bond</p>
            </div>
          </div>
        </div>

        {/* Standing */}
        <div className="v-metric">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#9ca3b4] uppercase tracking-wider">Standing</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: trafficLight.status === 'green' ? 'rgba(45, 212, 168, 0.1)' : 'rgba(245, 166, 35, 0.1)' }}>
              <ShieldCheck className="w-4 h-4" style={{ color: statusDotColor }} />
            </div>
          </div>
          <p className="text-lg font-bold text-white font-display flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full" style={{ background: statusDotColor, boxShadow: `0 0 8px ${statusDotColor}40` }} />
            {trafficLight.label}
          </p>
          <p className="text-xs text-[#9ca3b4] mt-1 truncate-2">{trafficLight.description}</p>
        </div>
      </div>

      {/* ── 5-LAYER BACKUP GUARANTEE ── */}
      <div className="v-card p-5 sm:p-6">
        <div
          onClick={() => setIsBackupLayersExpanded(!isBackupLayersExpanded)}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 anim-float" style={{ background: 'rgba(45, 212, 168, 0.1)', border: '1px solid rgba(45, 212, 168, 0.15)' }}>
              <ShieldCheck className="w-5 h-5 text-[#2dd4a8] stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                Protected by 5 layers of backup
              </h3>
              <p className="text-xs text-[#9ca3b4] mt-0.5">
                Your money never depends on one person. Tap to learn how.
              </p>
            </div>
          </div>
          <button className="p-2 rounded-xl text-[#5f6578] group-hover:text-white transition-colors duration-200" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {isBackupLayersExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Expanded Layers */}
        {isBackupLayersExpanded && (
          <div className="mt-5 pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 stagger-children" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {backupLayers.map((layer) => (
              <div key={layer.num} className="p-4 rounded-2xl space-y-2" style={{ background: layer.bg, border: `1px solid ${layer.color}15` }}>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block" style={{ background: `${layer.color}18`, color: layer.color, border: `1px solid ${layer.color}30` }}>
                  Layer {layer.num}
                </span>
                <h4 className="text-xs font-bold text-white font-display">{layer.title}</h4>
                <p className="text-[11px] leading-relaxed" style={{ color: '#9ca3b4' }}>
                  {layer.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── TECHNICAL DETAILS ── */}
      {isTechnicalMode && (
        <div className="v-tech-box text-xs space-y-3 anim-fade-up">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.15)' }}>
            <span className="font-bold text-[#8b5cf6] flex items-center gap-1.5">
              <Code2 className="w-4 h-4" />
              On-Chain Protocol State & Invariants
            </span>
            <span className="text-[10px] font-mono text-[#8b5cf6]/80">MST Testnet (Chain ID 91562037)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div>
              <p className="text-[#5f6578]">Contract Address</p>
              <p className="font-mono text-[#9ca3b4] truncate">{groupDetails?.address || "0x..."}</p>
            </div>
            <div>
              <p className="text-[#5f6578]">Raw Buffer / Dividends</p>
              <p className="font-mono text-[#9ca3b4]">{bufferBalance} / {lockedDividends} tMSTC</p>
            </div>
            <div>
              <p className="text-[#5f6578]">Solvency Invariant</p>
              <p className="font-mono text-[#2dd4a8]">
                (Buffer + Divs + Vouch) ≥ (Rem. × {groupDetails?.safetyFactorBps || 10000} bps)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
