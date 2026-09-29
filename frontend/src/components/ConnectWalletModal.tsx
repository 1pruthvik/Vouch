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
        "No browser wallet extension detected. Please install BridgeKey extension or connect with Private Key below."
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
      setLocalError("Failed to connect with private key. Ensure valid format.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#0e0e0e] max-w-md w-full p-8 rounded-xl relative shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-neutral-300" />
            <h2 className="text-lg font-bold text-white font-display">Connect to MST Testnet</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-lg bg-black p-1">
          <button
            onClick={() => {
              setTab("extension");
              setLocalError(null);
            }}
            className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
              tab === "extension" ? "bg-[#181818] text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            Browser Extension
          </button>
          <button
            onClick={() => {
              setTab("privateKey");
              setLocalError(null);
            }}
            className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
              tab === "privateKey" ? "bg-[#181818] text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            Private Key (Direct)
          </button>
        </div>

        {(localError || error) && (
          <div className="p-3 rounded-lg bg-black text-xs text-royal-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-royal-400 mt-0.5 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {tab === "extension" && (
          <div className="space-y-3">
            {detectedProviders.length > 0 ? (
              detectedProviders.map((prov) => (
                <button
                  key={prov.info.uuid}
                  onClick={() => handleExtensionClick(prov)}
                  disabled={isSubmitting}
                  className="w-full p-4 rounded-xl bg-black hover:bg-[#181818] transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    {prov.info.icon ? (
                      <img src={prov.info.icon} alt={prov.info.name} className="w-6 h-6 rounded" />
                    ) : (
                      <Shield className="w-6 h-6 text-neutral-300" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-white">{prov.info.name}</p>
                      <p className="text-xs text-neutral-400">EIP-6963 Injected</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-500" />
                </button>
              ))
            ) : (
              <button
                onClick={() => handleExtensionClick()}
                disabled={isSubmitting}
                className="w-full p-4 rounded-xl bg-black hover:bg-[#181818] transition-colors flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-neutral-300" />
                  <div>
                    <p className="text-sm font-bold text-white">BridgeKey / Web3 Extension</p>
                    <p className="text-xs text-neutral-400">Connect via standard browser wallet</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500" />
              </button>
            )}

            <div className="p-4 rounded-lg bg-black text-xs text-neutral-400 text-center">
              If your wallet is not appearing, switch to the <strong>Private Key</strong> tab to connect your testnet account directly.
            </div>
          </div>
        )}

        {tab === "privateKey" && (
          <form onSubmit={handlePrivateKeySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                MST Testnet Private Key
              </label>
              <input
                type="password"
                placeholder="0x..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-black text-white text-xs font-mono focus:outline-none"
                required
              />
              <p className="text-xs text-neutral-400 mt-1">
                Key is only kept in local browser memory and connected directly to MST Testnet RPC.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
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
