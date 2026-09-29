import React, { useState } from "react";
import { X, Wallet, Key, Shield, ArrowRight, AlertCircle } from "lucide-react";
import { EIP6963ProviderDetail } from "../types/global";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedProviders: EIP6963ProviderDetail[];
  onConnectExtension: (detail?: EIP6963ProviderDetail) => Promise<boolean>;
  onConnectPrivateKey: (key: string) => Promise<boolean>;
  error?: string | null;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  detectedProviders,
  onConnectExtension,
  onConnectPrivateKey,
  error,
}) => {
  const [tab, setTab] = useState<"extension" | "privateKey">("extension");
  const [privateKey, setPrivateKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExtensionClick = async (detail?: EIP6963ProviderDetail) => {
    setLocalError(null);
    setIsSubmitting(true);
    const success = await onConnectExtension(detail);
    setIsSubmitting(false);
    if (success) {
      onClose();
    } else {
      setLocalError(
        "No browser wallet detected. Install BridgeKey extension or use the Private Key tab below."
      );
    }
  };

  const handlePrivateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey.trim()) return;
    setLocalError(null);
    setIsSubmitting(true);
    const success = await onConnectPrivateKey(privateKey.trim());
    setIsSubmitting(false);
    if (success) {
      setPrivateKey("");
      onClose();
    } else {
      setLocalError("Failed to connect. Please check your private key format.");
    }
  };

  return (
    <div className="v-overlay">
      <div className="v-modal p-7 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(45, 212, 168, 0.1)' }}>
              <Wallet className="w-5 h-5 text-[#2dd4a8]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Connect Account</h2>
              <p className="text-xs text-[#5f6578]">Link your MST Testnet wallet</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#5f6578] hover:text-white hover:bg-white/5 transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-2xl p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <button
            onClick={() => { setTab("extension"); setLocalError(null); }}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{ background: tab === "extension" ? 'rgba(255,255,255,0.08)' : 'transparent', color: tab === "extension" ? 'white' : '#5f6578' }}
          >
            Browser Extension
          </button>
          <button
            onClick={() => { setTab("privateKey"); setLocalError(null); }}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{ background: tab === "privateKey" ? 'rgba(255,255,255,0.08)' : 'transparent', color: tab === "privateKey" ? 'white' : '#5f6578' }}
          >
            Private Key
          </button>
        </div>

        {/* Error */}
        {(localError || error) && (
          <div className="v-toast v-toast-error text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{localError || error}</span>
            </div>
          </div>
        )}

        {/* Extension Tab */}
        {tab === "extension" && (
          <div className="space-y-3">
            {detectedProviders.length > 0 ? (
              detectedProviders.map((prov) => (
                <button
                  key={prov.info.uuid}
                  onClick={() => handleExtensionClick(prov)}
                  disabled={isSubmitting}
                  className="w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-3">
                    {prov.info.icon ? (
                      <img src={prov.info.icon} alt={prov.info.name} className="w-7 h-7 rounded-lg" />
                    ) : (
                      <Shield className="w-7 h-7 text-[#9ca3b4]" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">{prov.info.name}</p>
                      <p className="text-[11px] text-[#5f6578]">Detected Wallet</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#5f6578]" />
                </button>
              ))
            ) : (
              <button
                onClick={() => handleExtensionClick()}
                disabled={isSubmitting}
                className="w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-7 h-7 text-[#9ca3b4]" />
                  <div>
                    <p className="text-sm font-semibold text-white">BridgeKey / Web3 Wallet</p>
                    <p className="text-[11px] text-[#5f6578]">Connect via browser extension</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#5f6578]" />
              </button>
            )}

            <p className="text-xs text-[#5f6578] text-center py-2">
              Wallet not appearing? Switch to the <strong className="text-[#9ca3b4]">Private Key</strong> tab.
            </p>
          </div>
        )}

        {/* Private Key Tab */}
        {tab === "privateKey" && (
          <form onSubmit={handlePrivateKeySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9ca3b4] mb-2">MST Testnet Private Key</label>
              <input
                type="password"
                placeholder="0x..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="v-input font-mono text-xs"
                required
              />
              <p className="text-[11px] text-[#5f6578] mt-1.5">
                Key stays in your browser memory only. Never sent to any server.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="v-btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="v-btn-primary text-xs">
                <Key className="w-4 h-4" />
                {isSubmitting ? "Connecting..." : "Connect"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
