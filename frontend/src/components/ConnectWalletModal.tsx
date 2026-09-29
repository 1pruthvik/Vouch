import React, { useState } from "react";
import { Wallet, Key, Shield, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { EIP6963ProviderDetail } from "../types/global";
import { Modal } from "./ui/Modal";

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
    if (!privateKey.trim() || isSubmitting) return;
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Account"
      description="Link your non-custodial MST Testnet wallet"
      icon={<Wallet className="w-5 h-5 text-[#946800]" />}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Tab Toggle */}
        <div className="flex rounded-full p-1 bg-black/[0.04] border border-black/[0.05]">
          <button
            type="button"
            onClick={() => handleTabChange("extension")}
            className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all ${
              tab === "extension"
                ? "bg-white text-[#121316] shadow-sm font-bold"
                : "text-[#5F6368] hover:text-[#121316]"
            }`}
          >
            Browser Extension
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("privateKey")}
            className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all ${
              tab === "privateKey"
                ? "bg-white text-[#121316] shadow-sm font-bold"
                : "text-[#5F6368] hover:text-[#121316]"
            }`}
          >
            Private Key
          </button>
        </div>

        {/* Error Notification */}
        {activeError && (
          <div className="v-toast v-toast-error text-xs flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed text-rose-900">{activeError}</span>
            </div>
            {isExtensionUpdateError && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-[11px] inline-flex items-center gap-1.5 flex-shrink-0 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Reload Page
              </button>
            )}
          </div>
        )}

        {/* Extension Tab */}
        {tab === "extension" && (
          <div className="space-y-2.5">
            {detectedProviders.length > 0 ? (
              detectedProviders.map((prov) => (
                <button
                  key={prov.info.uuid}
                  type="button"
                  onClick={() => handleExtensionClick(prov)}
                  disabled={isSubmitting}
                  className="w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all bg-white border border-black/[0.08] hover:border-black/20 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {prov.info.icon ? (
                      <img src={prov.info.icon} alt={prov.info.name} className="w-7 h-7 rounded-lg" />
                    ) : (
                      <Shield className="w-7 h-7 text-[#E9B949]" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[#121316]">{prov.info.name}</p>
                      <p className="text-[11px] text-[#5F6368]">Detected Wallet</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8F959E]" />
                </button>
              ))
            ) : (
              <button
                type="button"
                onClick={() => handleExtensionClick()}
                disabled={isSubmitting}
                className="w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all bg-white border border-black/[0.08] hover:border-black/20 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-7 h-7 text-[#E9B949]" />
                  <div>
                    <p className="text-sm font-semibold text-[#121316]">BridgeKey / Web3 Wallet</p>
                    <p className="text-[11px] text-[#5F6368]">Connect via browser extension</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8F959E]" />
              </button>
            )}

            <p className="text-xs text-[#5F6368] text-center pt-2">
              Extension not responding? Use the{" "}
              <button
                type="button"
                className="text-[#121316] font-semibold underline underline-offset-2"
                onClick={() => handleTabChange("privateKey")}
              >
                Private Key
              </button>{" "}
              tab.
            </p>
          </div>
        )}

        {/* Private Key Tab */}
        {tab === "privateKey" && (
          <form onSubmit={handlePrivateKeySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5F6368] mb-1.5">
                MST Testnet Private Key
              </label>
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
                autoFocus
              />
              <p className="text-[11px] text-[#8F959E] mt-1.5">
                Key stays in your browser memory only. Never transmitted to any server.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-pill-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !privateKey.trim()}
                className="btn-pill-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                {isSubmitting ? "Connecting..." : "Connect Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
