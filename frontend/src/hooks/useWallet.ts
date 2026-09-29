import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { MST_TESTNET } from "../config/network";
import { EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from "../types/global";
import { parseWalletError } from "../utils/formatters";

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [detectedProviders, setDetectedProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [selectedProviderDetail, setSelectedProviderDetail] = useState<EIP6963ProviderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPrivateKeyMode, setIsPrivateKeyMode] = useState<boolean>(false);

  // 1. EIP-6963 Multi-Injected Provider Discovery
  useEffect(() => {
    const handleAnnounce = (event: EIP6963AnnounceProviderEvent) => {
      if (!event.detail || !event.detail.info) return;
      setDetectedProviders((prev) => {
        const exists = prev.some((p) => p.info.uuid === event.detail.info.uuid);
        if (exists) return prev;
        return [...prev, event.detail];
      });
    };

    window.addEventListener("eip6963:announceProvider" as any, handleAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider" as any, handleAnnounce);
    };
  }, []);

  const updateBalance = useCallback(async (acc: string, prov?: ethers.BrowserProvider | ethers.JsonRpcProvider) => {
    try {
      const targetProv = prov || new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl);
      const bal = await targetProv.getBalance(acc);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.warn("Direct RPC balance fetch attempt:", err);
      try {
        const directRpc = new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl);
        const bal = await directRpc.getBalance(acc);
        setBalance(ethers.formatEther(bal));
      } catch (fallbackErr) {
        console.warn("Fallback balance error:", fallbackErr);
      }
    }
  }, []);

  const getRawProvider = useCallback(() => {
    if (typeof window === "undefined") return null;
    const anyWin = window as any;
    return (
      selectedProviderDetail?.provider ||
      anyWin.bridgekey?.ethereum ||
      anyWin.bridgekey ||
      anyWin.movement?.ethereum ||
      anyWin.movement ||
      window.ethereum ||
      null
    );
  }, [selectedProviderDetail]);

  const connectWallet = async (providerDetail?: EIP6963ProviderDetail) => {
    setError(null);
    const targetDetail =
      providerDetail ||
      selectedProviderDetail ||
      (detectedProviders.length > 0 ? detectedProviders[0] : null);
    const rawProvider = targetDetail ? targetDetail.provider : getRawProvider();

    if (!rawProvider) {
      setError("BridgeKey extension not found. Please install or enable BridgeKey, or connect via Private Key.");
      return false;
    }

    try {
      setIsConnecting(true);
      if (targetDetail) {
        setSelectedProviderDetail(targetDetail);
      }

      // 1. Direct EIP-1193 accounts request
      let accounts: string[] = [];
      if (typeof rawProvider.request === "function") {
        accounts = await rawProvider.request({ method: "eth_requestAccounts" });
      } else if (typeof rawProvider.enable === "function") {
        accounts = await rawProvider.enable();
      }

      if (!accounts || accounts.length === 0) {
        const bp = new ethers.BrowserProvider(rawProvider, "any");
        accounts = await bp.send("eth_requestAccounts", []);
      }

      if (accounts && accounts.length > 0) {
        const accountAddress = accounts[0];
        const browserProvider = new ethers.BrowserProvider(rawProvider, "any");
        setAccount(accountAddress);
        setProvider(browserProvider);

        try {
          const userSigner = await browserProvider.getSigner(accountAddress);
          setSigner(userSigner);
        } catch {
          const userSigner = await browserProvider.getSigner();
          setSigner(userSigner);
        }
        setIsPrivateKeyMode(false);

        // Fetch balance from direct MST Testnet RPC
        const directRpc = new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl);
        await updateBalance(accountAddress, directRpc);
        return true;
      } else {
        setError("No accounts found. Please make sure your BridgeKey wallet is unlocked.");
        return false;
      }
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      const parsed = parseWalletError(err);
      setError(parsed);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect directly with Private Key on MST Testnet
  const connectWithPrivateKey = async (privateKey: string) => {
    setError(null);
    try {
      setIsConnecting(true);
      const cleanKey = privateKey.trim();
      const formattedKey = cleanKey.startsWith("0x") ? cleanKey : `0x${cleanKey}`;

      if (!/^0x[0-9a-fA-F]{64}$/.test(formattedKey)) {
        throw new Error(
          "Invalid private key format. Must be a 64-character hexadecimal key."
        );
      }

      const rpcProvider = new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl);
      const wallet = new ethers.Wallet(formattedKey, rpcProvider);

      setAccount(wallet.address);
      setProvider(rpcProvider);
      setSigner(wallet);
      setChainId(MST_TESTNET.chainId);
      setIsPrivateKeyMode(true);

      await updateBalance(wallet.address, rpcProvider);
      return true;
    } catch (err: any) {
      console.error("Private key connection error:", err);
      setError(parseWalletError(err));
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const disconnectWallet = () => {
    setAccount(null);
    setBalance("0");
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setIsPrivateKeyMode(false);
    setError(null);
  };

  useEffect(() => {
    const rawProv = getRawProvider();
    if (rawProv && rawProv.on && !isPrivateKeyMode) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          updateBalance(accounts[0]);
        } else {
          setAccount(null);
          setBalance("0");
        }
      };

      rawProv.on("accountsChanged", handleAccountsChanged);

      return () => {
        if (rawProv.removeListener) {
          rawProv.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }
  }, [getRawProvider, isPrivateKeyMode, updateBalance]);

  return {
    account,
    chainId,
    balance,
    isConnecting,
    provider,
    signer,
    detectedProviders,
    error,
    isPrivateKeyMode,
    connectWallet,
    connectWithPrivateKey,
    disconnectWallet,
    clearError,
    switchToMSTTestnet: async () => true,
    isCorrectNetwork: true,
  };
}
