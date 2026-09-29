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
    <header className="sticky top-0 z-50 bg-black border-b border-neutral-900 px-6 sm:px-10 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-royal-600 text-white flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">Vouch</h1>
          <p className="text-xs text-neutral-400 font-medium">Autonomous ROSCA on MST Blockchain</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {account && (
          <div className="hidden sm:flex items-center gap-3">
            {!isCorrectNetwork ? (
              <button
                onClick={onSwitchNetwork}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-amber-400 text-xs font-semibold hover:bg-neutral-800 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Switch to MST Testnet
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-neutral-300 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-neutral-400" />
                MST Testnet ({MST_TESTNET.chainId})
              </div>
            )}
            <div className="px-3 py-1.5 rounded-lg bg-neutral-900 text-xs text-neutral-300">
              <span className="text-neutral-500">Balance:</span>{" "}
              <span className="font-semibold text-white">{parseFloat(balance || "0").toFixed(4)} tMSTC</span>
            </div>
          </div>
        )}

        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="btn-primary"
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
