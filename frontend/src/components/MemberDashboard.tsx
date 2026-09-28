import React from "react";
import { ShieldCheck, TrendingUp, DollarSign, Users, Award, AlertCircle } from "lucide-react";

interface MemberDashboardProps {
  account: string | null;
  bufferBalance: string;
  lockedDividends: string;
  paidInstallments: number;
  totalRounds: number;
  currentRound: number;
  hasWon: boolean;
  solvencyStatus: {
    isSolvent: boolean;
    totalBacking: string;
    requiredBacking: string;
  };
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  account,
  bufferBalance = "0.5",
  lockedDividends = "0.08",
  paidInstallments = 2,
  totalRounds = 5,
  currentRound = 3,
  hasWon = false,
  solvencyStatus = { isSolvent: true, totalBacking: "0.58", requiredBacking: "0.30" },
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Collateral Buffer</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white font-display">{bufferBalance} <span className="text-sm font-normal text-slate-400">tMSTC</span></p>
          <p className="text-xs text-emerald-400 mt-1 font-medium">1st Layer Protection</p>
        </div>

        <div className="glass-card p-5 border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Locked Dividends</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white font-display">{lockedDividends} <span className="text-sm font-normal text-slate-400">tMSTC</span></p>
          <p className="text-xs text-purple-400 mt-1 font-medium">Accumulating Yield</p>
        </div>

        <div className="glass-card p-5 border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Installments Paid</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-display">
            {paidInstallments} / {totalRounds}
          </p>
          <p className="text-xs text-slate-400 mt-1">Round {currentRound} Active</p>
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
          <p className="text-2xl font-bold text-emerald-400 font-display">
            {solvencyStatus.isSolvent ? "SOLVENT" : "AT RISK"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {solvencyStatus.totalBacking} / {solvencyStatus.requiredBacking} tMSTC
          </p>
        </div>
      </div>
    </div>
  );
};
