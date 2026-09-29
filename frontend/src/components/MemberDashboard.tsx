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
  X,
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
  onOpenDecryptModal?: () => void;
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
  onOpenDecryptModal,
}) => {
  const [isBackupLayersExpanded, setIsBackupLayersExpanded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currencyUnit, setCurrencyUnit] = useState<"INR" | "MST">("INR");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const statsGridRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Close tooltips on ESC key or click outside
  useEffect(() => {
    if (!activeTooltip) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveTooltip(null);
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".tooltip-trigger") && !target.closest(".tooltip-popup")) {
        setActiveTooltip(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeTooltip]);

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
              <h2 className="text-2xl sm:text-3xl font-bold text-[#121316] font-display">
                Choose a Savings Circle
              </h2>
              <p className="text-sm text-[#5F6368] max-w-lg leading-relaxed">
                Join an active rotating savings pool or launch your own private circle with friends, family, or colleagues on MST Blockchain.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {onCreateGroup && (
                <button onClick={onCreateGroup} className="btn-pill-primary text-xs">
                  <Plus className="w-4 h-4" />
                  Launch New Circle
                </button>
              )}
              {onOpenDecryptModal && (
                <button onClick={onOpenDecryptModal} className="btn-pill-secondary text-xs border-amber-300/80 hover:bg-amber-50/50">
                  <Lock className="w-3.5 h-3.5 text-[#946800]" />
                  Decrypt Workplace Code
                </button>
              )}
              <button onClick={onJoinGroup} className="btn-pill-secondary text-xs">
                <UserPlus className="w-4 h-4 text-[#121316]" />
                Join via Contract Address
              </button>
            </div>
          </div>
        </div>

        {/* Featured Circles Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#121316] font-display flex items-center gap-2">
            <Users className="w-4 h-4 text-[#E9B949]" />
            Available Savings Circles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredCircles.map((circle) => (
              <div
                key={circle.address}
                onClick={() => onSelectGroup && onSelectGroup(circle.address)}
                className="fintech-card p-5 cursor-pointer hover:border-black/20 hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-[#121316] group-hover:text-[#946800] transition-colors font-display">
                      {circle.name}
                    </h4>
                    <p className="text-[11px] font-mono text-[#8F959E]">
                      {circle.address.substring(0, 8)}...{circle.address.substring(circle.address.length - 6)}
                    </p>
                  </div>
                  <span className="p-2 rounded-xl bg-black/[0.04] text-[#121316] group-hover:bg-[#121316] group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-black/[0.05] text-xs">
                  <div>
                    <span className="text-[#5F6368] text-[11px]">Installment</span>
                    <p className="font-bold text-[#121316] tabular-nums">{formatINR(circle.installmentAmount)}</p>
                  </div>
                  <div>
                    <span className="text-[#5F6368] text-[11px]">Members</span>
                    <p className="font-bold text-[#121316]">{circle.memberCount} Participants</p>
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
      <div ref={heroRef} className="fintech-hero-card p-6 sm:p-8 relative overflow-hidden border border-black/[0.06]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E9B949]/[0.08] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-black/[0.04] border border-black/[0.06] text-xs font-semibold text-[#121316]">
                {groupName}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${trafficLight.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${trafficLight.status === "green" ? "bg-emerald-500" : trafficLight.status === "yellow" ? "bg-amber-500" : "bg-red-500"}`} />
                {trafficLight.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/[0.03] border border-black/[0.05] text-[11px] font-medium text-[#5F6368] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#8F959E]" /> Month {currentRound} of {totalRounds}
              </span>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-[#5F6368] font-medium">Next Monthly Contribution</p>
              <div className="flex items-baseline gap-3 mt-1">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#121316] font-display tracking-tight tabular-nums">
                  {currencyUnit === "INR" ? (
                    <AnimatedNumber value={installmentINR} formatAsINR />
                  ) : (
                    `${parseFloat(rawInstallment).toFixed(2)} tMSTC`
                  )}
                </p>
                <button
                  onClick={() => setCurrencyUnit(currencyUnit === "INR" ? "MST" : "INR")}
                  className="text-[11px] text-[#5F6368] hover:text-[#121316] font-medium px-2.5 py-1 rounded-full bg-black/[0.04] hover:bg-black/[0.08] transition-all"
                  title="Toggle display currency"
                >
                  {currencyUnit === "INR" ? "⇄ Show in tMSTC" : "⇄ Show in ₹ INR"}
                </button>
              </div>
              <p className="text-xs text-[#5F6368] mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8F959E]" />
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
                  className="btn-pill-primary w-full py-3.5 text-sm"
                >
                  {isProcessingPayment ? (
                    <>
                      <Zap className="w-4 h-4 animate-spin" />
                      Submitting on Blockchain...
                    </>
                  ) : hasPaidCurrentRound ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Month {currentRound} Paid
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-[#E9B949]" />
                      Pay {formatINR(rawInstallment)} →
                    </>
                  )}
                </button>

                <button
                  onClick={onOpenMandateModal}
                  className="btn-pill-secondary w-full py-2.5 text-xs text-[#121316]"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#E9B949]" />
                  {isMandateActive ? "Auto-Pay Mandate Active ✓" : "Setup Auto-Pay Mandate"}
                </button>
              </>
            ) : (
              <button
                onClick={onJoinGroup}
                className="btn-pill-primary w-full py-3.5 text-sm"
              >
                Join Savings Circle →
              </button>
            )}
          </div>
        </div>

        {/* Cycle Progress Bar */}
        <div className="mt-7 pt-6 border-t border-black/[0.06]">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-[#121316] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Circle Savings Progress
            </span>
            <span className="text-emerald-700 tabular-nums font-mono">{progressPercent}% Completed</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-black/[0.05] overflow-hidden p-0.5 border border-black/[0.04]">
            <div
              ref={progressBarRef}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[#E9B949] to-indigo-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#5F6368] mt-2">
            <span>Month 1 (Formed)</span>
            <span className="font-medium text-[#121316]">Active: Month {currentRound}</span>
            <span>Month {totalRounds} (Settlement)</span>
          </div>
        </div>
      </div>

      {/* 2. SECONDARY METRICS GRID */}
      <div ref={statsGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fintech-card p-5 space-y-2 border border-black/[0.06]">
          <div className="flex items-center justify-between text-[#5F6368]">
            <span className="text-xs font-semibold">Total Community Pot</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#121316] font-display tabular-nums tracking-tight">
            <AnimatedNumber value={potINR} formatAsINR />
          </p>
          <p className="text-[11px] text-[#5F6368] flex items-center gap-1">
            <span className="text-emerald-700 font-medium">Available for draw</span> this round
          </p>
        </div>

        <div className="fintech-card p-5 space-y-2 relative border border-black/[0.06]">
          <div className="flex items-center justify-between text-[#5F6368]">
            <span className="text-xs font-semibold flex items-center gap-1">
              Your Security Deposit
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === "buffer" ? null : "buffer")}
                className="tooltip-trigger text-[#8F959E] hover:text-[#121316] p-0.5 rounded focus:outline-none"
                aria-label="Explain security deposit"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#121316] font-display tabular-nums tracking-tight">
            <AnimatedNumber value={bufferINR} formatAsINR />
          </p>
          <p className="text-[11px] text-[#5F6368]">
            <span className="text-indigo-700 font-medium">100% refundable</span> at final month
          </p>
          {activeTooltip === "buffer" && (
            <div className="tooltip-popup absolute left-4 right-4 top-12 p-3.5 rounded-2xl bg-[#121316] text-white text-[11px] shadow-2xl z-30 anim-fade-in border border-white/10 flex items-start justify-between gap-2">
              <span className="leading-relaxed">
                Security buffer deposited into the smart contract upon joining. It guarantees circle solvency and is fully refunded at completion.
              </span>
              <button
                type="button"
                onClick={() => setActiveTooltip(null)}
                className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white flex-shrink-0"
                aria-label="Dismiss info"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="fintech-card p-5 space-y-2 relative border border-black/[0.06]">
          <div className="flex items-center justify-between text-[#5F6368]">
            <span className="text-xs font-semibold flex items-center gap-1">
              Earned Dividends
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === "dividends" ? null : "dividends")}
                className="tooltip-trigger text-[#8F959E] hover:text-[#121316] p-0.5 rounded focus:outline-none"
                aria-label="Explain earned dividends"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </span>
            <div className="p-1.5 rounded-lg bg-[#E9B949]/20 text-[#946800]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#946800] font-display tabular-nums tracking-tight">
            +<AnimatedNumber value={dividendsINR} formatAsINR />
          </p>
          <p className="text-[11px] text-[#5F6368]">
            Automated discount yield rolled forward
          </p>
          {activeTooltip === "dividends" && (
            <div className="tooltip-popup absolute left-4 right-4 top-12 p-3.5 rounded-2xl bg-[#121316] text-white text-[11px] shadow-2xl z-30 anim-fade-in border border-white/10 flex items-start justify-between gap-2">
              <span className="leading-relaxed">
                Accumulated interest savings from peers who took early pot payouts at a discount. Credited back directly to your balance.
              </span>
              <button
                type="button"
                onClick={() => setActiveTooltip(null)}
                className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white flex-shrink-0"
                aria-label="Dismiss info"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="fintech-card p-5 space-y-2 cursor-pointer hover:border-black/20 transition-all border border-black/[0.06]" onClick={onOpenDrawTab}>
          <div className="flex items-center justify-between text-[#5F6368]">
            <span className="text-xs font-semibold">Need Early Funds?</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-bold text-emerald-700 font-display flex items-center gap-1.5 mt-1">
            Request Draw Payout <ArrowRight className="w-4 h-4" />
          </p>
          <p className="text-[11px] text-[#5F6368]">
            Participate in this month's reverse auction
          </p>
        </div>
      </div>

      {/* 3. 5-LAYER WATERFALL DISCLOSURE */}
      <div className="fintech-card p-6 border border-black/[0.06] space-y-4">
        <button
          onClick={() => setIsBackupLayersExpanded(!isBackupLayersExpanded)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#121316] font-display flex items-center gap-2">
                Why Your Community Savings Are Safe
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                  5-Layer Solvency Protection
                </span>
              </h3>
              <p className="text-xs text-[#5F6368]">
                Multi-tier automated smart contract protections guarantee you receive your full savings.
              </p>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-black/[0.04] text-[#5F6368] group-hover:text-[#121316] transition-colors">
            {isBackupLayersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isBackupLayersExpanded && (
          <div className="pt-4 border-t border-black/[0.05] space-y-3 anim-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-black/[0.05] space-y-1">
                <span className="font-bold text-emerald-700 font-mono text-[11px]">Layer 1</span>
                <p className="font-semibold text-[#121316]">Security Deposit</p>
                <p className="text-[11px] text-[#5F6368] leading-snug">Member's own buffer absorbed first if an installment is missed.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-black/[0.05] space-y-1">
                <span className="font-bold text-indigo-700 font-mono text-[11px]">Layer 2</span>
                <p className="font-semibold text-[#121316]">Locked Dividends</p>
                <p className="text-[11px] text-[#5F6368] leading-snug">Accumulated discount yield seized to cover any payment delay.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-black/[0.05] space-y-1">
                <span className="font-bold text-purple-700 font-mono text-[11px]">Layer 3</span>
                <p className="font-semibold text-[#121316]">Social Vouch Stake</p>
                <p className="text-[11px] text-[#5F6368] leading-snug">External peer stakes in VouchRegistry slashed if buffer runs dry.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-black/[0.05] space-y-1">
                <span className="font-bold text-amber-700 font-mono text-[11px]">Layer 4</span>
                <p className="font-semibold text-[#121316]">Protocol Reserve</p>
                <p className="text-[11px] text-[#5F6368] leading-snug">Accumulated discount-floor fees fund circle-wide contingency reserves.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-black/[0.05] space-y-1">
                <span className="font-bold text-rose-700 font-mono text-[11px]">Layer 5</span>
                <p className="font-semibold text-[#121316]">Pro-Rata Backstop</p>
                <p className="text-[11px] text-[#5F6368] leading-snug">Mathematical socialized deduction guarantees pool stays solvent.</p>
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
