import React, { useState, useEffect, useRef } from "react";
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
  AlertTriangle,
  CreditCard,
  Code2,
  Clock,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Compass,
  Users,
  Plus,
  UserPlus,
  Zap,
  HelpCircle,
  Activity,
} from "lucide-react";
import gsap from "gsap";
import { formatINR, formatRawINR, getTrafficLightStatus, MST_TO_INR_RATE } from "../utils/formatters";
import { GroupDetails, MemberDetails } from "../services/contractService";
import { RiskPredictionResponse } from "../services/aiService";
import { AnimatedNumber } from "./AnimatedNumber";

export interface AvailableCircle {
  address: string;
  name: string;
  memberCount: number;
  installmentAmount: string;
}

interface MemberDashboardProps {
  account: string | null;
  groupDetails: GroupDetails | null;
  memberDetails: MemberDetails | null;
  riskAdvisory: RiskPredictionResponse | null;
  isTechnicalMode: boolean;
  isMandateActive?: boolean;
  availableGroups?: AvailableCircle[];
  onSelectGroup?: (address: string) => void;
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
  isMandateActive = false,
  availableGroups = [],
  onSelectGroup,
  onPayInstallment,
  onOpenMandateModal,
  onOpenDrawTab,
  onJoinGroup,
  onCreateGroup,
}) => {
  const [isBackupLayersExpanded, setIsBackupLayersExpanded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currencyUnit, setCurrencyUnit] = useState<"INR" | "MST">("INR");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const statsGridRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Entrance animations
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
        );
      }
      if (statsGridRef.current) {
        gsap.fromTo(
          statsGridRef.current.children,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out", delay: 0.1 }
        );
      }
    });

    return () => ctx.revert();
  }, [groupDetails?.address]);

  // Default featured circles if no groups list
  const featuredCircles: AvailableCircle[] = availableGroups.length > 0 ? availableGroups : [
    {
      address: "0xAf378D33B037A6668fOd128c4BBA28bb65974D9b",
      name: "Alpha Savings Circle",
      memberCount: 5,
      installmentAmount: "5.0",
    },
    {
      address: "0xb794f5ea0ba39494ce839613fffba74279579268",
      name: "Bangalore Techies Chit",
      memberCount: 4,
      installmentAmount: "10.0",
    },
    {
      address: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
      name: "Family Emergency Pool",
      memberCount: 5,
      installmentAmount: "2.0",
    },
  ];

  // 1. If no group is selected, display rich, interactive Circle Discovery Directory
  if (!groupDetails) {
    return (
      <div className="space-y-6">
        {/* Welcome Hero */}
        <div className="fintech-hero-card p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="badge-status-green inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
                <Compass className="w-3.5 h-3.5" />
                Community Chit Funds
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
                Choose a Savings Circle
              </h2>
              <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
                Join an active rotating savings pool or launch your own private circle with friends, family, or colleagues on MST Blockchain.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {onCreateGroup && (
                <button onClick={onCreateGroup} className="btn-fintech-primary text-xs">
                  <Plus className="w-4 h-4" />
                  Launch New Circle
                </button>
              )}
              <button onClick={onJoinGroup} className="btn-fintech-secondary text-xs">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Join via Contract Address
              </button>
            </div>
          </div>
        </div>

        {/* Featured Circles Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-300 font-display flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Available Savings Circles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredCircles.map((circle) => (
              <div
                key={circle.address}
                onClick={() => onSelectGroup && onSelectGroup(circle.address)}
                className="fintech-card p-5 cursor-pointer hover:border-emerald-500/40 hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors font-display">
                      {circle.name}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      {circle.address.substring(0, 8)}...{circle.address.substring(circle.address.length - 6)}
                    </p>
                  </div>
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Installment</span>
                    <p className="font-bold text-white tabular-nums">{formatINR(circle.installmentAmount)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Members</span>
                    <p className="font-bold text-white">{circle.memberCount} Participants</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active Circle Variables
  const groupName = groupDetails.name || "Alpha Savings Circle";
  const currentRound = groupDetails.currentRound || 1;
  const totalRounds = groupDetails.memberCount || 5;
  const rawInstallment = groupDetails.installmentAmount || "0.5";
  const installmentFloat = parseFloat(rawInstallment) || 0;
  const installmentINR = Math.round(installmentFloat * MST_TO_INR_RATE);

  const bufferBalance = memberDetails?.bufferBalance || "0.5";
  const bufferINR = Math.round((parseFloat(bufferBalance) || 0) * MST_TO_INR_RATE);

  const lockedDividends = memberDetails?.lockedDividends || "0.08";
  const dividendsINR = Math.round((parseFloat(lockedDividends) || 0) * MST_TO_INR_RATE);

  const potFloat = parseFloat(groupDetails.currentPot || "2.5") || 0;
  const potINR = Math.round(potFloat * MST_TO_INR_RATE);

  const hasPaidCurrentRound = memberDetails?.hasPaidCurrentRound || false;
  const isMember = memberDetails?.isMember ?? false;

  const trafficLight = getTrafficLightStatus(memberDetails?.solvency, memberDetails?.isDefaulted);
  const progressPercent = Math.min(100, Math.round((currentRound / totalRounds) * 100));

  // Animate progress bar fill on change
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !progressBarRef.current) return;

    gsap.fromTo(
      progressBarRef.current,
      { width: "0%" },
      { width: `${progressPercent}%`, duration: 0.9, ease: "power2.out" }
    );
  }, [progressPercent]);

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
      {/* 1. PRIMARY HERO CARD */}
      <div ref={heroRef} className="fintech-hero-card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/[0.07] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-slate-200">
                {groupName}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${trafficLight.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${trafficLight.status === "green" ? "bg-emerald-400" : trafficLight.status === "yellow" ? "bg-amber-400" : "bg-red-400"}`} />
                {trafficLight.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-white/5 text-[11px] font-medium text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Month {currentRound} of {totalRounds}
              </span>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">Next Monthly Contribution</p>
              <div className="flex items-baseline gap-3 mt-1">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight tabular-nums">
                  {currencyUnit === "INR" ? (
                    <AnimatedNumber value={installmentINR} formatAsINR />
                  ) : (
                    `${parseFloat(rawInstallment).toFixed(2)} tMSTC`
                  )}
                </p>
                <button
                  onClick={() => setCurrencyUnit(currencyUnit === "INR" ? "MST" : "INR")}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 font-medium px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-all"
                  title="Toggle display currency"
                >
                  {currencyUnit === "INR" ? "⇄ Show in tMSTC" : "⇄ Show in ₹ INR"}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Due in {groupDetails.cycleDuration ? `${Math.round(groupDetails.cycleDuration / 60)} mins (Demo Timer)` : "4 days"}
              </p>
            </div>
          </div>

          {/* Action Center on Hero */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px]">
            {isMember ? (
              <>
                <button
                  onClick={handlePay}
                  disabled={hasPaidCurrentRound || isProcessingPayment}
                  className="btn-fintech-primary w-full py-3.5 text-sm"
                >
                  {isProcessingPayment ? (
                    <>
                      <Zap className="w-4 h-4 animate-spin" />
                      Submitting on Blockchain...
                    </>
                  ) : hasPaidCurrentRound ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      Month {currentRound} Paid
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Pay {formatINR(rawInstallment)} →
                    </>
                  )}
                </button>

                <button
                  onClick={onOpenMandateModal}
                  className="btn-fintech-secondary w-full py-2.5 text-xs text-slate-300"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  {isMandateActive ? "Auto-Pay Mandate Active ✓" : "Setup Auto-Pay Mandate"}
                </button>
              </>
            ) : (
              <button
                onClick={onJoinGroup}
                className="btn-fintech-primary w-full py-3.5 text-sm"
              >
                Join Savings Circle →
              </button>
            )}
          </div>
        </div>

        {/* Cycle Progress Bar */}
        <div className="mt-7 pt-6 border-t border-white/[0.07]">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Circle Savings Progress
            </span>
            <span className="text-emerald-400 tabular-nums font-mono">{progressPercent}% Completed</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-900 border border-white/5 overflow-hidden p-0.5">
            <div
              ref={progressBarRef}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
            <span>Month 1 (Formed)</span>
            <span className="font-medium text-slate-300">Active: Month {currentRound}</span>
            <span>Month {totalRounds} (Settlement)</span>
          </div>
        </div>
      </div>

      {/* 2. SECONDARY METRICS GRID */}
      <div ref={statsGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fintech-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Community Pot</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white font-display tabular-nums tracking-tight">
            <AnimatedNumber value={potINR} formatAsINR />
          </p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">Available for draw</span> this round
          </p>
        </div>

        <div className="fintech-card p-5 space-y-2 relative">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold flex items-center gap-1">
              Your Security Deposit
              <button
                onClick={() => setActiveTooltip(activeTooltip === "buffer" ? null : "buffer")}
                className="text-slate-500 hover:text-slate-300"
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white font-display tabular-nums tracking-tight">
            <AnimatedNumber value={bufferINR} formatAsINR />
          </p>
          <p className="text-[11px] text-slate-400">
            <span className="text-indigo-400 font-medium">100% refundable</span> at final month
          </p>
          {activeTooltip === "buffer" && (
            <div className="absolute left-4 right-4 top-12 p-3 rounded-xl bg-slate-900 border border-white/10 text-[11px] text-slate-300 shadow-xl z-20 anim-fade-in">
              Security buffer deposited into the smart contract upon joining. It guarantees circle solvency and is fully refunded at completion.
            </div>
          )}
        </div>

        <div className="fintech-card p-5 space-y-2 relative">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold flex items-center gap-1">
              Earned Dividends
              <button
                onClick={() => setActiveTooltip(activeTooltip === "dividends" ? null : "dividends")}
                className="text-slate-500 hover:text-slate-300"
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400 font-display tabular-nums tracking-tight">
            +<AnimatedNumber value={dividendsINR} formatAsINR />
          </p>
          <p className="text-[11px] text-slate-400">
            Automated discount yield rolled forward
          </p>
          {activeTooltip === "dividends" && (
            <div className="absolute left-4 right-4 top-12 p-3 rounded-xl bg-slate-900 border border-white/10 text-[11px] text-slate-300 shadow-xl z-20 anim-fade-in">
              Accumulated interest savings from peers who took early pot payouts at a discount. Credited back directly to your balance.
            </div>
          )}
        </div>

        <div className="fintech-card p-5 space-y-2 cursor-pointer hover:border-emerald-500/30 transition-all" onClick={onOpenDrawTab}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Need Early Funds?</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-bold text-emerald-400 font-display flex items-center gap-1.5 mt-1">
            Request Draw Payout <ArrowRight className="w-4 h-4" />
          </p>
          <p className="text-[11px] text-slate-400">
            Participate in this month's reverse auction
          </p>
        </div>
      </div>

      {/* 3. 5-LAYER WATERFALL DISCLOSURE */}
      <div className="fintech-card p-6 border-white/5 space-y-4">
        <button
          onClick={() => setIsBackupLayersExpanded(!isBackupLayersExpanded)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                Why Your Community Savings Are Safe
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  5-Layer Solvency Protection
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Multi-tier automated smart contract protections guarantee you receive your full savings.
              </p>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-white transition-colors">
            {isBackupLayersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isBackupLayersExpanded && (
          <div className="pt-4 border-t border-white/5 space-y-3 anim-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                <span className="font-bold text-emerald-400">Layer 1</span>
                <p className="font-semibold text-white">Security Deposit</p>
                <p className="text-[11px] text-slate-400 leading-snug">Member's own buffer absorbed first if an installment is missed.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                <span className="font-bold text-indigo-400">Layer 2</span>
                <p className="font-semibold text-white">Locked Dividends</p>
                <p className="text-[11px] text-slate-400 leading-snug">Accumulated discount yield seized to cover any payment delay.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                <span className="font-bold text-purple-400">Layer 3</span>
                <p className="font-semibold text-white">Social Vouch Stake</p>
                <p className="text-[11px] text-slate-400 leading-snug">External peer stakes in VouchRegistry slashed if buffer runs dry.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                <span className="font-bold text-amber-400">Layer 4</span>
                <p className="font-semibold text-white">Protocol Reserve</p>
                <p className="text-[11px] text-slate-400 leading-snug">Accumulated discount-floor fees fund circle-wide contingency reserves.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                <span className="font-bold text-rose-400">Layer 5</span>
                <p className="font-semibold text-white">Pro-Rata Backstop</p>
                <p className="text-[11px] text-slate-400 leading-snug">Mathematical socialized deduction guarantees pool stays solvent.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. TECHNICAL DETAILS CALLOUT (Opt-in) */}
      {isTechnicalMode && (
        <div className="tech-details-box text-xs space-y-2">
          <div className="flex items-center justify-between text-indigo-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-indigo-400" />
              On-Chain State Machine & Solvency Telemetry
            </span>
            <span className="font-mono text-[11px] text-slate-400">MST Testnet</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300 pt-2">
            <div>
              <p className="text-slate-400 text-[11px]">Contract State:</p>
              <p className="font-mono text-emerald-400 font-bold">{groupDetails.currentState || "Collect"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Solvency Invariant:</p>
              <p className="font-mono text-slate-200">Collateral ≥ Rem × 120%</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Safety Factor:</p>
              <p className="font-mono text-slate-200">{groupDetails.safetyFactorBps ? `${groupDetails.safetyFactorBps / 100}%` : "120%"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Discount Floor Cap:</p>
              <p className="font-mono text-slate-200">{groupDetails.discountCapBps ? `${groupDetails.discountCapBps / 100}%` : "30%"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
