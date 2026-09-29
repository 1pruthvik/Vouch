import React, { useState } from "react";
import {
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Award,
  Zap,
  Shield,
  Layers,
  Info
} from "lucide-react";
import { formatRawINR } from "../utils/formatters";
import { MemberDetails, GroupDetails } from "../services/contractService";
import { RiskPredictionResponse } from "../services/aiService";

interface StandingViewProps {
  account: string | null;
  memberDetails: MemberDetails | null;
  groupDetails: GroupDetails | null;
  riskAdvisory: RiskPredictionResponse | null;
  isTechnicalMode: boolean;
}

export const StandingView: React.FC<StandingViewProps> = ({
  account,
  memberDetails,
  groupDetails,
  riskAdvisory,
  isTechnicalMode,
}) => {
  const [isBackupExpanded, setIsBackupExpanded] = useState(false);

  // Guarantee Exposure Bounded Model (per product definition)
  const maxGuaranteeExposure = 50000;
  const currentExposure = 25000;
  const availableCapacity = maxGuaranteeExposure - currentExposure;
  const capacityPercent = Math.round((currentExposure / maxGuaranteeExposure) * 100);

  const standingScore = 98;
  const onTimePayments = 5;
  const totalRoundsSoFar = 5;
  const securityReserveINR = 50000;

  const backupLayers = [
    { num: 1, title: "Personal Security Deposit", desc: "If a member misses a contribution, their security deposit covers it instantly.", color: '#2dd4a8', bg: 'rgba(45, 212, 168, 0.08)' },
    { num: 2, title: "Accrued Savings & Dividends", desc: "Past savings dividends backstop any pending monthly dues.", color: '#f5a623', bg: 'rgba(245, 166, 35, 0.08)' },
    { num: 3, title: "Trusted Community Backer", desc: "The member's nominated voucher absorbs the deficit from bounded staked collateral.", color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
    { num: 4, title: "Circle Safety Reserve Fund", desc: "The community reserve pool cushions any remaining shortfall.", color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.08)' },
    { num: 5, title: "Shared Mutual Adjustment", desc: "An ultra-rare mutual adjustment ensuring the pot is 100% paid out every single round.", color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.08)' },
  ];

  return (
    <div className="space-y-6 anim-fade-up">
      {/* ── STANDING HERO ── */}
      <div className="v-card-hero p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="v-badge v-badge-green text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                Tier 1 Prime Member
              </span>
              <span className="v-badge v-badge-amber text-xs">
                {onTimePayments}/{totalRoundsSoFar} On-Time Contributions
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-display tracking-tight">
              Community Trust Profile
            </h1>
            <p className="text-xs sm:text-sm text-[#9ca3b4] max-w-xl leading-relaxed">
              Your standing reflects protocol participation consistency, security reserve funding, and bounded guarantee capacity.
              It is not a personal credit score, but a smart contract participation indicator.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center min-w-[200px]">
            <p className="text-xs text-[#9ca3b4] font-medium">Standing Score</p>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className="text-4xl sm:text-5xl font-bold text-[#2dd4a8] font-display">{standingScore}</span>
              <span className="text-sm text-[#5f6578]">/ 100</span>
            </div>
            <span className="v-badge v-badge-green text-[10px] mt-2 inline-flex">
              All Commitments Met
            </span>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="mt-6 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/[0.06] text-xs">
          <div>
            <p className="text-[#5f6578]">Contribution Consistency</p>
            <p className="text-sm font-bold text-white font-display mt-0.5">100% (5/5 Rounds)</p>
          </div>
          <div>
            <p className="text-[#5f6578]">Security Reserve</p>
            <p className="text-sm font-bold text-[#2dd4a8] font-display mt-0.5">{formatRawINR(securityReserveINR)} Funded</p>
          </div>
          <div>
            <p className="text-[#5f6578]">AutoPay Status</p>
            <p className="text-sm font-bold text-white font-display mt-0.5">Active e-Mandate</p>
          </div>
          <div>
            <p className="text-[#5f6578]">Draw Eligibility</p>
            <p className="text-sm font-bold text-[#2dd4a8] font-display mt-0.5">Eligible for Bidding</p>
          </div>
        </div>
      </div>

      {/* ── BOUNDED VOUCH GUARANTEE CAPACITY CARD ── */}
      <div className="v-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-[#8b5cf6] flex items-center justify-center flex-shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Bounded Vouch & Guarantee Exposure
              </h3>
              <p className="text-xs text-[#9ca3b4] mt-0.5">
                Vouching creates a bounded guarantee relationship. Unlimited exposure is mathematically prohibited.
              </p>
            </div>
          </div>

          <span className="v-badge v-badge-blue text-xs self-start sm:self-center">
            Cap: {formatRawINR(maxGuaranteeExposure)}
          </span>
        </div>

        {/* 3 Metric Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-[#5f6578]">Maximum Guarantee Exposure</p>
            <p className="text-2xl font-bold text-white font-display mt-1">
              {formatRawINR(maxGuaranteeExposure)}
            </p>
            <p className="text-[11px] text-[#9ca3b4] mt-1">Maximum risk limit established</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-[#5f6578]">Current Active Exposure</p>
            <p className="text-2xl font-bold text-[#f5a623] font-display mt-1">
              {formatRawINR(currentExposure)}
            </p>
            <p className="text-[11px] text-[#9ca3b4] mt-1">Vouching for 1 verified peer</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-[#5f6578]">Available Capacity</p>
            <p className="text-2xl font-bold text-[#2dd4a8] font-display mt-1">
              {formatRawINR(availableCapacity)}
            </p>
            <p className="text-[11px] text-[#2dd4a8] mt-1">Ready for new vouch requests</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs text-[#9ca3b4]">
            <span>Capacity Utilized: {capacityPercent}%</span>
            <span>{formatRawINR(currentExposure)} used of {formatRawINR(maxGuaranteeExposure)}</span>
          </div>
          <div className="v-progress-track">
            <div className="v-progress-fill" style={{ width: `${capacityPercent}%`, background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)' }} />
          </div>
        </div>

        {/* Plain language explanation */}
        <div className="p-4 rounded-xl bg-violet-500/[0.04] border border-violet-500/15 text-xs text-[#9ca3b4] space-y-1 leading-relaxed">
          <p className="font-semibold text-white">How Bounded Vouching Protects You:</p>
          <p>
            When you vouch for a community peer, your maximum potential guarantee is strictly capped at {formatRawINR(maxGuaranteeExposure)}.
            You cannot be held liable beyond this limit under any circumstance.
          </p>
        </div>
      </div>

      {/* ── 5-LAYER BACKUP GUARANTEE ── */}
      <div className="v-card p-5 sm:p-6">
        <div
          onClick={() => setIsBackupExpanded(!isBackupExpanded)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#2dd4a8]/10 text-[#2dd4a8] border border-[#2dd4a8]/20">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                Protected by 5 Layers of Default Defense
              </h3>
              <p className="text-xs text-[#9ca3b4] mt-0.5">
                Your savings never depend on any single individual. Tap to see the waterfall resolution hierarchy.
              </p>
            </div>
          </div>
          <button className="p-2 rounded-xl text-[#5f6578] bg-white/[0.04] transition-colors">
            {isBackupExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isBackupExpanded && (
          <div className="mt-5 pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 border-t border-white/[0.06]">
            {backupLayers.map((layer) => (
              <div key={layer.num} className="p-4 rounded-2xl space-y-2" style={{ background: layer.bg, border: `1px solid ${layer.color}15` }}>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block" style={{ background: `${layer.color}18`, color: layer.color, border: `1px solid ${layer.color}30` }}>
                  Layer {layer.num}
                </span>
                <h4 className="text-xs font-bold text-white font-display">{layer.title}</h4>
                <p className="text-[11px] leading-relaxed text-[#9ca3b4]">
                  {layer.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
