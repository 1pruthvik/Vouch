import React, { useState } from "react";
import {
  X,
  Wallet,
  Key,
  Shield,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Eye,
  EyeOff,
  UserCheck,
  Zap,
  HelpCircle
} from "lucide-react";
import { ethers } from "ethers";
import { EIP6963ProviderDetail } from "../types/global";
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

// Preset verified test accounts for MST Testnet
const DEMO_TESTNET_ACCOUNTS = [
  {
    name: "Alice (Organizer / Admin)",
    role: "Circle Organizer",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    key: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
  },
  {
    name: "Bob (Member / Bidder)",
    role: "Verified Participant",
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    key: "0x6cbed15c793ce57650b9877cf26f5d7d957170e14e28c829e47531b18a36b29c",
  },
  {
    name: "Charlie (Member / Bidder)",
    role: "Verified Participant",
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
    key: "0x6370fd033278c143033d34f07416ff55f29f33f08d299d34bbce3b25f55b93ce",
  },
];

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  detectedProviders,
  onConnectExtension,
  onConnectPrivateKey,
  onClearError,
  error,
}) => {
  const [tab, setTab] = useState<"extension" | "privateKey" | "instant">("privateKey");
  const [privateKey, setPrivateKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Instant Burner Wallet State
  const [generatedWallet, setGeneratedWallet] = useState<{ address: string; privateKey: string } | null>(null);

  if (!isOpen) return null;

  const handleTabChange = (newTab: "extension" | "privateKey" | "instant") => {
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
          "No browser wallet detected. Install BridgeKey extension or connect via Private Key / Instant Wallet."
        );
      }
    }
  };

  const handlePrivateKeySubmit = async (e?: React.FormEvent, customKey?: string) => {
    if (e) e.preventDefault();
    const keyToUse = (customKey || privateKey).trim();
    if (!keyToUse) return;
    setLocalError(null);
    if (onClearError) onClearError();
    setIsSubmitting(true);
    const success = await onConnectPrivateKey(keyToUse);
    setIsSubmitting(false);
    if (success) {
      setPrivateKey("");
      onClose();
    }
  };

  const handleGenerateInstantWallet = () => {
    const randomWallet = ethers.Wallet.createRandom();
    setGeneratedWallet({
      address: randomWallet.address,
      privateKey: randomWallet.privateKey,
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeError = localError || error;
  const isExtensionUpdateError = activeError?.toLowerCase().includes("refresh");

  return (
    <div className="v-overlay">
      <div className="v-modal p-6 sm:p-7 max-w-lg space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{
                background: "linear-gradient(135deg, rgba(0, 245, 160, 0.2) 0%, rgba(0, 217, 245, 0.1) 100%)",
                border: "1px solid rgba(0, 245, 160, 0.3)",
              }}
            >
              <Wallet className="w-5 h-5 text-[#00F5A0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-display">Connect Web3 Wallet</h2>
                <span className="v-badge v-badge-cyan text-[10px]">MST Testnet</span>
              </div>
              <p className="text-xs text-[#7A889B] mt-0.5">Link your account to transact on Vouch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7A889B] hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{ background: "rgba(13, 19, 31, 0.85)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
        >
          <button
            type="button"
            onClick={() => handleTabChange("privateKey")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === "privateKey"
                ? "bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/30 shadow-sm"
                : "text-[#7A889B] hover:text-white"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Private Key</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("extension")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === "extension"
                ? "bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/30 shadow-sm"
                : "text-[#7A889B] hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Browser Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("instant")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === "instant"
                ? "bg-[#7928CA]/20 text-[#A78BFA] border border-[#7928CA]/40 shadow-sm"
                : "text-[#7A889B] hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Instant Burner</span>
          </button>
        </div>

        {/* Error Notification */}
        {activeError && (
          <div className="v-toast v-toast-error text-xs flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed text-red-200">{activeError}</span>
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

        {/* TAB 1: PRIVATE KEY / WEB WALLET INPUT */}
        {tab === "privateKey" && (
          <div className="space-y-4 text-xs">
            <form onSubmit={(e) => handlePrivateKeySubmit(e)} className="space-y-3">
              <div>
                <label className="block font-semibold text-[#E6EDF3] mb-1.5 flex items-center justify-between">
                  <span>Enter MST Testnet Private Key</span>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[11px] text-[#00D9F5] hover:underline flex items-center gap-1"
                  >
                    {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showKey ? "Hide" : "Show"}</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder="0x... (64 hex characters)"
                    value={privateKey}
                    onChange={(e) => {
                      setPrivateKey(e.target.value);
                      if (localError || error) {
                        setLocalError(null);
                        if (onClearError) onClearError();
                      }
                    }}
                    className="v-input font-mono text-xs pr-20"
                    required
                  />
                  {privateKey && (
                    <button
                      type="button"
                      onClick={() => setPrivateKey("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#7A889B] hover:text-white px-1.5 py-0.5 rounded bg-white/5"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#7A889B] mt-1.5">
                  Your private key is loaded in browser memory only and connects directly to the MST RPC (`{MST_TESTNET.rpcUrl}`).
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !privateKey.trim()}
                className="v-btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                {isSubmitting ? "Connecting to MST Testnet..." : "Connect with Private Key"}
              </button>
            </form>

            {/* Quick Demo Testnet Accounts */}
            <div className="pt-2 space-y-2 border-t border-white/[0.06]">
              <p className="text-[11px] font-semibold text-[#7A889B] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#00F5A0]" />
                Or 1-Click Connect with Testnet Accounts:
              </p>
              <div className="space-y-2">
                {DEMO_TESTNET_ACCOUNTS.map((acc, idx) => (
                  <div
                    key={acc.name}
                    className="p-3 rounded-xl flex items-center justify-between gap-2 transition-all hover:bg-white/[0.04]"
                    style={{
                      background: "rgba(13, 19, 31, 0.6)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{acc.name}</span>
                        <span className="v-badge v-badge-cyan text-[9px] py-0.5">{acc.role}</span>
                      </div>
                      <p className="text-[10px] font-mono text-[#7A889B] mt-0.5 truncate max-w-[220px]">
                        {acc.address}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handlePrivateKeySubmit(undefined, acc.key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#00F5A0] bg-[#00F5A0]/10 hover:bg-[#00F5A0]/20 border border-[#00F5A0]/30 transition-all flex items-center gap-1"
                    >
                      <span>Connect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BROWSER WALLET / EXTENSION */}
        {tab === "extension" && (
          <div className="space-y-3 text-xs">
            {detectedProviders.length > 0 ? (
              detectedProviders.map((prov) => (
                <button
                  key={prov.info.uuid}
                  onClick={() => handleExtensionClick(prov)}
                  disabled={isSubmitting}
                  className="w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all duration-200 hover:bg-white/5"
                  style={{
                    background: "rgba(13, 19, 31, 0.8)",
                    border: "1px solid rgba(0, 245, 160, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {prov.info.icon ? (
                      <img src={prov.info.icon} alt={prov.info.name} className="w-8 h-8 rounded-lg" />
                    ) : (
                      <Shield className="w-8 h-8 text-[#00F5A0]" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white font-display">{prov.info.name}</p>
                      <p className="text-[11px] text-[#00F5A0]">Detected Web3 Wallet</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#7A889B]" />
                </button>
              ))
            ) : (
              <button
                onClick={() => handleExtensionClick()}
                disabled={isSubmitting}
                className="w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all duration-200 hover:bg-white/5"
                style={{
                  background: "rgba(13, 19, 31, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00F5A0]/10 flex items-center justify-center text-[#00F5A0]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white font-display">BridgeKey / Browser Extension</p>
                    <p className="text-[11px] text-[#7A889B]">Connect via injected Ethereum provider</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7A889B]" />
              </button>
            )}

            <div
              className="p-3.5 rounded-xl text-[11px] space-y-1.5"
              style={{ background: "rgba(0, 217, 245, 0.06)", border: "1px solid rgba(0, 217, 245, 0.2)" }}
            >
              <div className="flex items-center gap-1.5 text-[#00D9F5] font-semibold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Need BridgeKey Extension?</span>
              </div>
              <p className="text-[#7A889B] leading-relaxed">
                If your browser does not have BridgeKey or MetaMask installed, switch to the{" "}
                <strong
                  className="text-[#00F5A0] cursor-pointer hover:underline"
                  onClick={() => handleTabChange("privateKey")}
                >
                  Private Key
                </strong>{" "}
                tab for immediate connection without extensions.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: INSTANT BURNER / TEMPORARY WALLET */}
        {tab === "instant" && (
          <div className="space-y-4 text-xs">
            {!generatedWallet ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7928CA]/25 to-[#4F46E5]/25 border border-violet-500/30 text-[#A78BFA] flex items-center justify-center mx-auto shadow-lg">
                  <Zap className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Instant Web Wallet</h3>
                  <p className="text-xs text-[#7A889B] max-w-xs mx-auto mt-1">
                    Generate an ephemeral EVM key in 1-second to test depositing, bidding, and pool creation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateInstantWallet}
                  className="v-btn-violet py-3 px-6 text-xs font-bold inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate New Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className="p-4 rounded-2xl space-y-2.5"
                  style={{ background: "rgba(121, 40, 202, 0.1)", border: "1px solid rgba(121, 40, 202, 0.3)" }}
                >
                  <div>
                    <span className="text-[10px] text-[#A78BFA] font-semibold uppercase tracking-wider block">
                      Generated Address
                    </span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <code className="text-white font-mono text-xs truncate">{generatedWallet.address}</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedWallet.address, "gen-addr")}
                        className="text-[#7A889B] hover:text-white p-1"
                      >
                        {copiedKey === "gen-addr" ? <Check className="w-3.5 h-3.5 text-[#00F5A0]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#A78BFA] font-semibold uppercase tracking-wider block">
                      Generated Private Key
                    </span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <code className="text-[#00F5A0] font-mono text-xs truncate">{generatedWallet.privateKey}</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedWallet.privateKey, "gen-key")}
                        className="text-[#7A889B] hover:text-white p-1"
                      >
                        {copiedKey === "gen-key" ? <Check className="w-3.5 h-3.5 text-[#00F5A0]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateInstantWallet}
                    className="v-btn-secondary text-xs flex-1"
                  >
                    Generate Another
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handlePrivateKeySubmit(undefined, generatedWallet.privateKey)}
                    className="v-btn-primary text-xs flex-1 font-bold flex items-center justify-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Connect This Wallet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

