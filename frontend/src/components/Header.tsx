import React from "react";
import { ShieldCheck, Code2, Plus, Wallet, Sparkles, UserCheck, Grid } from "lucide-react";
import { formatINR } from "../utils/formatters";

interface HeaderProps {
  account: string | null;
  balance: string;
  isConnecting: boolean;
  groupName?: string;
  userName?: string;
  isTechnicalMode: boolean;
  onToggleTechnicalMode: () => void;
  onOpenAccountModal: () => void;
  onOpenCreateGroupModal: () => void;
  onReturnToHub?: () => void;
  onSwitchGroup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  balance,
  isConnecting,
  groupName,
  userName,
  isTechnicalMode,
  onToggleTechnicalMode,
  onOpenAccountModal,
  onOpenCreateGroupModal,
  onReturnToHub,
  onSwitchGroup,
}) => {
  return (
    <header
      className="sticky top-0 z-40 border-b border-white/[0.08] px-4 sm:px-8 py-3"
      style={{
        background: "rgba(6, 8, 15, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Hub Link */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={onReturnToHub}
            className="flex items-center gap-3 group text-left transition-transform active:scale-95"
            title="Return to Hub Selection"
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%)",
                boxShadow: "0 0 20px rgba(0, 245, 160, 0.35)",
              }}
            >
              <ShieldCheck className="w-5 h-5 text-[#06080F] stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold tracking-tight text-white font-display">
                  Vouch
                </h1>
                <span className="v-badge v-badge-emerald text-[9px] px-1.5 py-0.5">
                  MST
                </span>
              </div>
              <p className="text-[10px] text-[#7A889B] font-medium -mt-0.5">
                Chit Fund Protocol
              </p>
            </div>
          </button>

          {/* Active Chain / Circle Switcher */}
          {groupName ? (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={onSwitchGroup}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer"
                style={{
                  background: "rgba(13, 19, 31, 0.7)",
                  border: "1px solid rgba(0, 245, 160, 0.2)",
                }}
                title="Switch Community Chain"
              >
                <span className="w-2 h-2 rounded-full bg-[#00F5A0] anim-pulse-soft" />
                <span className="text-xs text-[#7A889B]">Chain:</span>
                <span className="text-xs font-semibold text-white">{groupName}</span>
                <span className="text-[10px] text-[#00F5A0] underline ml-1">Switch</span>
              </button>

              {onReturnToHub && (
                <button
                  onClick={onReturnToHub}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#7A889B] hover:text-[#00D9F5] bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                  title="Return to 2-Option Hub"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Hub Screen</span>
                </button>
              )}
            </div>
          ) : (
            onReturnToHub && (
              <button
                onClick={onReturnToHub}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#7A889B] hover:text-white bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Hub Screen</span>
              </button>
            )
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Verified KYC Tag */}
          {userName && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
              style={{
                background: "rgba(0, 245, 160, 0.08)",
                border: "1px solid rgba(0, 245, 160, 0.25)",
              }}
            >
              <UserCheck className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span className="text-[#E6EDF3] font-medium">{userName}</span>
              <span className="text-[10px] text-[#00F5A0] font-semibold">✓ KYC</span>
            </div>
          )}

          {/* Technical Mode Toggle */}
          <button
            onClick={onToggleTechnicalMode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
            style={{
              background: isTechnicalMode ? "rgba(121, 40, 202, 0.15)" : "rgba(255,255,255,0.04)",
              color: isTechnicalMode ? "#A78BFA" : "#7A889B",
              border: `1px solid ${isTechnicalMode ? "rgba(121, 40, 202, 0.4)" : "rgba(255,255,255,0.08)"}`,
            }}
            title="Toggle on-chain contract addresses, EVM parameters, and math formulas"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tech View</span>
            <span
              className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{ background: isTechnicalMode ? "#A78BFA" : "#7A889B" }}
            />
          </button>

          {/* Create Chain Button */}
          <button
            onClick={onOpenCreateGroupModal}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200"
            style={{
              background: "rgba(0, 245, 160, 0.08)",
              border: "1px solid rgba(0, 245, 160, 0.25)",
              color: "#00F5A0",
            }}
          >
            <Plus className="w-3.5 h-3.5 text-[#00F5A0]" />
            Create Chain
          </button>

          {/* Account Button */}
          <button
            onClick={onOpenAccountModal}
            disabled={isConnecting}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl transition-all duration-200 hover:border-white/20"
            style={{
              background: "rgba(13, 19, 31, 0.8)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, #FFB800 0%, #E88D10 100%)",
              }}
            >
              {account ? account.substring(2, 4).toUpperCase() : <Wallet className="w-3.5 h-3.5 text-[#06080F]" />}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight font-mono">
                {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : isConnecting ? "Connecting..." : "Connect"}
              </p>
              <p className="text-[10px] leading-tight font-mono text-[#00F5A0]">
                {account ? `${formatINR(balance)}` : "UPI / Wallet"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

