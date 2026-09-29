import React from "react";
import { ShieldCheck, Code2, Plus, Wallet, ShieldAlert, CheckCircle2 } from "lucide-react";
import { formatINR } from "../utils/formatters";
import { GoogleUser } from "./GoogleAuthModal";

interface HeaderProps {
  account: string | null;
  balance: string;
  isConnecting: boolean;
  groupName?: string;
  isTechnicalMode: boolean;
  googleUser?: GoogleUser | null;
  isKycVerified?: boolean;
  onToggleTechnicalMode: () => void;
  onOpenAccountModal: () => void;
  onOpenCreateGroupModal: () => void;
  onOpenGoogleAuth: () => void;
  onOpenDigiLockerModal: () => void;
  onSwitchGroup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  balance,
  isConnecting,
  groupName,
  isTechnicalMode,
  googleUser,
  isKycVerified,
  onToggleTechnicalMode,
  onOpenAccountModal,
  onOpenCreateGroupModal,
  onOpenGoogleAuth,
  onOpenDigiLockerModal,
  onSwitchGroup,
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
          {groupName ? (
            <button
              onClick={onSwitchGroup}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/[0.08] transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              title="Click to switch or view other Savings Circles"
            >
              <span className="w-2 h-2 rounded-full bg-[#2dd4a8] anim-pulse-soft" />
              <span className="text-xs text-[#9ca3b4]">Circle:</span>
              <span className="text-xs font-semibold text-white">{groupName}</span>
              <span className="text-[10px] text-[#2dd4a8] underline ml-1">Change</span>
            </button>
          ) : (
            <button
              onClick={onSwitchGroup}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#9ca3b4] hover:text-white bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
            >
              <span>Explore Circles</span>
            </button>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* DigiLocker KYC Status Pill */}
          <button
            onClick={onOpenDigiLockerModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isKycVerified
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20"
            }`}
            title="DigiLocker Aadhaar e-KYC Verification"
          >
            {isKycVerified ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">DigiLocker Verified</span>
                <span className="sm:hidden">KYC ✓</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Aadhaar KYC</span>
                <span className="sm:hidden">KYC</span>
              </>
            )}
          </button>

          {/* Google Auth Status / Button */}
          {googleUser ? (
            <div
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/5 text-xs text-slate-300"
              title={`Logged in as ${googleUser.email}`}
            >
              <img
                src={googleUser.avatarUrl}
                alt={googleUser.name}
                className="w-5 h-5 rounded-full"
              />
              <span className="font-medium truncate max-w-[100px]">{googleUser.name}</span>
            </div>
          ) : (
            <button
              onClick={onOpenGoogleAuth}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-xs font-semibold text-white transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google Sign-In</span>
            </button>
          )}

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
