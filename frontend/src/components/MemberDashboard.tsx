import React, { useState } from "react";
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  AlertCircle,
  PlusCircle,
  Layers,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

interface MemberDashboardProps {
  account: string | null;
  bufferBalance: string;
  lockedDividends: string;
  voucherStake?: string;
  paidInstallments: number;
  totalRounds: number;
  currentRound: number;
  hasWon: boolean;
  solvencyStatus: {
    isSolvent: boolean;
    totalBacking: string;
    requiredBacking: string;
    safetyFactorBps?: number;
  };
  onDepositBuffer?: (amount: string) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  account,
  bufferBalance = "0.50",
  lockedDividends = "0.08",
  voucherStake = "0.25",
  paidInstallments = 2,
  totalRounds = 5,
  currentRound = 3,
  hasWon = false,
  solvencyStatus = {
    isSolvent: true,
    totalBacking: "0.83",
    requiredBacking: "0.36",
    safetyFactorBps: 12000,
  },
  onDepositBuffer,
}) => {
  const [topUpAmount, setTopUpAmount] = useState("0.1");
  const [showTopUp, setShowTopUp] = useState(false);

  return (
    <div className="space-y-6">
      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Collateral Buffer</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white font-display">
            {bufferBalance} <span className="text-sm font-normal text-slate-400">tMSTC</span>
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">Layer 1 Direct</span>
            <button
              onClick={() => setShowTopUp(!showTopUp)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Top up
            </button>
          </div>
        </div>

        <div className="glass-card p-5 border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Locked Dividends</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white font-display">
            {lockedDividends} <span className="text-sm font-normal text-slate-400">tMSTC</span>
          </p>
          <p className="text-xs text-purple-400 mt-2 font-medium">Layer 2 Collateral (+Yield)</p>
        </div>

        <div className="glass-card p-5 border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Installments Progress</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-display">
            {paidInstallments} / {totalRounds}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Round {currentRound} of {totalRounds} • {totalRounds - paidInstallments} remaining
          </p>
        </div>

        <div className="glass-card p-5 border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Solvency Invariant</span>
            {solvencyStatus.isSolvent ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
          <p
            className={`text-2xl font-bold font-display ${
              solvencyStatus.isSolvent ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {solvencyStatus.isSolvent ? "SOLVENT" : "DEFICIT"}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Backing: {solvencyStatus.totalBacking} / Req: {solvencyStatus.requiredBacking} tMSTC
          </p>
        </div>
      </div>

      {/* Top Up Collateral Drawer */}
      {showTopUp && (
        <div className="glass-card p-4 border-indigo-500/30 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-sm font-semibold text-white">Deposit Additional Buffer</p>
              <p className="text-xs text-slate-400">Increase your on-chain solvency buffer against future rounds</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="w-28 px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-white text-xs text-right font-mono"
            />
            <span className="text-xs text-slate-400 font-semibold">tMSTC</span>
            <button
              onClick={() => {
                if (onDepositBuffer) onDepositBuffer(topUpAmount);
                setShowTopUp(false);
              }}
              className="btn-primary text-xs px-3 py-1.5"
            >
              Deposit
            </button>
          </div>
        </div>
      )}

      {/* Solvency & Waterfall Architecture Detail */}
      <div className="glass-card p-6 border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white font-display">
              Solvency Formula & 5-Step Protection Waterfall
            </h3>
          </div>
          <span className="text-xs font-mono text-indigo-400">
            Formula: Collateral × 10000 ≥ Remaining × 12000
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 font-semibold mb-1">Layer 1</p>
            <p className="text-sm font-bold text-white">Member Buffer</p>
            <p className="text-xs text-slate-400 mt-1">{bufferBalance} tMSTC locked</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-purple-500/20">
            <p className="text-xs text-purple-400 font-semibold mb-1">Layer 2</p>
            <p className="text-sm font-bold text-white">Locked Dividends</p>
            <p className="text-xs text-slate-400 mt-1">{lockedDividends} tMSTC accrued</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-blue-500/20">
            <p className="text-xs text-blue-400 font-semibold mb-1">Layer 3</p>
            <p className="text-sm font-bold text-white">Voucher Stake</p>
            <p className="text-xs text-slate-400 mt-1">{voucherStake} tMSTC staked</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-amber-500/20">
            <p className="text-xs text-amber-400 font-semibold mb-1">Layer 4</p>
            <p className="text-sm font-bold text-white">Reserve Fund</p>
            <p className="text-xs text-slate-400 mt-1">Discount floor splits</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
            <p className="text-xs text-slate-400 font-semibold mb-1">Layer 5</p>
            <p className="text-sm font-bold text-white">Pro-Rata Haircut</p>
            <p className="text-xs text-slate-400 mt-1">Zero-loss buffer</p>
          </div>
        </div>
      </div>
    </div>
  );
};

