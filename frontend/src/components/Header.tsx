import React from "react";
import { ShieldCheck, User, Code2, Sparkles, Plus, Wallet, ExternalLink, Activity } from "lucide-react";
import { formatINR } from "../utils/formatters";
import { MST_TESTNET } from "../config/network";

interface HeaderProps {
  account: string | null;
  balance: string;
  isConnecting: boolean;
  groupName?: string;
  isTechnicalMode: boolean;
  onToggleTechnicalMode: () => void;
  onOpenAccountModal: () => void;
  onOpenCreateGroupModal: () => void;
  onSwitchGroup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  balance,
  isConnecting,
  groupName = "Alpha Savings Circle",
  isTechnicalMode,
  onToggleTechnicalMode,
  onOpenAccountModal,
  onOpenCreateGroupModal,
  onSwitchGroup,
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#08090C]/85 border-b border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Brand & Active Circle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white font-display flex items-center gap-2">
              Vouch
              <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                DECENTRALIZED CHIT
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Autonomous ROSCA Protocol on MST</p>
          </div>
        </div>

        {/* Active Group Pill */}
        {groupName ? (
          <button
            onClick={onSwitchGroup}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs text-slate-300 transition-colors"
            title="Click to switch or explore other Savings Circles"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Circle:</span>
            <span className="font-semibold text-white">{groupName}</span>
            <span className="text-[10px] text-emerald-400 underline ml-1">Change</span>
          </button>
        ) : (
          <button
            onClick={onSwitchGroup}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
          >
            <span>Explore Circles</span>
          </button>
        )}
      </div>

      {/* Right Controls: Pro Toggle + Account / Actions */}
      <div className="flex items-center gap-3">
        {/* Technical / Blockchain Details Mode Switch (For Evaluators/Judges) */}
        <button
          onClick={onToggleTechnicalMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            isTechnicalMode
              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20"
              : "bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-slate-200"
          }`}
          title="Toggle on-chain contract addresses, EVM parameters, and math formulas"
        >
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Technical Telemetry</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isTechnicalMode ? "bg-indigo-400" : "bg-slate-600"
            }`}
          />
        </button>

        {/* Start a New Circle Button */}
        <button
          onClick={onOpenCreateGroupModal}
          className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          Start a Circle
        </button>

        {/* Account / User Avatar Button */}
        <button
          onClick={onOpenAccountModal}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {account ? account.substring(2, 4).toUpperCase() : "P"}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-white leading-tight">
              {account ? `${account.substring(0, 6)}...` : "Connect Account"}
            </p>
            <p className="text-[10px] text-emerald-400 leading-tight tabular-nums">
              {account ? `${formatINR(balance)} (${parseFloat(balance).toFixed(2)} tMSTC)` : "UPI / BridgeKey"}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};
