import React, { useState } from "react";
import { X, Copy, Check, Key, Shield, ArrowRight, AlertCircle } from "lucide-react";
import { formatINR } from "../utils/formatters";
import { EIP6963ProviderDetail } from "../types/global";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: string | null;
  balance: string;
  isCorrectNetwork: boolean;
  detectedProviders?: EIP6963ProviderDetail[];
  onConnectExtension: (detail?: EIP6963ProviderDetail) => Promise<boolean>;
  onConnectPrivateKey: (key: string) => Promise<boolean>;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  account,
  balance,
  detectedProviders = [],
  onConnectExtension,
  onConnectPrivateKey,
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
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const success = await onConnectExtension(prov);
      if (!success) {
        setErrorMsg("No browser extension detected. Connect via Private Key or install BridgeKey.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect extension.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrivateKeyConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey.trim()) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const success = await onConnectPrivateKey(privateKey.trim());
      if (success) {
        setPrivateKey("");
      } else {
        setErrorMsg("Invalid private key format. Please check and retry.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect with private key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#0e0e0e] max-w-lg w-full p-8 rounded-xl relative shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-royal-600 flex items-center justify-center text-white font-bold text-sm">
              {account ? account.substring(2, 4).toUpperCase() : "W"}
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Account Details</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 my-4 text-xs">
          {/* Account Balance & Address (when connected) */}
          {account ? (
            <div className="p-5 rounded-xl bg-black space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 font-medium">Connected Balance</p>
                  <p className="text-2xl font-extrabold text-white font-display mt-0.5">
                    {formatINR(balance)}
                  </p>
                  <p className="text-[11px] font-mono text-royal-400">
                    {parseFloat(balance).toFixed(4)} tMSTC
                  </p>
                </div>
                <span className="badge">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Connected
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-900 flex items-center justify-between gap-2">
                <code className="text-white font-mono text-[11px] truncate">{account}</code>
                <button
                  onClick={() => copyToClipboard(account, "account")}
                  className="p-1 rounded text-neutral-400 hover:text-white transition-colors flex-shrink-0"
                >
                  {copiedKey === "account" ? <Check className="w-3.5 h-3.5 text-royal-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-black text-center">
              <p className="text-sm font-semibold text-white font-display">No Wallet Connected</p>
            </div>
          )}

          {/* Connection Mode Selection */}
          <div className="p-4 rounded-xl bg-black space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">
                {account ? "Switch Connection" : "Connect Wallet"}
              </span>
            </div>

            {/* Tab Pill Switcher */}
            <div className="flex rounded-lg bg-[#141414] p-1">
              <button
                type="button"
                onClick={() => {
                  setConnectTab("extension");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  connectTab === "extension" ? "bg-black text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                BridgeKey / Extension
              </button>
              <button
                type="button"
                onClick={() => {
                  setConnectTab("privateKey");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  connectTab === "privateKey" ? "bg-black text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                Private Key
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-900 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Extension Option */}
            {connectTab === "extension" && (
              <div className="space-y-2 pt-1">
                {detectedProviders.length > 0 ? (
                  detectedProviders.map((prov) => (
                    <button
                      key={prov.info.uuid}
                      type="button"
                      onClick={() => handleExtensionConnect(prov)}
                      disabled={isSubmitting}
                      className="w-full p-3 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] transition-colors flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        {prov.info.icon ? (
                          <img src={prov.info.icon} alt={prov.info.name} className="w-5 h-5 rounded" />
                        ) : (
                          <Shield className="w-5 h-5 text-royal-400" />
                        )}
                        <div>
                          <p className="text-xs font-bold text-white">{prov.info.name}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => handleExtensionConnect()}
                    disabled={isSubmitting}
                    className="w-full p-3 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] transition-colors flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-5 h-5 text-royal-400" />
                      <div>
                        <p className="text-xs font-bold text-white">BridgeKey Extension</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </button>
                )}
              </div>
            )}

            {/* Private Key Option */}
            {connectTab === "privateKey" && (
              <form onSubmit={handlePrivateKeyConnect} className="space-y-3 pt-1">
                <div>
                  <input
                    type="password"
                    placeholder="Enter Private Key (0x...)"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141414] text-white text-xs font-mono focus:outline-none placeholder:text-neutral-700"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !privateKey.trim()}
                  className="btn-primary w-full text-xs"
                >
                  <Key className="w-3.5 h-3.5" />
                  {isSubmitting ? "Connecting..." : "Connect with Private Key"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
