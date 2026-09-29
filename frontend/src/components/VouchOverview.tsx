import React from "react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  HeartHandshake,
  CheckCircle2,
  TrendingUp,
  Coins,
  ChevronDown,
  Activity,
  Layers,
  ExternalLink,
  Code2,
  Clock,
  Compass,
} from "lucide-react";
import { formatINR, formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { GroupDetails, MemberDetails } from "../services/contractService";
import { RiskPredictionResponse } from "../services/aiService";
import { MST_TESTNET } from "../config/network";

interface VouchOverviewProps {
  account: string | null;
  groupDetails: GroupDetails | null;
  memberDetails: MemberDetails | null;
  riskAdvisory: RiskPredictionResponse | null;
  onOpenDrawTab: () => void;
  onOpenStandingTab: () => void;
  onOpenLedgerTab: () => void;
  onOpenDashboardTab: () => void;
  onOpenConnectModal: () => void;
  onOpenCreateGroupModal: () => void;
}

export const VouchOverview: React.FC<VouchOverviewProps> = ({
  account,
  groupDetails,
  memberDetails,
  riskAdvisory,
  onOpenDrawTab,
  onOpenStandingTab,
  onOpenLedgerTab,
  onOpenDashboardTab,
  onOpenConnectModal,
  onOpenCreateGroupModal,
}) => {
  const currentRound = groupDetails?.currentRound || 1;
  const totalRounds = groupDetails?.memberCount || 5;
  const rawInstallment = groupDetails?.installmentAmount || "5.0";
  const installmentINR = Math.round(parseFloat(rawInstallment) * MST_TO_INR_RATE);
  const potFloat = parseFloat(groupDetails?.currentPot || "25.0") || 25.0;
  const potINR = Math.round(potFloat * MST_TO_INR_RATE);

  const prob = riskAdvisory?.defaultProbability ?? 0.15;
  const probPercent = Math.round(prob * 100);

  return (
    <div className="space-y-16 sm:space-y-24 py-6 sm:py-12">
      {/* ── 1. EDITORIAL HERO SECTION ── */}
      <section className="text-center max-w-4xl mx-auto px-4 space-y-6">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E9B949]/15 border border-[#E9B949]/30 text-[#8C6400] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#E9B949]" />
          <span>Autonomous ROSCA Protocol on MST Testnet</span>
        </div>

        {/* Large Editorial Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#121316] font-display leading-[1.04]">
          Unlock Comprehensive Financial Trust <br className="hidden sm:inline" />
          in Every Community Chit Cycle
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg text-[#5F6368] max-w-2xl mx-auto leading-relaxed font-normal">
          The most advanced decentralized savings platform. Vouch replaces informal ROSCA default risk with non-custodial smart contracts, commit-reveal reverse auctions, and real-time XGBoost moral hazard analytics.
        </p>

        {/* Pill Action Buttons (Matching Reference) */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {account ? (
            <button
              onClick={onOpenDashboardTab}
              className="btn-pill-primary text-sm px-6 py-3"
            >
              Enter Member Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onOpenConnectModal}
              className="btn-pill-primary text-sm px-6 py-3"
            >
              Connect Wallet to Begin
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenCreateGroupModal}
            className="btn-pill-secondary text-sm px-6 py-3"
          >
            Launch a Private Circle
          </button>
        </div>

        {/* Dropdown / Sub-anchor */}
        <div className="pt-2 text-xs text-[#8F959E] flex items-center justify-center gap-1 font-mono">
          <span>Active on MST Blockchain (Chain ID 91562037)</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </section>

      {/* ── 2. HERO PRODUCT PREVIEW SECTION ── */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="editorial-hero-card p-6 sm:p-10 border border-black/[0.06] shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-black/[0.05]">
            <div>
              <span className="v-badge v-badge-gold mb-2">LIVE CHIT CYCLE</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#121316] font-display">
                {groupDetails?.name || "Alpha Savings Circle"}
              </h2>
              <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
                Month {currentRound} of {totalRounds} • {groupDetails?.memberCount || 5} Verified Members
              </p>
            </div>

            <div className="text-left md:text-right">
              <span className="text-xs text-[#8F959E] font-medium">Available Community Pot</span>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#121316] font-display tabular-nums tracking-tight mt-0.5">
                {formatRawINR(potINR)}
              </p>
              <p className="text-xs text-emerald-700 font-medium">
                {potFloat.toFixed(2)} tMSTC in Escrow
              </p>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.04]">
              <span className="text-xs text-[#5F6368] font-medium">Next Installment</span>
              <p className="text-xl font-bold text-[#121316] font-display mt-1 tabular-nums">
                {formatRawINR(installmentINR)}
              </p>
              <p className="text-[11px] text-[#8F959E] mt-0.5">{rawInstallment} tMSTC / month</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.04]">
              <span className="text-xs text-[#5F6368] font-medium">Your Security Deposit</span>
              <p className="text-xl font-bold text-indigo-700 font-display mt-1 tabular-nums">
                {formatINR(memberDetails?.bufferBalance || "0.5")}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">100% Refundable on Settlement</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.04]">
              <span className="text-xs text-[#5F6368] font-medium">Accumulated Yield</span>
              <p className="text-xl font-bold text-[#946800] font-display mt-1 tabular-nums">
                +{formatINR(memberDetails?.lockedDividends || "0.08")}
              </p>
              <p className="text-[11px] text-[#8F959E] mt-0.5">Automated auction savings yield</p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-black/[0.05]">
            <div className="flex items-center gap-2 text-xs text-[#5F6368]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Smart contracts autonomously enforce monthly contributions and reverse auctions.</span>
            </div>

            <button
              onClick={onOpenDashboardTab}
              className="btn-pill-primary text-xs px-5 py-2.5"
            >
              Open Interactive Workspace →
            </button>
          </div>
        </div>
      </section>

      {/* ── 3. PROTOCOL TICKER (MARQUEE STRIP) ── */}
      <section className="border-y border-black/[0.05] bg-white py-4 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between gap-8 text-xs text-[#5F6368] font-medium whitespace-nowrap overflow-x-auto no-scrollbar">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Non-Custodial Smart Contracts
          </span>
          <span className="text-[#B0B5BC]">·</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#E9B949]" /> 0% Middleman Take Rate
          </span>
          <span className="text-[#B0B5BC]">·</span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-indigo-600" /> Commit-Reveal Reverse Auctions
          </span>
          <span className="text-[#B0B5BC]">·</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" /> 5-Layer Solvency Backstop
          </span>
          <span className="text-[#B0B5BC]">·</span>
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-purple-600" /> XGBoost Moral Hazard Analytics
          </span>
        </div>
      </section>

      {/* ── 4. HOW VOUCH EMPOWERS COMMUNITY SAVINGS ── */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-8">
        <div className="space-y-3">
          <div className="w-8 h-8 rounded-full bg-[#E9B949]/20 flex items-center justify-center mx-auto text-[#946800]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal text-[#121316] font-display">
            How Vouch Empowers Your Community Savings
          </h2>
          <p className="text-sm text-[#5F6368] max-w-lg mx-auto">
            Traditional chit funds suffer from defaults and lack of transparency. Vouch replaces trust with mathematics and smart contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-3xl bg-white border border-black/[0.05] shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold font-mono">
              01
            </div>
            <h3 className="text-base font-bold text-[#121316] font-display">Deposit Security Buffer</h3>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              Every member stakes a refundable buffer into the ChitGroup smart contract upon joining to guarantee solvency.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-black/[0.05] shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold font-mono">
              02
            </div>
            <h3 className="text-base font-bold text-[#121316] font-display">Secret Commit-Reveal</h3>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              Members needing liquidity submit secret encrypted bids. No front-running or undercutting by peers.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-black/[0.05] shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-bold font-mono">
              03
            </div>
            <h3 className="text-base font-bold text-[#121316] font-display">Savings Dividends</h3>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              The winning discount is distributed proportionally back to all non-winning members as automated savings yield.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. VOUCH CORE FEATURES 2x2 GRID (MATCHING REFERENCE) ── */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-normal text-[#121316] font-display">
            Vouch Main Features
          </h2>
          <p className="text-sm text-[#5F6368]">
            Architected specifically for decentralized Rotating Savings & Credit Associations (ROSCAs).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Commit-Reveal Reverse Auction */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white border border-black/[0.05] shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="v-badge v-badge-purple text-[10px]">DEEP DIVE AUCTION</span>
              <h3 className="text-xl font-bold text-[#121316] font-display">
                Go deeper than ever into private reverse auctions
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Our cryptographic commit-reveal protocol anchors Keccak256 hash commitments on the MST blockchain. Bids remain sealed until the reveal window opens.
              </p>
            </div>

            {/* Embedded Live Preview */}
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.04] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#121316]">Current State: Commit Phase</span>
                <span className="text-[#8F959E] font-mono">Floor: 30% Max</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800 font-bold">1. Commit</div>
                <div className="p-1.5 rounded-lg bg-black/[0.03] text-[#8F959E]">2. Reveal</div>
                <div className="p-1.5 rounded-lg bg-black/[0.03] text-[#8F959E]">3. Settle</div>
              </div>
              <button
                onClick={onOpenDrawTab}
                className="w-full btn-pill-secondary text-xs py-2"
              >
                Inspect Auction Bidding →
              </button>
            </div>
          </div>

          {/* Card 2: XGBoost AI Risk Scoring */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white border border-black/[0.05] shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="v-badge v-badge-gold text-[10px]">PRECISION AI</span>
              <h3 className="text-xl font-bold text-[#121316] font-display">
                Smaller inputs to AI enable greater credit precision
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Trained on 10,000 synthetic ROSCA cycles. Models the statistical drop in repayment discipline after early wins to recommend dynamic collateral buffer multipliers.
              </p>
            </div>

            {/* Embedded Live Preview */}
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.04] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#121316]">Model Probability</span>
                <span className="font-bold text-emerald-700 font-mono">{probPercent}% (Prime Standing)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/[0.06] overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.max(10, probPercent)}%` }} />
              </div>
              <button
                onClick={onOpenStandingTab}
                className="w-full btn-pill-secondary text-xs py-2"
              >
                Inspect AI Risk Advisor →
              </button>
            </div>
          </div>

          {/* Card 3: 5-Layer Solvency Backstop */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white border border-black/[0.05] shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="v-badge v-badge-green text-[10px]">5-LAYER BACKSTOP</span>
              <h3 className="text-xl font-bold text-[#121316] font-display">
                Easily manage and guarantee circle solvency
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Layer 1 Member Buffer, Layer 2 Locked Dividends, Layer 3 Peer Vouch Registry, Layer 4 Protocol Reserve, and Layer 5 Pro-Rata Backstop ensure every member receives full savings.
              </p>
            </div>

            {/* Embedded Live Preview */}
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.04] space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-black/[0.04]">
                <span className="text-[#5F6368]">Layer 1: Security Buffer</span>
                <span className="font-mono text-emerald-700">100% Covered</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/[0.04]">
                <span className="text-[#5F6368]">Layer 2: Social Vouch</span>
                <span className="font-mono text-indigo-700">Peer Backed</span>
              </div>
              <button
                onClick={onOpenStandingTab}
                className="w-full btn-pill-secondary text-xs py-2 mt-1"
              >
                View Solvency Waterfall →
              </button>
            </div>
          </div>

          {/* Card 4: Immutable Blockchain Audit Statement */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white border border-black/[0.05] shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="v-badge v-badge-neutral text-[10px]">ON-CHAIN AUDIT</span>
              <h3 className="text-xl font-bold text-[#121316] font-display">
                Run audit verification without central intermediaries
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Every contribution, auction settlement, and security refund produces an immutable transaction hash on the MST blockchain. Inspectable via MSTScan.
              </p>
            </div>

            {/* Embedded Live Preview */}
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.04] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#121316]">Latest Transaction</span>
                <span className="text-emerald-700 font-medium">✓ Confirmed</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-black/[0.04] text-[11px] font-mono text-[#5F6368] truncate">
                Tx: 0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f
              </div>
              <button
                onClick={onOpenLedgerTab}
                className="w-full btn-pill-secondary text-xs py-2"
              >
                Open Audit Statement & Drawer →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FINAL EDITORIAL CTA ── */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6 pt-6">
        <h2 className="text-3xl sm:text-4xl font-normal text-[#121316] font-display">
          Build your next transparent savings circle.
        </h2>
        <p className="text-sm text-[#5F6368] max-w-md mx-auto">
          Non-custodial, peer-to-peer rotating savings protected by mathematics on MST Blockchain.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenCreateGroupModal}
            className="btn-pill-primary text-sm px-6 py-3"
          >
            Launch a Circle
          </button>
          <button
            onClick={onOpenDashboardTab}
            className="btn-pill-secondary text-sm px-6 py-3"
          >
            Explore Active Circles
          </button>
        </div>
      </section>

      {/* ── 7. EDITORIAL FOOTER ── */}
      <footer className="max-w-5xl mx-auto px-4 pt-12 pb-6 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8F959E]">
        <div className="flex items-center gap-2 text-[#121316] font-bold font-display">
          <div className="w-5 h-5 rounded-full bg-[#E9B949] flex items-center justify-center text-[10px]">
            V
          </div>
          <span>Vouch Protocol</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={MST_TESTNET.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#121316] transition-colors inline-flex items-center gap-1"
          >
            MSTScan Explorer
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>·</span>
          <span>Chain ID: {MST_TESTNET.chainId}</span>
          <span>·</span>
          <span>© {new Date().getFullYear()} Vouch</span>
        </div>
      </footer>
    </div>
  );
};
