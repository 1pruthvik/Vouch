import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { MST_TESTNET } from "../config/network";

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const checkNetwork = useCallback(async (prov: ethers.BrowserProvider) => {
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

  const updateBalance = useCallback(async (acc: string, prov: ethers.BrowserProvider) => {
    try {
      const bal = await prov.getBalance(acc);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  }, []);

  const switchToMSTTestnet = async () => {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MST_TESTNET.chainIdHex }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.message?.includes("Unrecognized chain")) {
        try {
          await window.ethereum.request({
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
        } catch (addError) {
          console.error("Failed to add MST Testnet:", addError);
          return false;
        }
      }
      return false;
    }
  };

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("BridgeKey or Web3 wallet not detected. Please install BridgeKey wallet!");
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setProvider(browserProvider);
        const currentChainId = await checkNetwork(browserProvider);
        if (currentChainId !== MST_TESTNET.chainId) {
          await switchToMSTTestnet();
        }
        await updateBalance(accounts[0], browserProvider);
      }
    } catch (err: any) {
      console.error("Wallet connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (provider) updateBalance(accounts[0], provider);
        } else {
          setAccount(null);
          setBalance("0");
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [provider, updateBalance]);

  return {
    account,
    chainId,
    balance,
    isConnecting,
    provider,
    connectWallet,
    switchToMSTTestnet,
    isCorrectNetwork: chainId === MST_TESTNET.chainId,
  };
}
