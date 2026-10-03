import React, { useState, useEffect } from "react";
import { Shield, Wallet, AlertCircle, ArrowRight, CheckCircle2, Key, RefreshCw, Copy, Check, Eye, EyeOff, Radio, Cpu } from "lucide-react";
import { EIP6963ProviderDetail } from "../types/global";
import { ethers } from "ethers";
import { MST_TESTNET } from "../config/network";

interface ConnectWalletPageProps {
  onConnectExtension: (providerDetail?: EIP6963ProviderDetail) => Promise<boolean>;
  onConnectPrivateKey?: (privateKey: string) => Promise<boolean>;
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
  const [activeTab, setActiveTab] = useState<"extension" | "generate" | "import">("extension");
  const [localError, setLocalError] = useState<string | null>(null);

  // Key Generator State
  const [generatedWallet, setGeneratedWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [rpcStatus, setRpcStatus] = useState<"checking" | "connected" | "error">("checking");
  const [latestBlock, setLatestBlock] = useState<number | null>(null);

  // Manual Import State
  const [importKeyInput, setImportKeyInput] = useState("");
  const [showImportKey, setShowImportKey] = useState(false);

  // Check RPC status on mount
  useEffect(() => {
    let isMounted = true;
    const checkRpc = async () => {
      try {
        const prov = new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl);
        const block = await prov.getBlockNumber();
        if (isMounted) {
          setLatestBlock(block);
          setRpcStatus("connected");
        }
      } catch (err) {
        if (isMounted) {
          setRpcStatus("error");
        }
      }
    };
    checkRpc();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerateKeypair = () => {
    setLocalError(null);
    onClearError();
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

  const handleExtensionClick = async (provider?: EIP6963ProviderDetail) => {
    setLocalError(null);
    onClearError();
    try {
      await onConnectExtension(provider);
    } catch (err: any) {
      setLocalError(err.message || "Failed to connect wallet extension.");
    }
  };

  const handleActivateGeneratedWallet = async () => {
    if (!generatedWallet || !onConnectPrivateKey) return;
    setLocalError(null);
    onClearError();
    try {
      const success = await onConnectPrivateKey(generatedWallet.privateKey);
      if (!success) {
        setLocalError("Failed to initiate RPC node session.");
      }
    } catch (err: any) {
      setLocalError(err.message || "Failed to activate wallet.");
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onConnectPrivateKey) return;
    setLocalError(null);
    onClearError();

    const cleanKey = importKeyInput.trim();
    if (!cleanKey) {
      setLocalError("Please enter a private key.");
      return;
    }

    try {
      const success = await onConnectPrivateKey(cleanKey);
      if (!success) {
        setLocalError("Invalid private key or failed to connect to RPC node.");
      }
    } catch (err: any) {
      setLocalError(err.message || "Invalid private key.");
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-6 text-neutral-100 relative selection:bg-red-500 selection:text-white">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 text-red-500 flex items-center justify-center">
            <Shield className="w-14 h-14" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">
              Vouch
            </h1>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Autonomous Savings Circles & Chit Funds on MST Blockchain
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-center gap-4 p-1 bg-neutral-950 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("extension");
              setLocalError(null);
              onClearError();
            }}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border-none ${
              activeTab === "extension"
                ? "bg-red-600 text-white"
                : "text-neutral-400 hover:text-white bg-transparent"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>BridgeKey Extension</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("generate");
              setLocalError(null);
              onClearError();
              if (!generatedWallet) {
                handleGenerateKeypair();
              }
            }}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border-none ${
              activeTab === "generate"
                ? "bg-red-600 text-white"
                : "text-neutral-400 hover:text-white bg-transparent"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Key Generator & RPC</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("import");
              setLocalError(null);
              onClearError();
            }}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border-none ${
              activeTab === "import"
                ? "bg-red-600 text-white"
                : "text-neutral-400 hover:text-white bg-transparent"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Import Key</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4 pt-1 text-left">
          {activeTab === "extension" ? (
            <div className="space-y-3">
              {detectedProviders && detectedProviders.length > 0 ? (
                <div className="space-y-2">
                  {detectedProviders.map((p, idx) => (
                    <button
                      key={p.info.uuid || idx}
                      type="button"
                      disabled={isConnecting}
                      onClick={() => handleExtensionClick(p)}
                      className="btn-primary w-full py-3.5 px-4 flex items-center justify-between text-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {p.info.icon ? (
                          <img src={p.info.icon} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                          <Wallet className="w-5 h-5" />
                        )}
                        <span className="font-semibold">{p.info.name}</span>
                      </div>
                      <span className="text-xs uppercase tracking-wider font-bold text-neutral-100">
                        {isConnecting ? "Connecting..." : "Connect"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={() => handleExtensionClick()}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-sm cursor-pointer"
                >
                  <Wallet className="w-5 h-5" />
                  <span className="font-semibold">
                    {isConnecting ? "Connecting to BridgeKey..." : "Connect BridgeKey Wallet"}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              )}

              <p className="text-[11px] text-neutral-500 text-center">
                Connect your BridgeKey browser extension on MST Testnet (Chain ID 91562037).
              </p>
            </div>
          ) : activeTab === "generate" ? (
            /* BridgeKey Key Generator & RPC Node Initiator */
            <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-red-500" />
                    <span>BridgeKey Keypair & RPC Node Initiator</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Generates your public/private keypair which initiates the RPC node connection to MST Blockchain.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateKeypair}
                  className="p-1.5 text-neutral-400 hover:text-white bg-transparent border-none cursor-pointer"
                  title="Regenerate Keypair"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {generatedWallet && (
                <div className="space-y-3">
                  {/* Public Key */}
                  <div className="p-3 bg-black rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                      <span>Public Key (BridgeKey Public Address)</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedWallet.address, "pub")}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                      >
                        {copiedKey === "pub" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === "pub" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <p className="font-mono text-white text-xs break-all select-all font-semibold">
                      {generatedWallet.address}
                    </p>
                    <span className="text-[10px] text-neutral-500 block">
                      Invites to savings circles can be sent directly to this Public Key.
                    </span>
                  </div>

                  {/* Private Key */}
                  <div className="p-3 bg-black rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                      <span>Private Key (Cryptographic Signer)</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                          className="text-neutral-400 hover:text-white bg-transparent border-none cursor-pointer flex items-center gap-1"
                        >
                          {showPrivateKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showPrivateKey ? "Hide" : "Show"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(generatedWallet.privateKey, "priv")}
                          className="text-red-400 hover:text-red-300 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                        >
                          {copiedKey === "priv" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === "priv" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>
                    <p className="font-mono text-white text-xs break-all">
                      {showPrivateKey ? generatedWallet.privateKey : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                    </p>
                  </div>

                  {/* RPC Node Telemetry */}
                  <div className="p-3 bg-neutral-900 rounded-lg flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-neutral-300">
                      <span className={`w-2 h-2 rounded-full ${rpcStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
                      <span>MST RPC Node (Chain ID 91562037)</span>
                    </div>
                    <span className="font-mono text-green-400 text-[10px]">
                      {latestBlock ? `Block #${latestBlock}` : "Active"}
                    </span>
                  </div>

                  {/* Activate CTA */}
                  <button
                    type="button"
                    disabled={isConnecting}
                    onClick={handleActivateGeneratedWallet}
                    className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
                  >
                    <Radio className="w-4 h-4" />
                    <span>
                      {isConnecting
                        ? "Initiating RPC & Activating..."
                        : "Initiate RPC Node & Activate MST Blockchain"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Import Key */
            <form onSubmit={handleImportSubmit} className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl space-y-4 text-xs">
              <div className="space-y-1.5">
                <h3 className="font-bold text-white text-xs">Import Existing BridgeKey Keypair</h3>
                <p className="text-[11px] text-neutral-400">
                  Connect your existing key to initiate the RPC Remote Procedure Call node.
                </p>
              </div>

              <div className="relative">
                <input
                  type={showImportKey ? "text" : "password"}
                  placeholder="Paste 64-character private key (0x...)"
                  value={importKeyInput}
                  onChange={(e) => setImportKeyInput(e.target.value)}
                  className="w-full bg-black rounded-lg px-3.5 py-3 pr-10 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border border-neutral-900"
                />
                <button
                  type="button"
                  onClick={() => setShowImportKey(!showImportKey)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-white bg-transparent border-none cursor-pointer"
                >
                  {showImportKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isConnecting || !importKeyInput.trim()}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{isConnecting ? "Connecting to RPC..." : "Connect & Activate MST Node"}</span>
              </button>
            </form>
          )}

          {/* Error Banner */}
          {activeError && (
            <div className="p-3 text-red-400 rounded-lg flex items-center justify-between gap-2 text-xs bg-red-950/20 border border-red-900/40">
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
        <div className="pt-2 text-[11px] text-neutral-500 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>MST Testnet • Chain ID 91562037 • testnetrpc.mstblockchain.com</span>
        </div>
      </div>
    </div>
  );
};
