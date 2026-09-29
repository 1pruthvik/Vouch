import React, { useState } from "react";
import { X, Wallet, Copy, Check, ExternalLink, ShieldCheck, Key, RefreshCw, Code2, Globe } from "lucide-react";
import { formatINR } from "../utils/formatters";
import { MST_TESTNET, CONTRACT_ADDRESSES } from "../config/network";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: string | null;
  balance: string;
  isCorrectNetwork: boolean;
  onSwitchNetwork: () => void;
  onOpenConnectModal: () => void;
  isTechnicalMode: boolean;
  onToggleTechnicalMode: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  account,
  balance,
  isCorrectNetwork,
  onSwitchNetwork,
  onOpenConnectModal,
  isTechnicalMode,
  onToggleTechnicalMode,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="v-overlay">
      <div className="v-modal p-6 sm:p-7 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #f5a623 0%, #e88d10 100%)' }}>
              {account ? account.substring(2, 4).toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Account Settings</h2>
              <p className="text-xs text-[#5f6578]">Manage wallet & network</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#5f6578] hover:text-white hover:bg-white/5 transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mt-5 text-xs">
          {/* Balance Card */}
          <div className="p-5 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <p className="text-[#5f6578] font-medium">Connected Balance</p>
              <p className="text-2xl font-bold text-white font-display mt-1">
                {formatINR(balance)}
              </p>
              <p className="text-[11px] font-mono mt-0.5" style={{ color: '#2dd4a8' }}>
                {parseFloat(balance).toFixed(4)} tMSTC
              </p>
            </div>
            <button onClick={onOpenConnectModal} className="v-btn-secondary text-xs">
              <Key className="w-3.5 h-3.5" />
              Switch
            </button>
          </div>

          {/* Address */}
          {account && (
            <div className="p-4 rounded-2xl space-y-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[#5f6578] font-medium">Blockchain Address</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-[#9ca3b4] font-mono text-[11px] truncate">{account}</code>
                <button
                  onClick={() => copyToClipboard(account, "account")}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#5f6578] hover:text-white transition-all duration-200"
                >
                  {copiedKey === "account" ? <Check className="w-3.5 h-3.5 text-[#2dd4a8]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Network */}
          <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#2dd4a8]" />
                Network
              </span>
              <span className="v-badge v-badge-green">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4a8]" />
                MST Testnet
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
              <div>
                <p className="text-[#5f6578]">Chain ID</p>
                <p className="font-mono font-semibold text-[#9ca3b4]">91562037</p>
              </div>
              <div>
                <p className="text-[#5f6578]">EVM Target</p>
                <p className="font-mono font-semibold text-[#9ca3b4]">Paris (0.8.24)</p>
              </div>
              <div>
                <p className="text-[#5f6578]">RPC</p>
                <p className="font-mono text-[#9ca3b4] truncate">{MST_TESTNET.rpcUrl}</p>
              </div>
              <div>
                <p className="text-[#5f6578]">Explorer</p>
                <a
                  href={MST_TESTNET.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono inline-flex items-center gap-1 transition-colors duration-200"
                  style={{ color: '#2dd4a8' }}
                >
                  mstscan.com <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Tech Mode Toggle */}
          <div className="p-4 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.12)' }}>
            <div className="space-y-0.5">
              <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#8b5cf6]" />
                Technical Details View
              </p>
              <p className="text-[11px] text-[#5f6578]">
                Show contract addresses, hash states, and protocol formulas.
              </p>
            </div>
            <button
              onClick={onToggleTechnicalMode}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: isTechnicalMode ? '#8b5cf6' : 'rgba(255,255,255,0.08)',
                color: isTechnicalMode ? 'white' : '#5f6578',
                boxShadow: isTechnicalMode ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
              }}
            >
              {isTechnicalMode ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-5 flex justify-end">
          <button onClick={onClose} className="v-btn-secondary text-xs">Close</button>
        </div>
      </div>
    </div>
  );
};
