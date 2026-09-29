import React, { useState } from "react";
import { Copy, Check, Shield, ExternalLink, Wallet, LogOut } from "lucide-react";
import { formatINR } from "../utils/formatters";
import { EIP6963ProviderDetail } from "../types/global";
import { MST_TESTNET } from "../config/network";
import { Modal } from "./ui/Modal";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: string | null;
  balance: string;
  isCorrectNetwork?: boolean;
  detectedProviders?: EIP6963ProviderDetail[];
  onConnectExtension?: (detail?: EIP6963ProviderDetail) => Promise<boolean>;
  onConnectPrivateKey?: (key: string) => Promise<boolean>;
  onDisconnect?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  account,
  balance,
  isCorrectNetwork = true,
  onDisconnect,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formattedBalance = balance ? parseFloat(balance).toFixed(4) : "0.0000";
  const inrValue = balance ? Math.round(parseFloat(balance) * 1000) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-white font-display">
          <Wallet className="w-5 h-5 text-red-500" />
          <span>BridgeKey Wallet</span>
        </div>
      }
      description={
        <span className="text-xs text-neutral-400">
          Connected to MST Blockchain Testnet
        </span>
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-5 text-xs">
        {/* Account Details Box */}
        <div className="p-4 bg-neutral-900 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Public Address</span>
            <span className="px-2 py-0.5 rounded bg-green-950/40 text-green-400 text-[10px] font-semibold">
              {isCorrectNetwork ? "Connected" : "Wrong Network"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 p-2.5 bg-black rounded-lg">
            <span className="font-mono text-white text-xs break-all">
              {account || "Not Connected"}
            </span>
            {account && (
              <button
                type="button"
                onClick={() => copyToClipboard(account, "addr")}
                className="p-1 text-neutral-500 hover:text-white bg-transparent border-none cursor-pointer flex-shrink-0"
                title="Copy address"
              >
                {copiedKey === "addr" ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Balance Box */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-neutral-900 rounded-xl space-y-1">
            <span className="text-neutral-400 text-[11px]">Testnet tMSTC</span>
            <p className="text-base font-bold text-white font-display">
              {formattedBalance} tMSTC
            </p>
          </div>
          <div className="p-3 bg-neutral-900 rounded-xl space-y-1">
            <span className="text-neutral-400 text-[11px]">Equivalent Value</span>
            <p className="text-base font-bold text-white font-display">
              {formatINR(inrValue)}
            </p>
          </div>
        </div>

        {/* Network Info */}
        <div className="p-3 bg-black border border-neutral-900 rounded-xl flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>MST Testnet (Chain ID 91562037)</span>
          </div>
          {account && (
            <a
              href={`${MST_TESTNET.explorerUrl}/address/${account}`}
              target="_blank"
              rel="noreferrer"
              className="text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
            >
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold transition-colors border-none cursor-pointer"
          >
            Close
          </button>

          {onDisconnect && (
            <button
              type="button"
              onClick={() => {
                onDisconnect();
                onClose();
              }}
              className="px-4 py-2.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border-none cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
