import React from "react";
import { ShieldCheck, Code2, Plus, Wallet } from "lucide-react";
import { formatINR } from "../utils/formatters";

interface HeaderProps {
  account: string | null;
  balance: string;
  isConnecting: boolean;
  groupName?: string;
  isTechnicalMode: boolean;
  onToggleTechnicalMode: () => void;
  onOpenAccountModal: () => void;
  onOpenCreateGroupModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  balance,
  isConnecting,
  groupName,
  isTechnicalMode,
  onToggleTechnicalMode,
  onOpenAccountModal,
  onOpenCreateGroupModal,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] px-5 sm:px-8 py-3" style={{ background: 'rgba(15, 17, 23, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2dd4a8 0%, #1aab87 100%)' }}>
              <ShieldCheck className="w-5 h-5 text-[#0f1117] stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white font-display">
                Vouch
              </h1>
              <p className="text-[11px] text-[#9ca3b4] font-medium -mt-0.5">
                Community Savings
              </p>
            </div>
          </div>

          {/* Active Group */}
          {groupName && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="w-2 h-2 rounded-full bg-[#2dd4a8] anim-pulse-soft" />
              <span className="text-xs text-[#9ca3b4]">Circle:</span>
              <span className="text-xs font-semibold text-white">{groupName}</span>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Technical Mode Toggle */}
          <button
            onClick={onToggleTechnicalMode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
            style={{
              background: isTechnicalMode ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255,255,255,0.04)',
              color: isTechnicalMode ? '#8b5cf6' : '#5f6578',
              border: `1px solid ${isTechnicalMode ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.06)'}`,
            }}
            title="Toggle on-chain contract addresses, EVM parameters, and math formulas"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tech View</span>
            <span
              className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{ background: isTechnicalMode ? '#8b5cf6' : '#5f6578' }}
            />
          </button>

          {/* Start a Circle */}
          <button
            onClick={onOpenCreateGroupModal}
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f5' }}
          >
            <Plus className="w-3.5 h-3.5 text-[#2dd4a8]" />
            Start Circle
          </button>

          {/* Account */}
          <button
            onClick={onOpenAccountModal}
            disabled={isConnecting}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #f5a623 0%, #e88d10 100%)' }}>
              {account ? account.substring(2, 4).toUpperCase() : <Wallet className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : isConnecting ? "Connecting..." : "Connect"}
              </p>
              <p className="text-[10px] leading-tight" style={{ color: '#2dd4a8' }}>
                {account ? `${formatINR(balance)}` : "UPI / Wallet"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
