import React from "react";
import { ShieldCheck, Code2, Plus, ArrowUpRight, Compass, Shield } from "lucide-react";
import { formatINR } from "../utils/formatters";

interface HeaderProps {
  account: string | null;
  balance: string;
  isConnecting: boolean;
  groupName?: string;
  isTechnicalMode: boolean;
  activeTab?: string;
  onTabChange?: (tab: any) => void;
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
  activeTab = "home",
  onTabChange,
  onToggleTechnicalMode,
  onOpenAccountModal,
  onOpenCreateGroupModal,
  onSwitchGroup,
}) => {
  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "home", label: "Circle Home" },
    { id: "draw", label: "Monthly Draw" },
    { id: "standing", label: "Trust & Risk" },
    { id: "history", label: "Audit Ledger" },
    { id: "network", label: "3D Network" },
  ];

  return (
    <header className="px-5 sm:px-8 py-4 flex items-center justify-between border-b border-black/[0.05] bg-transparent">
      {/* Brand & Active Circle Pill */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onTabChange && onTabChange("overview")}
          className="flex items-center gap-2 text-left group"
        >
          <div className="w-8 h-8 rounded-full bg-[#E9B949] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 text-[#121316] stroke-[2.5]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#121316] font-display">
            Vouch
          </span>
        </button>

        {groupName && (
          <button
            onClick={onSwitchGroup}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.05] text-[11px] text-[#5F6368] transition-colors"
            title="Change active savings circle"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-[#121316]">{groupName}</span>
            <span className="text-[#8F959E]">· Change</span>
          </button>
        )}
      </div>

      {/* Horizontal Nav Links (Reference Style) */}
      <nav className="hidden lg:flex items-center gap-1 bg-black/[0.03] p-1 rounded-full border border-black/[0.04]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange && onTabChange(item.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? "bg-white text-[#121316] shadow-sm font-semibold"
                  : "text-[#5F6368] hover:text-[#121316]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Pro Telemetry + Start Circle + Account */}
      <div className="flex items-center gap-2.5">
        {/* Technical Telemetry Toggle */}
        <button
          onClick={onToggleTechnicalMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            isTechnicalMode
              ? "bg-[#121316] text-white shadow-sm"
              : "bg-black/[0.03] text-[#5F6368] hover:text-[#121316] hover:bg-black/[0.06]"
          }`}
          title="Toggle on-chain contract addresses and EVM telemetry"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Telemetry</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isTechnicalMode ? "bg-[#E9B949]" : "bg-[#8F959E]"
            }`}
          />
        </button>

        {/* Start Circle */}
        <button
          onClick={onOpenCreateGroupModal}
          className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] hover:bg-[#FAF9F5] text-xs font-medium text-[#121316] shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-[#E9B949]" />
          Launch Circle
        </button>

        {/* Account / Connect Wallet Pill */}
        <button
          onClick={onOpenAccountModal}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121316] text-white hover:bg-[#252830] transition-all text-xs font-medium shadow-sm"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>
            {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "Connect Account"}
          </span>
          {account && (
            <span className="text-[10px] text-white/70 font-mono hidden sm:inline tabular-nums">
              ({parseFloat(balance).toFixed(2)} tMSTC)
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
