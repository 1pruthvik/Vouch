import React, { useState } from "react";
import { X, Copy, Check, Key, Shield, ArrowRight, AlertCircle, ExternalLink, Code2 } from "lucide-react";
import { formatINR } from "../utils/formatters";
import { EIP6963ProviderDetail } from "../types/global";
import { MST_TESTNET } from "../config/network";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: string | null;
  balance: string;
  isCorrectNetwork?: boolean;
  isTechnicalMode?: boolean;
  onToggleTechnicalMode?: () => void;
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
  isTechnicalMode,
  onToggleTechnicalMode,
  detectedProviders = [],
  onConnectExtension,
  onConnectPrivateKey,
  onDisconnect,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [connectTab, setConnectTab] = useState<"extension" | "privateKey">("extension");
  const [privateKey, setPrivateKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExtensionConnect = async (prov?: EIP6963ProviderDetail) => {
    if (!onConnectExtension) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const success = await onConnectExtension(prov);
      if (!success) {
        setErrorMsg("No browser extension detected.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrivateKeyConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey.trim() || !onConnectPrivateKey) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const success = await onConnectPrivateKey(privateKey.trim());
      if (success) {
        setPrivateKey("");
      } else {
        setErrorMsg("Failed to connect with private key.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="bg-black max-w-lg w-full p-8 rounded-xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-500">
            <Shield className="w-4 h-4" />
            Wallet & Network Account
          </div>
          <h2 className="text-xl font-bold text-white font-display">
            Account Management
          </h2>
        </div>

        {account ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-neutral-950 space-y-2">
              <span className="text-xs text-neutral-400 font-medium">Connected Address</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-white truncate max-w-[280px]">
                  {account}
                </span>
                <button
                  onClick={() => copyToClipboard(account, "addr")}
                  className="p-1.5 text-neutral-400 hover:text-white"
                >
                  {copiedKey === "addr" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-neutral-950 space-y-1">
              <span className="text-xs text-neutral-400 font-medium">Wallet Balance</span>
              <p className="text-2xl font-bold text-white font-display">
                {formatINR(balance)}
              </p>
              <p className="text-[11px] text-neutral-500 font-mono">
                {balance} tMSTC • MST Testnet (Chain ID 91562037)
              </p>
            </div>

            {onToggleTechnicalMode && (
              <button
                onClick={onToggleTechnicalMode}
                className="w-full py-2.5 px-4 rounded-lg bg-neutral-950 hover:bg-neutral-900 transition-all flex items-center justify-between text-xs font-semibold text-white cursor-pointer border-none"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-red-500" />
                  <span>Technical EVM Telemetry</span>
                </div>
                <span className="text-red-400">{isTechnicalMode ? "Enabled" : "Disabled"}</span>
              </button>
            )}

            {onDisconnect && (
              <button
                onClick={() => {
                  onDisconnect();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                Disconnect Wallet
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-neutral-950 rounded-lg text-xs">
              <button
                onClick={() => setConnectTab("extension")}
                className={`flex-1 py-2 rounded-md font-semibold transition-all ${
                  connectTab === "extension" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                Extension
              </button>
              <button
                onClick={() => setConnectTab("privateKey")}
                className={`flex-1 py-2 rounded-md font-semibold transition-all ${
                  connectTab === "privateKey" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                Private Key
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/20 text-red-400 rounded-lg flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {connectTab === "extension" ? (
              <div className="space-y-2">
                {detectedProviders.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleExtensionConnect(p)}
                    disabled={isSubmitting}
                    className="w-full p-3 rounded-lg bg-neutral-950 hover:bg-neutral-900 text-xs text-white flex items-center justify-between"
                  >
                    <span>{p.info.name}</span>
                    <span className="text-red-400">Connect</span>
                  </button>
                ))}
                {detectedProviders.length === 0 && (
                  <button
                    onClick={() => handleExtensionConnect()}
                    disabled={isSubmitting}
                    className="btn-primary w-full py-3"
                  >
                    Connect Default Provider
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handlePrivateKeyConnect} className="space-y-3 text-xs">
                <input
                  type="password"
                  placeholder="Paste 64-character private key..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="w-full bg-neutral-950 rounded-lg px-4 py-3 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3"
                >
                  Import & Connect
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
