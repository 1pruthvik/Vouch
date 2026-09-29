import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Key,
  Shield,
  ArrowRight,
  AlertCircle,
  Globe,
  ExternalLink,
  Code2,
  Sparkles,
  LogOut
} from "lucide-react";
import { formatINR, parseWalletError } from "../utils/formatters";
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
}

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
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [connectTab, setConnectTab] = useState<"privateKey" | "extension">("privateKey");
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
        setErrorMsg("No browser extension detected. Connect via Private Key or install BridgeKey.");
      }
    } catch (err: any) {
      setErrorMsg(parseWalletError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrivateKeyConnect = async (e?: React.FormEvent, customKey?: string) => {
    if (e) e.preventDefault();
    const keyToUse = (customKey || privateKey).trim();
    if (!keyToUse || !onConnectPrivateKey) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const success = await onConnectPrivateKey(keyToUse);
      if (success) {
        setPrivateKey("");
        onClose();
      } else {
        setErrorMsg("Invalid private key format. Please check and retry.");
      }
    } catch (err: any) {
      setErrorMsg(parseWalletError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="v-overlay">
      <div className="v-modal p-6 sm:p-7 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#06080F] font-bold text-sm font-display shadow-md"
              style={{ background: "linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%)" }}
            >
              {account ? account.substring(2, 4).toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Wallet & Account</h2>
              <p className="text-xs text-[#7A889B]">Manage your connection on MST Testnet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7A889B] hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mt-5 text-xs">
          {/* Balance Card */}
          <div
            className="p-5 rounded-2xl flex items-center justify-between"
            style={{ background: "rgba(13, 19, 31, 0.8)", border: "1px solid rgba(0, 245, 160, 0.2)" }}
          >
            <div>
              <p className="text-[#7A889B] font-medium">Connected Balance</p>
              <p className="text-2xl font-bold text-white font-display mt-1">
                {formatINR(balance)}
              </p>
              <p className="text-[11px] font-mono mt-0.5 text-[#00F5A0]">
                {parseFloat(balance || "0").toFixed(4)} tMSTC
              </p>
            </div>
            {account && (
              <span className="v-badge v-badge-emerald">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0]" />
                Active
              </span>
            )}
          </div>

          {/* Address */}
          {account && (
            <div
              className="p-4 rounded-2xl space-y-1.5"
              style={{ background: "rgba(13, 19, 31, 0.6)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
            >
              <p className="text-[#7A889B] font-medium">On-Chain Wallet Address</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-[#E6EDF3] font-mono text-[11px] truncate">{account}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(account, "account")}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#7A889B] hover:text-white transition-all"
                >
                  {copiedKey === "account" ? <Check className="w-3.5 h-3.5 text-[#00F5A0]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Switch Connection Mode */}
          {onConnectExtension && onConnectPrivateKey && (
            <div
              className="p-4 rounded-2xl space-y-3"
              style={{ background: "rgba(13, 19, 31, 0.6)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
            >
              <p className="text-[#7A889B] font-medium">Switch Wallet Account</p>

              {/* Tab Switcher */}
              <div className="flex rounded-xl p-1 gap-1" style={{ background: "rgba(6, 8, 15, 0.8)" }}>
                <button
                  type="button"
                  onClick={() => {
                    setConnectTab("privateKey");
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    connectTab === "privateKey" ? "bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/30" : "text-[#7A889B] hover:text-white"
                  }`}
                >
                  Private Key
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConnectTab("extension");
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    connectTab === "extension" ? "bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/30" : "text-[#7A889B] hover:text-white"
                  }`}
                >
                  Extension
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Private Key Option */}
              {connectTab === "privateKey" && (
                <div className="space-y-3 pt-1">
                  <form onSubmit={(e) => handlePrivateKeyConnect(e)} className="space-y-2">
                    <input
                      type="password"
                      placeholder="Paste Private Key (0x...)"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      className="v-input font-mono text-xs"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !privateKey.trim()}
                      className="v-btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5" />
                      {isSubmitting ? "Switching..." : "Switch Account"}
                    </button>
                  </form>

                  <div className="pt-2 border-t border-white/[0.04] space-y-1.5">
                    <span className="text-[10px] text-[#7A889B] font-semibold block">Quick Switch Testnet Roles:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {DEMO_TESTNET_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.name}
                          type="button"
                          onClick={() => handlePrivateKeyConnect(undefined, acc.key)}
                          className="p-2 rounded-lg text-[10px] text-left font-medium bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/[0.05] transition-all"
                        >
                          <span className="text-[#00F5A0] block font-bold truncate">{acc.name.split(" ")[0]}</span>
                          <span className="text-[#7A889B] text-[9px] block truncate">{acc.role}</span>
                        </button>
                      ))}
                    </div>
                  </div>
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
                        className="w-full p-3 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between text-left"
                        style={{ background: "rgba(13, 19, 31, 0.8)", border: "1px solid rgba(0, 245, 160, 0.2)" }}
                      >
                        <div className="flex items-center gap-2.5">
                          {prov.info.icon ? (
                            <img src={prov.info.icon} alt={prov.info.name} className="w-5 h-5 rounded" />
                          ) : (
                            <Shield className="w-5 h-5 text-[#00F5A0]" />
                          )}
                          <p className="text-xs font-bold text-white font-display">{prov.info.name}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#7A889B]" />
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleExtensionConnect()}
                      disabled={isSubmitting}
                      className="w-full p-3 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between text-left"
                      style={{ background: "rgba(13, 19, 31, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                    >
                      <div className="flex items-center gap-2.5">
                        <Shield className="w-5 h-5 text-[#00F5A0]" />
                        <p className="text-xs font-bold text-white">Browser Wallet (BridgeKey)</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#7A889B]" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Network Info */}
          <div
            className="p-4 rounded-2xl space-y-3"
            style={{ background: "rgba(13, 19, 31, 0.6)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#00F5A0]" />
                Network Architecture
              </span>
              <span className="v-badge v-badge-emerald">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0]" />
                MST Testnet
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
              <div>
                <p className="text-[#7A889B]">Chain ID</p>
                <p className="font-mono font-semibold text-[#E6EDF3]">91562037</p>
              </div>
              <div>
                <p className="text-[#7A889B]">EVM Target</p>
                <p className="font-mono font-semibold text-[#E6EDF3]">Paris (0.8.24)</p>
              </div>
              <div>
                <p className="text-[#7A889B]">RPC Endpoint</p>
                <p className="font-mono text-[#E6EDF3] truncate">{MST_TESTNET.rpcUrl}</p>
              </div>
              <div>
                <p className="text-[#7A889B]">Explorer</p>
                <a
                  href={MST_TESTNET.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono inline-flex items-center gap-1 text-[#00D9F5] hover:underline"
                >
                  mstscan.com <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-5 flex justify-end">
          <button onClick={onClose} className="v-btn-secondary text-xs">Close</button>
        </div>
      </div>
    </div>
  );
};

