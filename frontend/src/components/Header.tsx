import React, { useState, useEffect, useRef } from "react";
import { Code2, Plus, Shield, Menu, X, ChevronRight } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "home", label: "Circle Home" },
    { id: "draw", label: "Monthly Draw" },
    { id: "standing", label: "Trust & Risk" },
    { id: "history", label: "Audit Ledger" },
    { id: "network", label: "3D Network" },
  ];

  // Close mobile menu on ESC key or route/tab change
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavClick = (tabId: string) => {
    if (onTabChange) onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="relative px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between border-b border-black/[0.05] bg-transparent">
      {/* Brand & Active Circle Pill */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => handleNavClick("overview")}
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
            type="button"
            onClick={onSwitchGroup}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.05] text-[11px] text-[#5F6368] transition-colors"
            title="Change active savings circle"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
            <span className="font-medium text-[#121316] truncate max-w-[140px]">{groupName}</span>
            <span className="text-[#8F959E]">· Change</span>
          </button>
        )}
      </div>

      {/* Horizontal Nav Links (Desktop) */}
      <nav className="hidden lg:flex items-center gap-1 bg-black/[0.03] p-1 rounded-full border border-black/[0.04]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
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

      {/* Right Controls: Pro Telemetry + Start Circle + Account + Mobile Toggle */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Technical Telemetry Toggle */}
        <button
          type="button"
          onClick={onToggleTechnicalMode}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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
          type="button"
          onClick={onOpenCreateGroupModal}
          className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] hover:bg-[#FAF9F5] text-xs font-medium text-[#121316] shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-[#946800]" />
          Launch Circle
        </button>

        {/* Account / Connect Wallet Pill */}
        <button
          type="button"
          onClick={onOpenAccountModal}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#121316] text-white hover:bg-[#252830] transition-all text-xs font-medium shadow-sm"
        >
          <div className="w-2 h-2 rounded-full bg-[#34A853]" />
          <span>
            {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "Connect"}
          </span>
          {account && (
            <span className="text-[10px] text-white/70 font-mono hidden sm:inline tabular-nums">
              ({parseFloat(balance || "0").toFixed(2)} tMSTC)
            </span>
          )}
        </button>

        {/* Mobile Navigation Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#121316] transition-colors"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute top-full left-0 right-0 z-40 bg-[#FAF9F5] border-b border-black/[0.08] shadow-xl p-4 space-y-2 lg:hidden anim-fade-in"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    isActive
                      ? "bg-white text-[#121316] font-bold shadow-sm border border-black/[0.05]"
                      : "text-[#5F6368] hover:bg-black/[0.03] hover:text-[#121316]"
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8F959E]" />
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-black/[0.06] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenCreateGroupModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-black/[0.08] text-xs font-semibold text-[#121316] shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#946800]" />
              Launch New Circle
            </button>
            {groupName && onSwitchGroup && (
              <button
                type="button"
                onClick={() => {
                  onSwitchGroup();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl text-center text-[11px] text-[#5F6368] bg-black/[0.03]"
              >
                Active Circle: <span className="font-semibold text-[#121316]">{groupName}</span> (Switch)
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
