import React, { useState } from "react";
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  AlertCircle,
  PlusCircle,
  Layers,
} from "lucide-react";

interface MemberDashboardProps {
  account: string | null;
  bufferBalance?: string;
  lockedDividends?: string;
  voucherStake?: string;
  paidInstallments?: number;
  totalRounds?: number;
  currentRound?: number;
  hasWon?: boolean;
  solvencyStatus?: {
    isSolvent: boolean;
    totalBacking: string;
    requiredBacking: string;
    safetyFactorBps?: number;
  };
  onDepositBuffer?: (amount: string) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  account,
  bufferBalance = "0.00",
  lockedDividends = "0.00",
  voucherStake = "0.00",
  paidInstallments = 0,
  totalRounds = 0,
  currentRound = 0,
  hasWon = false,
  solvencyStatus = {
    isSolvent: true,
    totalBacking: "0.00",
    requiredBacking: "0.00",
    safetyFactorBps: 12000,
  },
  onDepositBuffer,
}) => {
  const [topUpAmount, setTopUpAmount] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e0e0e] rounded-xl p-6 text-center flex flex-col items-center justify-between min-h-[140px]">
          <div className="flex items-center justify-center gap-2 text-neutral-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Collateral Buffer</span>
            <ShieldCheck className="w-4 h-4 text-neutral-300" />
          </div>
          <p className="text-2xl font-bold text-white font-display">
            {bufferBalance} <span className="text-xs font-normal text-neutral-400">tMSTC</span>
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="text-xs text-neutral-400">Layer 1 Direct</span>
            {account && (
              <button
                onClick={() => setShowTopUp(!showTopUp)}
                className="text-xs text-royal-400 hover:text-royal-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Deposit
              </button>
            )}
          </div>
        </div>

        <div className="bg-[#0e0e0e] rounded-xl p-6 text-center flex flex-col items-center justify-between min-h-[140px]">
          <div className="flex items-center justify-center gap-2 text-neutral-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Locked Dividends</span>
            <TrendingUp className="w-4 h-4 text-neutral-300" />
          </div>
          <p className="text-2xl font-bold text-white font-display">
            {lockedDividends} <span className="text-xs font-normal text-neutral-400">tMSTC</span>
          </p>
          <p className="text-xs text-neutral-400 mt-2">Layer 2 (+Yield)</p>
        </div>

        <div className="bg-[#0e0e0e] rounded-xl p-6 text-center flex flex-col items-center justify-between min-h-[140px]">
          <div className="flex items-center justify-center gap-2 text-neutral-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Installments Progress</span>
            <DollarSign className="w-4 h-4 text-neutral-300" />
          </div>
          <p className="text-2xl font-bold text-white font-display">
            {paidInstallments} / {totalRounds}
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            {totalRounds > 0 ? `Round ${currentRound} Active` : "Awaiting Group"}
          </p>
        </div>

        <div className="bg-[#0e0e0e] rounded-xl p-6 text-center flex flex-col items-center justify-between min-h-[140px]">
          <div className="flex items-center justify-center gap-2 text-neutral-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Solvency Status</span>
            {solvencyStatus.isSolvent ? (
              <ShieldCheck className="w-4 h-4 text-neutral-300" />
            ) : (
              <AlertCircle className="w-4 h-4 text-royal-400" />
            )}
          </div>
          <p className="text-2xl font-bold font-display text-white">
            {solvencyStatus.isSolvent ? "SOLVENT" : "DEFICIT"}
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            Backing: {solvencyStatus.totalBacking} / Req: {solvencyStatus.requiredBacking} tMSTC
          </p>
        </div>
      </div>

      {/* Top Up Collateral Drawer */}
      {showTopUp && (
        <div className="bg-[#0e0e0e] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-white">Deposit Collateral Buffer</p>
            <p className="text-xs text-neutral-400 mt-0.5">Top up your Layer 1 on-chain buffer for upcoming rounds</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="w-32 px-4 py-2 rounded-lg bg-black text-white text-sm text-right font-mono focus:outline-none placeholder:text-neutral-700"
            />
            <span className="text-xs text-neutral-400 font-semibold">tMSTC</span>
            <button
              onClick={() => {
                if (onDepositBuffer && topUpAmount) {
                  onDepositBuffer(topUpAmount);
                  setTopUpAmount("");
                }
                setShowTopUp(false);
              }}
              className="btn-primary"
            >
              Deposit
            </button>
          </div>
        </div>
      )}

      {/* Solvency & Waterfall Architecture Detail */}
      <div className="bg-[#0e0e0e] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-neutral-300" />
            <h3 className="text-base font-bold text-white font-display">
              Solvency Formula & 5-Step Protection Waterfall
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            Formula: Collateral × 10000 ≥ Remaining × 12000
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          <div className="p-4 rounded-lg bg-black text-center">
            <p className="text-xs text-neutral-400 font-semibold mb-1">Layer 1</p>
            <p className="text-sm font-bold text-white">Member Buffer</p>
            <p className="text-xs text-neutral-400 mt-1">{bufferBalance} tMSTC locked</p>
          </div>

          <div className="p-4 rounded-lg bg-black text-center">
            <p className="text-xs text-neutral-400 font-semibold mb-1">Layer 2</p>
            <p className="text-sm font-bold text-white">Locked Dividends</p>
            <p className="text-xs text-neutral-400 mt-1">{lockedDividends} tMSTC accrued</p>
          </div>

          <div className="p-4 rounded-lg bg-black text-center">
            <p className="text-xs text-neutral-400 font-semibold mb-1">Layer 3</p>
            <p className="text-sm font-bold text-white">Voucher Stake</p>
            <p className="text-xs text-neutral-400 mt-1">{voucherStake} tMSTC staked</p>
          </div>

          <div className="p-4 rounded-lg bg-black text-center">
            <p className="text-xs text-neutral-400 font-semibold mb-1">Layer 4</p>
            <p className="text-sm font-bold text-white">Reserve Fund</p>
            <p className="text-xs text-neutral-400 mt-1">Discount Floor Splits</p>
          </div>

          <div className="p-4 rounded-lg bg-black text-center">
            <p className="text-xs text-neutral-400 font-semibold mb-1">Layer 5</p>
            <p className="text-sm font-bold text-white">Pro-Rata Haircut</p>
            <p className="text-xs text-neutral-400 mt-1">Socialized Backstop</p>
          </div>
        </div>
      </div>
    </div>
  );
};
