import React, { useState } from "react";
import { Wallet, Key, AlertCircle, RefreshCw, Cpu, Radio, Copy, Check, Eye, EyeOff } from "lucide-react";
import { EIP6963ProviderDetail } from "../types/global";
import { ethers } from "ethers";
import { Modal } from "./ui/Modal";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedProviders: EIP6963ProviderDetail[];
  onConnectExtension: (detail?: EIP6963ProviderDetail) => Promise<boolean>;
  onConnectPrivateKey?: (key: string) => Promise<boolean>;
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
  const [tab, setTab] = useState<"extension" | "generate" | "import">("extension");
  const [privateKey, setPrivateKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Key Generator State
  const [generatedWallet, setGeneratedWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTabChange = (newTab: "extension" | "generate" | "import") => {
    setTab(newTab);
    setLocalError(null);
    if (onClearError) onClearError();
    if (newTab === "generate" && !generatedWallet) {
      const randomWallet = ethers.Wallet.createRandom();
      setGeneratedWallet({
        address: randomWallet.address,
        privateKey: randomWallet.privateKey,
      });
    }
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
        setLocalError("No browser wallet detected. Install BridgeKey extension or generate a keypair.");
      }
    }
  };

  const handleGenerateKeypair = () => {
    const randomWallet = ethers.Wallet.createRandom();
    setGeneratedWallet({
      address: randomWallet.address,
      privateKey: randomWallet.privateKey,
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleActivateGenerated = async () => {
    if (!generatedWallet || !onConnectPrivateKey) return;
    setIsSubmitting(true);
    const success = await onConnectPrivateKey(generatedWallet.privateKey);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const handlePrivateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey.trim() || !onConnectPrivateKey) return;
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-white font-display">
          <Wallet className="w-5 h-5 text-red-500" />
          <span>Connect BridgeKey Wallet</span>
        </div>
      }
      description={
        <span className="text-xs text-neutral-400">
          Link or generate your MST Testnet wallet to access your savings circles.
        </span>
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        {/* Tab Toggle */}
        <div className="flex gap-2 p-1 bg-neutral-900 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => handleTabChange("extension")}
            className={`flex-1 py-2 rounded-md font-semibold transition-all border-none cursor-pointer ${
              tab === "extension" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white bg-transparent"
            }`}
          >
            Extension
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("generate")}
            className={`flex-1 py-2 rounded-md font-semibold transition-all border-none cursor-pointer ${
              tab === "generate" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white bg-transparent"
            }`}
          >
            Generate Key & RPC
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("import")}
            className={`flex-1 py-2 rounded-md font-semibold transition-all border-none cursor-pointer ${
              tab === "import" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white bg-transparent"
            }`}
          >
            Import Key
          </button>
        </div>

        {tab === "extension" ? (
          <div className="space-y-3">
            {detectedProviders && detectedProviders.length > 0 ? (
              <div className="space-y-2">
                {detectedProviders.map((p, idx) => (
                  <button
                    key={p.info.uuid || idx}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleExtensionClick(p)}
                    className="btn-primary w-full py-3 px-4 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {p.info.icon ? (
                        <img src={p.info.icon} alt="" className="w-4 h-4 rounded-full" />
                      ) : (
                        <Wallet className="w-4 h-4" />
                      )}
                      <span>{p.info.name}</span>
                    </div>
                    <span className="text-[11px] font-bold">
                      {isSubmitting ? "Connecting..." : "Connect"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleExtensionClick()}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>{isSubmitting ? "Connecting to Extension..." : "Connect Browser Extension"}</span>
              </button>
            )}
          </div>
        ) : tab === "generate" ? (
          /* Generate Key & Initiate RPC */
          <div className="p-3.5 bg-neutral-900 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-red-500" />
                <span>BridgeKey Public/Private Keypair</span>
              </h4>
              <button
                type="button"
                onClick={handleGenerateKeypair}
                className="p-1 text-neutral-400 hover:text-white bg-transparent border-none cursor-pointer"
                title="Generate New Keypair"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {generatedWallet && (
              <div className="space-y-2.5">
                <div className="p-2.5 bg-black rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                    <span>Public Key (Invites sent here)</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedWallet.address, "pub")}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    >
                      {copiedKey === "pub" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === "pub" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="font-mono text-white text-[11px] break-all font-semibold">
                    {generatedWallet.address}
                  </p>
                </div>

                <div className="p-2.5 bg-black rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                    <span>Private Key</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="text-neutral-400 hover:text-white bg-transparent border-none cursor-pointer flex items-center gap-1 text-[10px]"
                      >
                        {showPrivateKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPrivateKey ? "Hide" : "Show"}</span>
                      </button>
                    </div>
                  </div>
                  <p className="font-mono text-white text-[10px] break-all">
                    {showPrivateKey ? generatedWallet.privateKey : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleActivateGenerated}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
                >
                  <Radio className="w-4 h-4" />
                  <span>{isSubmitting ? "Activating RPC..." : "Initiate RPC & Activate Session"}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Import Key */
          <form onSubmit={handlePrivateKeySubmit} className="space-y-3">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Paste Private Key</label>
              <input
                type="password"
                required
                placeholder="0x..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !privateKey.trim()}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              <span>{isSubmitting ? "Connecting to RPC..." : "Import & Connect"}</span>
            </button>
          </form>
        )}

        {/* Error Alert */}
        {activeError && (
          <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl flex items-center gap-2.5 text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{activeError}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
