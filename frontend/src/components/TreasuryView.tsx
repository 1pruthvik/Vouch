import React, { useState } from "react";
import {
  TrendingUp,
  ShieldCheck,
  Coins,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Layers,
  CheckCircle2,
  PieChart,
  HelpCircle,
  Activity,
  Code2,
  Info
} from "lucide-react";
import { formatRawINR } from "../utils/formatters";

interface TreasuryViewProps {
  isTechnicalMode: boolean;
}

export const TreasuryView: React.FC<TreasuryViewProps> = ({ isTechnicalMode }) => {
  const totalPooledINR = 450000;
  const generatingYieldINR = 360000;
  const liquidReserveINR = 90000;
  const yieldEarnedINR = 2840;

  const yieldAPY = "6.4%";
  const liquidPercent = 20;
  const deployedPercent = 80;

  return (
    <div className="space-y-6 anim-fade-up">
      {/* ── TREASURY HERO HEADER ── */}
      <div className="v-card-hero p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="v-badge v-badge-green text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                Treasury Policy: Risk Constrained
              </span>
              <span className="v-badge v-badge-amber text-xs">
                Simulated Testnet Strategy
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-display tracking-tight">
              Pool Treasury
            </h1>
            <p className="text-xs sm:text-sm text-[#9ca3b4] max-w-xl leading-relaxed">
              Between monthly draws, idle pooled capital is safely deployed in a zero-leverage yield adapter.
              Settlement liquidity is always prioritized so the winning member receives their payout on time.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center sm:text-right min-w-[220px]">
            <p className="text-xs text-[#9ca3b4] font-medium">Total Pooled Capital</p>
            <p className="text-3xl sm:text-4xl font-bold text-white font-display mt-1 tracking-tight">
              {formatRawINR(totalPooledINR)}
            </p>
            <p className="text-[11px] text-[#2dd4a8] mt-1 font-semibold">
              +{formatRawINR(yieldEarnedINR)} Yield Earned This Cycle
            </p>
          </div>
        </div>

        {/* Breakdown Metric Bar */}
        <div className="mt-6 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/[0.06] text-xs">
          <div>
            <p className="text-[#5f6578]">Generating Yield</p>
            <p className="text-sm font-bold text-white font-display mt-0.5">
              {formatRawINR(generatingYieldINR)} ({deployedPercent}%)
            </p>
          </div>
          <div>
            <p className="text-[#5f6578]">Liquid Reserve</p>
            <p className="text-sm font-bold text-[#2dd4a8] font-display mt-0.5">
              {formatRawINR(liquidReserveINR)} ({liquidPercent}%)
            </p>
          </div>
          <div>
            <p className="text-[#5f6578]">Current Strategy APY</p>
            <p className="text-sm font-bold text-[#f5a623] font-display mt-0.5">
              {yieldAPY} (Simulated)
            </p>
          </div>
          <div>
            <p className="text-[#5f6578]">Risk Compliance</p>
            <p className="text-sm font-bold text-[#2dd4a8] font-display mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Within Policy
            </p>
          </div>
        </div>
      </div>

      {/* ── WHERE YOUR MONEY FLOWS (INTERACTIVE FLOW DIAGRAM) ── */}
      <div className="v-card p-6 sm:p-7 space-y-5">
        <div>
          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2dd4a8]" />
            Where Your Money Flows
          </h3>
          <p className="text-xs text-[#9ca3b4] mt-0.5">
            Every movement of funds is automated and traceable on the smart contract.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#2dd4a8] px-2 py-0.5 rounded-full bg-[#2dd4a8]/10 border border-[#2dd4a8]/20">
                1. Dues Inflow
              </span>
            </div>
            <h4 className="text-xs font-bold text-white font-display">Monthly Contributions</h4>
            <p className="text-[11px] text-[#9ca3b4] leading-relaxed">
              Members pay ₹25,000 on the 1st of the month via UPI AutoPay.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#f5a623] px-2 py-0.5 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20">
                2. Autonomous Escrow
              </span>
            </div>
            <h4 className="text-xs font-bold text-white font-display">Smart Contract Vault</h4>
            <p className="text-[11px] text-[#9ca3b4] leading-relaxed">
              Funds are held in decentralized escrow on MST Testnet. No organizer access.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-[#2dd4a8]/[0.03] border border-[#2dd4a8]/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#2dd4a8] px-2 py-0.5 rounded-full bg-[#2dd4a8]/10 border border-[#2dd4a8]/20">
                3. Yield Deployment
              </span>
            </div>
            <h4 className="text-xs font-bold text-white font-display">Yield Engine (80% Max)</h4>
            <p className="text-[11px] text-[#9ca3b4] leading-relaxed">
              Idle liquidity earns {yieldAPY}. 20% liquid buffer is locked for draw day.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#8b5cf6] px-2 py-0.5 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
                4. Monthly Draw
              </span>
            </div>
            <h4 className="text-xs font-bold text-white font-display">Auction Settlement</h4>
            <p className="text-[11px] text-[#9ca3b4] leading-relaxed">
              The winning bidder is awarded the pool payout at deterministic discount rules.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#38bdf8] px-2 py-0.5 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20">
                5. Dividend Credit
              </span>
            </div>
            <h4 className="text-xs font-bold text-white font-display">Surplus Distribution</h4>
            <p className="text-[11px] text-[#9ca3b4] leading-relaxed">
              Auction discount + yield earnings reduce next month's dues for all members.
            </p>
          </div>
        </div>
      </div>

      {/* ── FINANCIAL PRIORITY HIERARCHY & RISK CONSTRAINTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Financial Priority Hierarchy */}
        <div className="v-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
            <Layers className="w-4 h-4 text-[#2dd4a8]" />
            <h3 className="text-sm font-bold text-white font-display">
              Financial Priority Hierarchy
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <span className="font-semibold text-white">1. Member Obligations</span>
              <span className="v-badge v-badge-green text-[10px]">Highest Priority</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <span className="font-semibold text-white">2. Upcoming Settlement Liquidity</span>
              <span className="v-badge v-badge-green text-[10px]">Min 20% Liquid</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <span className="font-semibold text-white">3. Security Reserve Protection</span>
              <span className="v-badge v-badge-amber text-[10px]">Ring-Fenced</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <span className="font-semibold text-white">4. Capital Preservation</span>
              <span className="v-badge v-badge-blue text-[10px]">0% Leverage</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <span className="font-semibold text-white">5. Yield Generation</span>
              <span className="text-[#9ca3b4] text-[11px]">Secondary Objective</span>
            </div>
          </div>
        </div>

        {/* Strict Risk Constraints */}
        <div className="v-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
            <ShieldCheck className="w-4 h-4 text-[#f5a623]" />
            <h3 className="text-sm font-bold text-white font-display">
              Treasury Risk Policy
            </h3>
          </div>

          <div className="space-y-3 text-xs text-[#9ca3b4]">
            <div className="flex items-center justify-between">
              <span>Maximum Protocol Exposure</span>
              <span className="font-bold text-white">40% per protocol</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Minimum Immediately Liquid Reserve</span>
              <span className="font-bold text-[#2dd4a8]">20% (₹90,000)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Maximum Single Asset Exposure</span>
              <span className="font-bold text-white">60%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Maximum Leverage</span>
              <span className="font-bold text-[#2dd4a8]">0.0% (Zero Borrowing)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Volatile Asset Exposure for Core Pool</span>
              <span className="font-bold text-[#2dd4a8]">0.0% (Fixed Value Only)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 text-[11px] text-[#f5a623] flex items-start gap-2.5">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Note on Yield Simulation:</strong> Yield strategy for the hackathon demonstration uses simulated testnet yield adapters.
              Real member funds are never exposed to external DeFi protocols without explicit multi-party verification.
            </span>
          </div>
        </div>
      </div>

      {/* ── TECHNICAL MODE SPECIFICATIONS ── */}
      {isTechnicalMode && (
        <div className="v-tech-box text-xs space-y-2 anim-fade-up">
          <p className="font-bold text-[#8b5cf6] flex items-center gap-1.5">
            <Code2 className="w-4 h-4" />
            YieldVaultAdapter Specs & Contract State
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-[#9ca3b4]">
            <div>
              <p className="text-[#5f6578]">Adapter Type</p>
              <p className="font-mono text-white">MockYieldVault.sol (ERC-4626 standard)</p>
            </div>
            <div>
              <p className="text-[#5f6578]">Instant Liquidity Requirement</p>
              <p className="font-mono text-[#2dd4a8]">liquidityReserve &gt;= totalPot * 2000 bps</p>
            </div>
            <div>
              <p className="text-[#5f6578]">De-allocation Trigger</p>
              <p className="font-mono text-white">Keeper calls withdraw() before settleRound()</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
