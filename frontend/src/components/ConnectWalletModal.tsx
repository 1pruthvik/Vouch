import React, { useState } from "react";
import { X, Wallet, Key, Shield, ArrowRight, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { EIP6963ProviderDetail } from "../types/global";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedProviders: EIP6963ProviderDetail[];
  onConnectExtension: (detail?: EIP6963ProviderDetail) => Promise<boolean>;
  onConnectPrivateKey: (key: string) => Promise<boolean>;
  onOpenGoogleAuth?: () => void;
  onClearError?: () => void;
  error?: string | null;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  detectedProviders,
  onConnectExtension,
  onConnectPrivateKey,
  onOpenGoogleAuth,
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

        {/* Google One-Click Auth Action */}
        {onOpenGoogleAuth && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenGoogleAuth();
            }}
            className="w-full p-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 shadow-lg shadow-white/5 transition-all group"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
              Triggers DigiLocker KYC
            </span>
          </button>
        )}

        <div className="flex items-center gap-2 text-[11px] text-[#5f6578]">
          <div className="flex-1 h-px bg-white/5" />
          <span>or connect Web3 wallet</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-2xl p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <button
            onClick={() => handleTabChange("extension")}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{ background: tab === "extension" ? 'rgba(255,255,255,0.08)' : 'transparent', color: tab === "extension" ? 'white' : '#5f6578' }}
          >
            Browser Extension
          </button>
          <button
            onClick={() => handleTabChange("privateKey")}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{ background: tab === "privateKey" ? 'rgba(255,255,255,0.08)' : 'transparent', color: tab === "privateKey" ? 'white' : '#5f6578' }}
          >
            Private Key
          </button>
        </div>

        {/* Error Notification */}
        {activeError && (
          <div className="v-toast v-toast-error text-xs flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{activeError}</span>
            </div>
            {isExtensionUpdateError && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 font-semibold text-[11px] inline-flex items-center gap-1.5 flex-shrink-0 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Reload Page
              </button>
            )}
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
                  className="w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all duration-200 hover:bg-white/5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-3">
                    {prov.info.icon ? (
                      <img src={prov.info.icon} alt={prov.info.name} className="w-7 h-7 rounded-lg" />
                    ) : (
                      <Shield className="w-7 h-7 text-[#2dd4a8]" />
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
                className="w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all duration-200 hover:bg-white/5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-7 h-7 text-[#2dd4a8]" />
                  <div>
                    <p className="text-sm font-semibold text-white">BridgeKey / Web3 Wallet</p>
                    <p className="text-[11px] text-[#5f6578]">Connect via browser extension</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#5f6578]" />
              </button>
            )}

            <p className="text-xs text-[#5f6578] text-center py-2">
              Extension updated or not responding? Use the <strong className="text-[#9ca3b4] cursor-pointer hover:underline" onClick={() => handleTabChange("privateKey")}>Private Key</strong> tab.
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
                placeholder="0x... (64-character private key)"
                value={privateKey}
                onChange={(e) => {
                  setPrivateKey(e.target.value);
                  if (localError || error) {
                    setLocalError(null);
                    if (onClearError) onClearError();
                  }
                }}
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
              <button type="submit" disabled={isSubmitting || !privateKey.trim()} className="v-btn-primary text-xs">
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
