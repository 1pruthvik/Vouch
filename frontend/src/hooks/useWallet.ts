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

  const checkNetwork = useCallback(async (prov: ethers.BrowserProvider | ethers.JsonRpcProvider) => {
    try {
      const network = await prov.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);
      return currentChainId;
    } catch (err) {
      console.error("Error checking network:", err);
      return null;
    }
  }, []);

  const updateBalance = useCallback(async (acc: string, prov?: ethers.BrowserProvider | ethers.JsonRpcProvider) => {
    try {
      const targetProv = prov || new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl);
      const bal = await targetProv.getBalance(acc);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error("Error fetching balance, falling back to direct RPC:", err);
      try {
        const directRpc = new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl);
        const bal = await directRpc.getBalance(acc);
        setBalance(ethers.formatEther(bal));
      } catch (fallbackErr) {
        console.error("Direct RPC balance fetch failed:", fallbackErr);
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

  const switchToMSTTestnet = async () => {
    if (isPrivateKeyMode) return true;
    const rawProv = getRawProvider();
    if (!rawProv || !rawProv.request) return true;
    setError(null);
    try {
      await rawProv.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MST_TESTNET.chainIdHex }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.message?.includes("Unrecognized chain")) {
        try {
          await rawProv.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: MST_TESTNET.chainIdHex,
                chainName: MST_TESTNET.name,
                rpcUrls: [MST_TESTNET.rpcUrl],
                nativeCurrency: {
                  name: "tMSTC",
                  symbol: MST_TESTNET.symbol,
                  decimals: MST_TESTNET.decimals,
                },
                blockExplorerUrls: [MST_TESTNET.explorerUrl],
              },
            ],
          });
          return true;
        } catch (addError: any) {
          console.error("Failed to add MST Testnet:", addError);
          return false;
        }
      }
      return false;
    }
  };

  const connectWallet = async (providerDetail?: EIP6963ProviderDetail) => {
    setError(null);
    const targetDetail =
      providerDetail ||
      selectedProviderDetail ||
      (detectedProviders.length > 0 ? detectedProviders[0] : null);
    const rawProvider = targetDetail ? targetDetail.provider : getRawProvider();

    if (!rawProvider) {
      setError("BridgeKey or Web3 extension not detected. You can also connect via Private Key.");
      return false;
    }

    try {
      setIsConnecting(true);
      if (targetDetail) {
        setSelectedProviderDetail(targetDetail);
      }

      // 1. Direct EIP-1193 request
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
        const browserProvider = new ethers.BrowserProvider(rawProvider, "any");
        setAccount(accounts[0]);
        setProvider(browserProvider);
        const userSigner = await browserProvider.getSigner();
        setSigner(userSigner);
        setIsPrivateKeyMode(false);

        try {
          const currentChainId = await checkNetwork(browserProvider);
          if (currentChainId !== MST_TESTNET.chainId) {
            await switchToMSTTestnet();
          }
        } catch (netErr) {
          console.warn("Chain switch check error:", netErr);
        }

        const directRpc = new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl);
        await updateBalance(accounts[0], directRpc);
        return true;
      }
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setError(parseWalletError(err));
      return false;
    } finally {
      setIsConnecting(false);
    }
    return false;
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

      const handleChainChanged = (newChainIdHex: string) => {
        setChainId(Number(newChainIdHex));
        if (account) {
          updateBalance(account);
        }
      };

      rawProv.on("accountsChanged", handleAccountsChanged);
      rawProv.on("chainChanged", handleChainChanged);

      return () => {
        if (rawProv.removeListener) {
          rawProv.removeListener("accountsChanged", handleAccountsChanged);
          rawProv.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [getRawProvider, account, isPrivateKeyMode, updateBalance]);

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
    switchToMSTTestnet,
    isCorrectNetwork: isPrivateKeyMode || chainId === MST_TESTNET.chainId,
  };
}
