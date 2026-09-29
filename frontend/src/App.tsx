import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { ConnectWalletPage } from "./components/ConnectWalletPage";
import { CreateGroupView } from "./components/CreateGroupView";
import { AccountModal } from "./components/AccountModal";
import { useWallet } from "./hooks/useWallet";
import { ContractService } from "./services/contractService";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function App() {
  const {
    account,
    balance,
    isConnecting,
    isCorrectNetwork,
    provider,
    signer,
    detectedProviders,
    error: walletError,
    connectWallet,
    connectWithPrivateKey,
    disconnectWallet,
    clearError,
  } = useWallet();

  const [contractService, setContractService] = useState<ContractService | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [lastDeployedAddress, setLastDeployedAddress] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  const showNotification = (message: string, isError: boolean = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 6000);
  };

  useEffect(() => {
    const srv = new ContractService((provider as any) || undefined);
    if (signer) {
      srv.setSigner(signer);
    }
    setContractService(srv);
  }, [provider, signer]);

  const handleCreateGroup = async (params: {
    groupName: string;
    memberCount: number;
    installmentAmount: string;
    cycleDuration: number;
    discountCapBps: number;
    reserveFeeBps: number;
  }) => {
    if (!contractService || !account) {
      setIsAccountModalOpen(true);
      return;
    }
    setIsDeploying(true);
    try {
      showNotification("Deploying Chit Group to MST Testnet...");
      const result = await contractService.createGroup(params);
      if (result.groupAddress) {
        setLastDeployedAddress(result.groupAddress);
        const saved: any[] = JSON.parse(localStorage.getItem("vouch_custom_groups") || "[]");
        saved.push({
          address: result.groupAddress,
          name: params.groupName,
          memberCount: params.memberCount,
          installmentAmount: params.installmentAmount,
        });
        localStorage.setItem("vouch_custom_groups", JSON.stringify(saved));
        showNotification(`Savings Circle deployed successfully at ${result.groupAddress}!`);
      } else {
        showNotification("Group creation transaction confirmed on blockchain.");
      }
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Failed to deploy group contract", true);
    } finally {
      setIsDeploying(false);
    }
  };

  // If not connected to wallet, render ConnectWalletPage
  if (!account) {
    return (
      <ConnectWalletPage
        onConnectExtension={connectWallet}
        onConnectPrivateKey={connectWithPrivateKey}
        detectedProviders={detectedProviders}
        isConnecting={isConnecting}
        error={walletError}
        onClearError={clearError}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-neutral-100 selection:bg-red-500 selection:text-white">
      <Header
        account={account}
        balance={balance}
        isConnecting={isConnecting}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-lg flex items-center justify-between text-xs sm:text-sm font-semibold transition-all ${
              notification.isError
                ? "text-red-400 bg-red-950/20"
                : "text-neutral-100 bg-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.isError ? (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-neutral-400 hover:text-white ml-4 bg-transparent border-none cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Content: Only Create Group view */}
        <CreateGroupView
          account={account}
          onCreateGroup={handleCreateGroup}
          isDeploying={isDeploying}
          deployedCircleAddress={lastDeployedAddress}
        />
      </main>

      {/* Account Modal for wallet info and disconnect */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        account={account}
        balance={balance}
        isCorrectNetwork={isCorrectNetwork}
        detectedProviders={detectedProviders}
        onConnectExtension={connectWallet}
        onConnectPrivateKey={connectWithPrivateKey}
        onDisconnect={disconnectWallet}
      />
    </div>
  );
}

export default App;
