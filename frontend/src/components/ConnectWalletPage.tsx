import React, { useState } from "react";
import { Shield, Key, Wallet, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { EIP6963ProviderDetail } from "../types/global";

interface ConnectWalletPageProps {
  onConnectExtension: (providerDetail?: EIP6963ProviderDetail) => Promise<boolean>;
  onConnectPrivateKey: (privateKey: string) => Promise<boolean>;
  detectedProviders: EIP6963ProviderDetail[];
  isConnecting: boolean;
  error: string | null;
  onClearError: () => void;
}

export const ConnectWalletPage: React.FC<ConnectWalletPageProps> = ({
  onConnectExtension,
  onConnectPrivateKey,
  detectedProviders,
  isConnecting,
  error,
  onClearError,
}) => {
  const [connectTab, setConnectTab] = useState<"extension" | "privateKey">("extension");
  const [privateKey, setPrivateKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleExtensionClick = async (provider?: EIP6963ProviderDetail) => {
    setLocalError(null);
    onClearError();
    try {
      await onConnectExtension(provider);
    } catch (err: any) {
      setLocalError(err.message || "Failed to connect wallet extension.");
    }
  };

  const handlePrivateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    onClearError();

    const cleanKey = privateKey.trim();
    if (!cleanKey) {
      setLocalError("Please enter your private key.");
      return;
    }

    const formattedKey = cleanKey.startsWith("0x") ? cleanKey : `0x${cleanKey}`;
    if (!/^0x[0-9a-fA-F]{64}$/.test(formattedKey)) {
      setLocalError("Invalid private key format. Must be a 64-character hexadecimal string.");
      return;
    }

    try {
      const success = await onConnectPrivateKey(cleanKey);
      if (!success) {
        setLocalError("Failed to connect with the provided private key.");
      }
    } catch (err: any) {
      setLocalError(err.message || "Invalid private key.");
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-6 text-neutral-100 relative selection:bg-red-500 selection:text-white">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 text-red-500 flex items-center justify-center">
            <Shield className="w-16 h-16" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
              Vouch
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
              Autonomous Rotating Savings & Collateral Pool on MST Blockchain
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-center gap-8 pt-2">
          <button
            type="button"
            onClick={() => {
              setConnectTab("extension");
              setLocalError(null);
              onClearError();
            }}
            className={`px-1 py-1 text-xs sm:text-sm flex items-center gap-2 transition-all duration-300 ease-out transform cursor-pointer bg-transparent border-none ${
              connectTab === "extension"
                ? "text-red-500 font-bold scale-110 -translate-y-1 drop-shadow-[0_0_10px_rgba(255,23,68,0.5)]"
                : "text-neutral-500 font-medium scale-100 translate-y-0 hover:text-neutral-300 hover:-translate-y-0.5"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Browser Extension</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setConnectTab("privateKey");
              setLocalError(null);
              onClearError();
            }}
            className={`px-1 py-1 text-xs sm:text-sm flex items-center gap-2 transition-all duration-300 ease-out transform cursor-pointer bg-transparent border-none ${
              connectTab === "privateKey"
                ? "text-red-500 font-bold scale-110 -translate-y-1 drop-shadow-[0_0_10px_rgba(255,23,68,0.5)]"
                : "text-neutral-500 font-medium scale-100 translate-y-0 hover:text-neutral-300 hover:-translate-y-0.5"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Private Key</span>
          </button>
        </div>

        {/* Connection Content */}
        <div className="space-y-4 pt-2">
          {connectTab === "extension" ? (
            <div className="space-y-3">
              {detectedProviders && detectedProviders.length > 0 ? (
                detectedProviders.map((p, idx) => (
                  <button
                    key={p.info.uuid || idx}
                    type="button"
                    disabled={isConnecting}
                    onClick={() => handleExtensionClick(p)}
                    className="btn-primary w-full py-3.5 flex items-center justify-between text-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {p.info.icon ? (
                        <img src={p.info.icon} alt="" className="w-5 h-5 rounded-full" />
                      ) : (
                        <Wallet className="w-5 h-5" />
                      )}
                      <span>{p.info.name}</span>
                    </div>
                    <span className="text-xs uppercase tracking-wider font-bold">
                      {isConnecting ? "Connecting..." : "Connect"}
                    </span>
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={() => handleExtensionClick()}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-sm cursor-pointer"
                >
                  <Wallet className="w-5 h-5" />
                  <span className="font-semibold">
                    {isConnecting ? "Connecting to Extension..." : "Connect Browser Extension"}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              )}

              <p className="text-[11px] text-neutral-500 pt-1">
                Supports BridgeKey, MetaMask, and EIP-6963 compatible wallets on MST Testnet
              </p>
            </div>
          ) : (
            <form onSubmit={handlePrivateKeySubmit} className="space-y-4 text-left">
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 font-medium block">
                  Paste 64-Character Private Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder="e.g. 0x4f3edf983ac636a65a842ce7c78d5aa706d401..."
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    disabled={isConnecting}
                    className="w-full bg-neutral-950 text-white rounded-lg px-4 py-3.5 pr-11 text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all border-none"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 p-1 text-neutral-500 hover:text-white bg-transparent border-none cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Your private key is kept locally in memory and never stored or transmitted to external servers.
                </p>
              </div>

              <button
                type="submit"
                disabled={isConnecting || !privateKey.trim()}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Key className="w-4 h-4" />
                <span>{isConnecting ? "Importing & Connecting..." : "Import & Connect Wallet"}</span>
              </button>
            </form>
          )}

          {/* Error message */}
          {activeError && (
            <div className="p-3 text-red-400 rounded-lg flex items-center justify-between gap-2 text-xs bg-red-950/20">
              <div className="flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{activeError}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  onClearError();
                }}
                className="text-neutral-400 hover:text-white ml-2 bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* MST Network Details Footer */}
        <div className="pt-6 text-[11px] text-neutral-500 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>MST Testnet • Chain ID 91562037</span>
        </div>
      </div>
    </div>
  );
};
