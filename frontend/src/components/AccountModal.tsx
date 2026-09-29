import React, { useState } from "react";
import { Copy, Check, Key, Shield, ArrowRight, AlertCircle, Globe, ExternalLink, Code2, User } from "lucide-react";
import { formatINR, parseWalletError } from "../utils/formatters";
import { EIP6963ProviderDetail } from "../types/global";
import { MST_TESTNET } from "../config/network";
import { Modal } from "./ui/Modal";

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
  const [connectTab, setConnectTab] = useState<"extension" | "privateKey">("extension");
  const [privateKey, setPrivateKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handlePrivateKeyConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey.trim() || !onConnectPrivateKey) return;
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
      setErrorMsg(parseWalletError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Settings"
      description="Manage wallet connection, network & protocol telemetry"
      icon={<User className="w-5 h-5 text-[#946800]" />}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        {/* Balance Card */}
        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] flex items-center justify-between">
          <div>
            <p className="text-[#5F6368] font-medium text-[11px] uppercase tracking-wider">Connected Balance</p>
            <p className="text-2xl font-bold text-[#121316] font-display mt-0.5 tracking-tight">
              {formatINR(balance)}
            </p>
            <p className="text-[11px] font-mono mt-0.5 text-[#137333] font-medium">
              {parseFloat(balance || "0").toFixed(4)} tMSTC
            </p>
          </div>
          {account && (
            <span className="v-badge v-badge-green">
              <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
              Active
            </span>
          )}
        </div>

        {/* Address */}
        {account && (
          <div className="p-3.5 rounded-2xl bg-black/[0.02] border border-black/[0.06] space-y-1.5">
            <p className="text-[#5F6368] font-medium text-[11px]">Blockchain Address</p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-[#121316] font-mono text-[11px] truncate bg-white px-2 py-1 rounded-lg border border-black/[0.06]">
                {account}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(account, "account")}
                className="p-1.5 rounded-lg hover:bg-black/[0.05] text-[#5F6368] hover:text-[#121316] transition-colors"
                title="Copy address"
              >
                {copiedKey === "account" ? (
                  <Check className="w-3.5 h-3.5 text-[#137333]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Connection Mode Selection (when switching or connecting) */}
        {onConnectExtension && onConnectPrivateKey && (
          <div className="p-3.5 rounded-2xl bg-black/[0.02] border border-black/[0.06] space-y-3">
            <p className="text-[#5F6368] font-medium text-[11px]">
              {account ? "Switch Connection" : "Connect Wallet"}
            </p>

            {/* Tab Switcher */}
            <div className="flex rounded-full p-1 bg-black/[0.04] border border-black/[0.05]">
              <button
                type="button"
                onClick={() => {
                  setConnectTab("extension");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  connectTab === "extension"
                    ? "bg-white text-[#121316] shadow-sm font-bold"
                    : "text-[#5F6368] hover:text-[#121316]"
                }`}
              >
                Extension
              </button>
              <button
                type="button"
                onClick={() => {
                  setConnectTab("privateKey");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  connectTab === "privateKey"
                    ? "bg-white text-[#121316] shadow-sm font-bold"
                    : "text-[#5F6368] hover:text-[#121316]"
                }`}
              >
                Private Key
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
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
                      className="w-full p-2.5 rounded-xl bg-white hover:bg-black/[0.02] border border-black/[0.06] transition-colors flex items-center justify-between text-left shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        {prov.info.icon ? (
                          <img src={prov.info.icon} alt={prov.info.name} className="w-4 h-4 rounded" />
                        ) : (
                          <Shield className="w-4 h-4 text-[#137333]" />
                        )}
                        <p className="text-xs font-semibold text-[#121316]">{prov.info.name}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#5F6368]" />
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => handleExtensionConnect()}
                    disabled={isSubmitting}
                    className="w-full p-2.5 rounded-xl bg-white hover:bg-black/[0.02] border border-black/[0.06] transition-colors flex items-center justify-between text-left shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-[#137333]" />
                      <p className="text-xs font-semibold text-[#121316]">Browser Wallet (BridgeKey)</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#5F6368]" />
                  </button>
                )}
              </div>
            )}

            {/* Private Key Option */}
            {connectTab === "privateKey" && (
              <form onSubmit={handlePrivateKeyConnect} className="space-y-3 pt-1">
                <input
                  type="password"
                  placeholder="Enter Private Key (0x...)"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="v-input font-mono text-xs"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !privateKey.trim()}
                  className="v-btn-primary w-full text-xs py-2.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  {isSubmitting ? "Connecting..." : "Connect with Private Key"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Network & Bridgekey RPC Connection Telemetry */}
        <div className="p-3.5 rounded-2xl bg-black/[0.02] border border-black/[0.06] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#121316] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#137333]" />
              Bridgekey RPC Node & MST Blockchain
            </span>
            <span className="v-badge v-badge-green text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
              RPC Active (91562037)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
            <div>
              <p className="text-[#5F6368]">Wallet Core</p>
              <p className="font-mono font-semibold text-[#121316]">Bridgekey Keypair</p>
            </div>
            <div>
              <p className="text-[#5F6368]">Chain ID</p>
              <p className="font-mono font-semibold text-[#121316]">91562037 (MST Testnet)</p>
            </div>
            <div>
              <p className="text-[#5F6368]">RPC Node</p>
              <p className="font-mono text-[#121316] truncate">{MST_TESTNET.rpcUrl}</p>
            </div>
            <div>
              <p className="text-[#5F6368]">Explorer</p>
              <a
                href={MST_TESTNET.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono inline-flex items-center gap-1 text-[#137333] hover:underline font-semibold"
              >
                mstscan.com <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Tech Mode Toggle */}
        {onToggleTechnicalMode && (
          <div className="p-3.5 rounded-2xl bg-[#5E4080]/[0.04] border border-[#5E4080]/[0.1] flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-semibold text-[#121316] text-xs flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#5E4080]" />
                Technical Details View
              </p>
              <p className="text-[11px] text-[#5F6368]">
                Show contract addresses, hash states, and protocol formulas.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleTechnicalMode}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isTechnicalMode
                  ? "bg-[#5E4080] text-white shadow-sm"
                  : "bg-black/[0.06] text-[#5F6368] hover:text-[#121316]"
              }`}
            >
              {isTechnicalMode ? "ON" : "OFF"}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button type="button" onClick={onClose} className="v-btn-secondary text-xs">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
