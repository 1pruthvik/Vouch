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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="cred-card max-w-lg w-full p-6 sm:p-7 border-white/10 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {account ? account.substring(2, 4).toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Account & Blockchain Specs</h2>
              <p className="text-xs text-slate-400">Manage connections & inspect on-chain contracts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 my-5 text-xs">
          {/* Account Balance Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12151d] to-[#0d0f14] border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-slate-400 font-medium">Connected Balance</p>
              <p className="text-2xl font-extrabold text-white font-display mt-0.5">
                {formatINR(balance)}
              </p>
              <p className="text-[11px] font-mono text-emerald-400">
                {parseFloat(balance).toFixed(4)} tMSTC
              </p>
            </div>

            <button
              onClick={onOpenConnectModal}
              className="btn-cred-secondary text-xs"
            >
              <Key className="w-3.5 h-3.5" />
              Switch Wallet
            </button>
          </div>

          {/* Connected Address */}
          {account && (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <p className="text-slate-400 font-medium">Your Blockchain Address</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-slate-200 font-mono text-[11px] truncate">{account}</code>
                <button
                  onClick={() => copyToClipboard(account, "account")}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  {copiedKey === "account" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Network Parameters */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> Network Status
              </span>
              <span className="badge badge-status-green">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                MST Testnet Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
              <div>
                <p className="text-slate-500">Chain ID</p>
                <p className="font-mono font-bold text-slate-200">91562037 (0x5752eb5)</p>
              </div>
              <div>
                <p className="text-slate-500">EVM Target</p>
                <p className="font-mono font-bold text-slate-200">Paris (0.8.24)</p>
              </div>
              <div>
                <p className="text-slate-500">RPC Endpoint</p>
                <p className="font-mono text-slate-200 truncate">{MST_TESTNET.rpcUrl}</p>
              </div>
              <div>
                <p className="text-slate-500">Explorer</p>
                <a
                  href={MST_TESTNET.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                >
                  mstscan.com <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Mode Switcher Toggle */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-bold text-white text-xs flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-400" /> Technical Details View (Judges / Developers)
              </p>
              <p className="text-[11px] text-slate-400">
                Reveal raw smart contract addresses, hash states, and protocol formulas on all screens.
              </p>
            </div>
            <button
              onClick={onToggleTechnicalMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isTechnicalMode
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                  : "bg-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {isTechnicalMode ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="btn-cred-secondary text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
