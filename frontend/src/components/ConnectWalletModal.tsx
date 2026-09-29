import React, { useState } from "react";
import { X, Wallet, Key, AlertCircle, RefreshCw } from "lucide-react";
import { EIP6963ProviderDetail } from "../types/global";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedProviders: EIP6963ProviderDetail[];
  onConnectExtension: (detail?: EIP6963ProviderDetail) => Promise<boolean>;
  onConnectPrivateKey: (key: string) => Promise<boolean>;
  onClearError?: () => void;
  error?: string | null;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  detectedProviders,
  onConnectExtension,
  onConnectPrivateKey,
  onClearError,
  error,
}) => {
  const [tab, setTab] = useState<"extension" | "privateKey">("extension");
  const [privateKey, setPrivateKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTabChange = (newTab: "extension" | "privateKey") => {
    setTab(newTab);
    setLocalError(null);
    if (onClearError) onClearError();
  };

  const handleExtensionClick = async (detail?: EIP6963ProviderDetail) => {
    setLocalError(null);
    if (onClearError) onClearError();
    setIsSubmitting(true);
    const success = await onConnectExtension(detail);
    setIsSubmitting(false);
    if (success) {
      onClose();
    } else {
      if (!error) {
        setLocalError(
          "No browser wallet detected. Install BridgeKey extension or connect via Private Key."
        );
      }
    }
  };

  const handlePrivateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey.trim()) return;
    setLocalError(null);
    if (onClearError) onClearError();
    setIsSubmitting(true);
    const success = await onConnectPrivateKey(privateKey.trim());
    setIsSubmitting(false);
    if (success) {
      setPrivateKey("");
      onClose();
    }
  };

  const activeError = localError || error;
  const isExtensionUpdateError = activeError?.toLowerCase().includes("refresh");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="bg-black max-w-md w-full p-8 rounded-xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-500">
            <Wallet className="w-4 h-4" />
            Wallet Connection
          </div>
          <h2 className="text-xl font-bold text-white font-display">
            Connect Account
          </h2>
          <p className="text-xs text-neutral-400">
            Link your MST Testnet wallet to access your savings circles.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 p-1 bg-neutral-950 rounded-lg text-xs">
          <button
            onClick={() => handleTabChange("extension")}
            className={`flex-1 py-2 rounded-md font-semibold transition-all ${
              tab === "extension" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            Browser Extension
          </button>
          <button
            onClick={() => handleTabChange("privateKey")}
            className={`flex-1 py-2 rounded-md font-semibold transition-all ${
              tab === "privateKey" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            Private Key
          </button>
        </div>

        {activeError && (
          <div className="p-3 bg-red-950/20 text-red-400 rounded-lg flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{activeError}</p>
              {isExtensionUpdateError && (
                <button
                  onClick={() => window.location.reload()}
                  className="mt-1 flex items-center gap-1.5 text-[11px] underline font-semibold text-red-300 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reload Page Now
                </button>
              )}
            </div>
          </div>
        )}

        {tab === "extension" ? (
          <div className="space-y-3">
            {detectedProviders.length > 0 ? (
              detectedProviders.map((prov, i) => (
                <button
                  key={i}
                  onClick={() => handleExtensionClick(prov)}
                  disabled={isSubmitting}
                  className="w-full p-4 rounded-lg bg-neutral-950 hover:bg-neutral-900 transition-all flex items-center justify-between text-xs text-left"
                >
                  <div className="flex items-center gap-3">
                    {prov.info.icon ? (
                      <img src={prov.info.icon} alt="" className="w-6 h-6 rounded" />
                    ) : (
                      <Wallet className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-bold text-white">{prov.info.name}</p>
                      <p className="text-[11px] text-neutral-400">EIP-6963 Wallet</p>
                    </div>
                  </div>
                  <span className="text-red-400 font-semibold">Connect</span>
                </button>
              ))
            ) : (
              <button
                onClick={() => handleExtensionClick()}
                disabled={isSubmitting}
                className="btn-primary w-full py-3"
              >
                {isSubmitting ? "Connecting Extension..." : "Connect Default Wallet"}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handlePrivateKeySubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-red-500" />
                Private Key (Hex)
              </label>
              <input
                type="password"
                required
                placeholder="64-character hex key (0x...)"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full bg-neutral-950 rounded-lg px-4 py-3 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3"
            >
              {isSubmitting ? "Importing..." : "Connect with Key"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
