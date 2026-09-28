import React from "react";
import { Shield, Wallet, AlertTriangle, CheckCircle } from "lucide-react";
import { MST_TESTNET } from "../config/network";

interface HeaderProps {
  account: string | null;
  balance: string;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  onConnect: () => void;
  onSwitchNetwork: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  balance,
  isConnecting,
  isCorrectNetwork,
  onConnect,
  onSwitchNetwork,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">Vouch</h1>
          <p className="text-xs text-indigo-400 font-medium">Autonomous ROSCA on MST Blockchain</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {account && (
          <div className="hidden sm:flex items-center gap-2">
            {!isCorrectNetwork ? (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Switch to MST Testnet
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                MST Testnet ({MST_TESTNET.chainId})
              </div>
            )}
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-300">
              <span className="text-slate-400">Balance:</span>{" "}
              <span className="font-semibold text-white">{parseFloat(balance).toFixed(4)} tMSTC</span>
            </div>
          </div>
        )}

        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="btn-primary text-sm"
        >
          <Wallet className="w-4 h-4" />
          {account
            ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
            : isConnecting
            ? "Connecting..."
            : "Connect BridgeKey"}
        </button>
      </div>
    </header>
  );
};
