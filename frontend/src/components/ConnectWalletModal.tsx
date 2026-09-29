import React, { useState } from "react";
import { Wallet, Key, Shield, ArrowRight, AlertCircle, RefreshCw, Sparkles, CheckCircle2, Zap, Copy, Check } from "lucide-react";
import { ethers } from "ethers";
import { EIP6963ProviderDetail } from "../types/global";
import { Modal } from "./ui/Modal";
import { MST_TESTNET } from "../config/network";

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
  const [tab, setTab] = useState<"bridgekey" | "extension" | "privateKey">("bridgekey");
  const [privateKey, setPrivateKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Generated BridgeKey State
  const [generatedWallet, setGeneratedWallet] = useState<{
    address: string;
    privateKey: string;
    publicKey: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleTabChange = (newTab: "bridgekey" | "extension" | "privateKey") => {
    setTab(newTab);
    setLocalError(null);
    if (onClearError) onClearError();
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateBridgekey = () => {
    try {
      const freshWallet = ethers.Wallet.createRandom();
      setGeneratedWallet({
        address: freshWallet.address,
        privateKey: freshWallet.privateKey,
        publicKey: freshWallet.signingKey.publicKey,
      });
      setLocalError(null);
    } catch (e: any) {
      setLocalError("Failed to generate keypair: " + e.message);
    }
  };

  const handleConnectGeneratedBridgekey = async () => {
    if (!generatedWallet) return;
    setIsSubmitting(true);
    setLocalError(null);
    const success = await onConnectPrivateKey(generatedWallet.privateKey);
    setIsSubmitting(false);
    if (success) {
      onClose();
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
        setLocalError(
          "No browser wallet detected. Install BridgeKey extension or generate a keypair directly."
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
      title="Bridgekey Wallet & Account"
      description="Create public/private key, initiate RPC node & activate MST Blockchain"
      icon={<Shield className="w-5 h-5 text-[#946800]" />}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        {/* Tab Toggle */}
        <div className="flex rounded-full p-1 bg-black/[0.04] border border-black/[0.05]">
          <button
            type="button"
            onClick={() => handleTabChange("bridgekey")}
            className={`flex-1 py-2 rounded-full text-[11px] font-semibold transition-all ${
              tab === "bridgekey"
                ? "bg-[#121316] text-white shadow-sm font-bold"
                : "text-[#5F6368] hover:text-[#121316]"
            }`}
          >
            Bridgekey Keypair
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("extension")}
            className={`flex-1 py-2 rounded-full text-[11px] font-semibold transition-all ${
              tab === "extension"
                ? "bg-[#121316] text-white shadow-sm font-bold"
                : "text-[#5F6368] hover:text-[#121316]"
            }`}
          >
            Browser Extension
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("privateKey")}
            className={`flex-1 py-2 rounded-full text-[11px] font-semibold transition-all ${
              tab === "privateKey"
                ? "bg-[#121316] text-white shadow-sm font-bold"
                : "text-[#5F6368] hover:text-[#121316]"
            }`}
          >
            Import Key
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

        {/* TAB 1: BRIDGEKEY KEYPAIR GENERATOR & RPC INITIATOR */}
        {tab === "bridgekey" && (
          <div className="space-y-3.5">
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#121316] flex items-center gap-1.5 text-xs">
                  <Zap className="w-3.5 h-3.5 text-[#E9B949]" />
                  Bridgekey Non-Custodial Key Generator
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  RPC: 91562037
                </span>
              </div>
              <p className="text-[11px] text-[#5F6368] leading-relaxed">
                Generate a fresh public/private keypair. The key initiation activates your dedicated RPC node connection to the MST Blockchain.
              </p>

              {!generatedWallet ? (
                <button
                  type="button"
                  onClick={handleGenerateBridgekey}
                  className="w-full mt-2 py-2.5 rounded-xl bg-white hover:bg-black/[0.03] border border-black/[0.08] text-xs font-semibold text-[#121316] shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#946800]" />
                  Generate Public/Private Keypair
                </button>
              ) : (
                <div className="space-y-2 pt-1 border-t border-black/[0.05]">
                  {/* Address */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#5F6368] mb-0.5">
                      <span>Derived EVM Address:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedWallet.address, "addr")}
                        className="text-[#946800] hover:underline inline-flex items-center gap-0.5"
                      >
                        {copiedKey === "addr" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedKey === "addr" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="p-2 rounded-lg bg-white border border-black/[0.05] font-mono text-[11px] text-[#121316] truncate">
                      {generatedWallet.address}
                    </p>
                  </div>

                  {/* Public Key */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#5F6368] mb-0.5">
                      <span>Public Key (For Encrypt/Decrypt Invites):</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedWallet.publicKey, "pub")}
                        className="text-[#946800] hover:underline inline-flex items-center gap-0.5"
                      >
                        {copiedKey === "pub" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedKey === "pub" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="p-2 rounded-lg bg-white border border-black/[0.05] font-mono text-[10px] text-[#5F6368] truncate">
                      {generatedWallet.publicKey}
                    </p>
                  </div>

                  {/* Private Key */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#5F6368] mb-0.5">
                      <span>Private Key (Saved in Browser Memory):</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedWallet.privateKey, "priv")}
                        className="text-[#946800] hover:underline inline-flex items-center gap-0.5"
                      >
                        {copiedKey === "priv" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedKey === "priv" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="p-2 rounded-lg bg-white border border-black/[0.05] font-mono text-[10px] text-[#5F6368] truncate">
                      {generatedWallet.privateKey.substring(0, 14)}...{generatedWallet.privateKey.substring(generatedWallet.privateKey.length - 10)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectGeneratedBridgekey}
                    disabled={isSubmitting}
                    className="w-full mt-2 btn-pill-primary text-xs py-2.5 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#E9B949]" />
                    {isSubmitting ? "Initiating RPC & Activating..." : "Activate & Connect to MST Blockchain"}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Demo Pre-filled Keypair */}
            {!generatedWallet && (
              <div className="p-3 rounded-2xl bg-white border border-black/[0.06] text-[11px] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#121316]">Demo Testnet BridgeKey</p>
                  <p className="text-[#8F959E] font-mono">0x71C8F21c...392B</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPrivateKey("0x0000000000000000000000000000000000000000000000000000000000000001");
                    setTab("privateKey");
                  }}
                  className="px-3 py-1.5 rounded-full bg-black/[0.03] hover:bg-black/[0.07] text-xs font-semibold text-[#121316]"
                >
                  Use Demo Account →
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BROWSER EXTENSION */}
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
                    <p className="text-sm font-semibold text-[#121316]">BridgeKey / Web3 Extension</p>
                    <p className="text-[11px] text-[#5F6368]">Connect via browser extension</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8F959E]" />
              </button>
            )}

            <p className="text-xs text-[#5F6368] text-center pt-2">
              Extension not installed? Generate a keypair with{" "}
              <button
                type="button"
                className="text-[#121316] font-semibold underline underline-offset-2"
                onClick={() => handleTabChange("bridgekey")}
              >
                Bridgekey Keypair
              </button>.
            </p>
          </div>
        )}

        {/* TAB 3: IMPORT PRIVATE KEY */}
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
                Key stays in your browser memory only. Initiates connection to MST RPC (`{MST_TESTNET.rpcUrl}`).
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
