import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { ConnectWalletPage } from "./components/ConnectWalletPage";
import { CreateGroupView } from "./components/CreateGroupView";
import { JoinCircleView } from "./components/JoinCircleView";
import { MyCirclesView } from "./components/MyCirclesView";
import { DedicatedCirclePage } from "./components/DedicatedCirclePage";
import { AccountModal } from "./components/AccountModal";
import { useWallet } from "./hooks/useWallet";
import { ContractService } from "./services/contractService";
import { VerificationService } from "./services/verificationService";
import { parseWalletError } from "./utils/formatters";
import { API_URL } from "./config/network";
import { CheckCircle2, AlertCircle, Plus, UserPlus, Shield } from "lucide-react";


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
  const [activeCircleAddress, setActiveCircleAddress] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  // Check URL query parameters & pathname for invitation links (e.g. /grouplink?circle=0x...)
  const [activeTab, setActiveTab] = useState<"join" | "create" | "my-circles">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (
        window.location.pathname.includes("grouplink") ||
        params.get("circle") ||
        params.get("grouplink") ||
        params.get("join") ||
        params.get("id")
      ) {
        return "join";
      }
    }
    return "join";
  });

  const [initialCircleId, setInitialCircleId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get("circle") ||
        params.get("grouplink") ||
        params.get("join") ||
        params.get("id") ||
        ""
      );
    }
    return "";
  });

  const showNotification = (message: string, isError: boolean = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 6000);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCircle =
        params.get("circle") ||
        params.get("grouplink") ||
        params.get("join") ||
        params.get("id");
      if (urlCircle || window.location.pathname.includes("grouplink")) {
        if (urlCircle) {
          setInitialCircleId(urlCircle);
        }
        setActiveTab("join");
      }
    }
  }, []);

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
    minWalletAmt?: string;
    allowedKeys?: string[];
  }): Promise<string | undefined> => {
    if (!contractService || !account) {
      setIsAccountModalOpen(true);
      return undefined;
    }
    setIsDeploying(true);
    try {
      showNotification("Deploying Chit Group to MST Testnet...");
      const result = await contractService.createGroup(params);
      if (result.groupAddress && result.groupAddress.startsWith("0x")) {
        const cleanAddr = result.groupAddress.substring(0, 42);
        setLastDeployedAddress(cleanAddr);

        await VerificationService.registerCircle({
          address: cleanAddr,
          name: params.groupName,
          memberCount: params.memberCount,
          installmentAmount: params.installmentAmount,
          cycleDuration: params.cycleDuration,
          initializer: account,
          minWalletAmt: params.minWalletAmt || "0",
          createdAt: Date.now(),
        });

        // Add initializer to allowed list
        await VerificationService.addAllowedMember(cleanAddr, account, account);

        // Add all pre-specified allowed member public keys
        if (params.allowedKeys && Array.isArray(params.allowedKeys)) {
          for (const key of params.allowedKeys) {
            await VerificationService.addAllowedMember(cleanAddr, key, account);
          }
        }

        // Index on backend
        try {
          await fetch(`${API_URL}/groups/index`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: cleanAddr }),
          });
        } catch {}

        const saved: any[] = JSON.parse(localStorage.getItem("vouch_custom_groups") || "[]");
        saved.push({
          address: cleanAddr,
          name: params.groupName,
          memberCount: params.memberCount,
          installmentAmount: params.installmentAmount,
        });
        localStorage.setItem("vouch_custom_groups", JSON.stringify(saved));
        showNotification(`Savings Circle deployed successfully at ${cleanAddr}!`);
        setActiveCircleAddress(cleanAddr);
        if (typeof window !== "undefined") {
          window.history.pushState({}, "", `?circle=${cleanAddr}`);
        }
        return cleanAddr;
      } else {
        showNotification("Group creation transaction confirmed on blockchain.");
        return undefined;
      }
    } catch (err: any) {
      console.error(err);
      showNotification(parseWalletError(err), true);
      return undefined;
    } finally {
      setIsDeploying(false);
    }
  };

  const handleJoinSuccess = (circleAddr: string) => {
    showNotification(`Joined circle ${circleAddr.substring(0, 10)}...`);
    setActiveCircleAddress(circleAddr);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `?circle=${circleAddr}`);
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

        {/* ── Conditional Render: Dedicated Circle Page vs Hub Tabs ── */}
        {activeCircleAddress ? (
          <DedicatedCirclePage
            circleAddress={activeCircleAddress}
            account={account}
            contractService={contractService}
            onBack={() => {
              setActiveCircleAddress(null);
              if (typeof window !== "undefined") {
                window.history.pushState({}, "", window.location.pathname);
              }
            }}
            onShowNotification={showNotification}
          />
        ) : (

          <>
            {/* ── 3 Main Navigation Tabs: Join, Create, and My Circles ── */}
            <div className="flex items-center justify-center gap-6 sm:gap-12 pt-2 pb-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab("join")}
                className={`px-1 py-1 text-xs sm:text-sm md:text-base flex items-center gap-2 transition-all duration-300 ease-out transform cursor-pointer bg-transparent border-none ${
                  activeTab === "join"
                    ? "text-red-500 font-bold scale-110 -translate-y-1 drop-shadow-[0_0_10px_rgba(255,23,68,0.5)]"
                    : "text-neutral-500 font-medium scale-100 translate-y-0 hover:text-neutral-300 hover:-translate-y-0.5"
                }`}
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Join a Circle</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("create")}
                className={`px-1 py-1 text-xs sm:text-sm md:text-base flex items-center gap-2 transition-all duration-300 ease-out transform cursor-pointer bg-transparent border-none ${
                  activeTab === "create"
                    ? "text-red-500 font-bold scale-110 -translate-y-1 drop-shadow-[0_0_10px_rgba(255,23,68,0.5)]"
                    : "text-neutral-500 font-medium scale-100 translate-y-0 hover:text-neutral-300 hover:-translate-y-0.5"
                }`}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Create a Circle</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("my-circles")}
                className={`px-1 py-1 text-xs sm:text-sm md:text-base flex items-center gap-2 transition-all duration-300 ease-out transform cursor-pointer bg-transparent border-none ${
                  activeTab === "my-circles"
                    ? "text-red-500 font-bold scale-110 -translate-y-1 drop-shadow-[0_0_10px_rgba(255,23,68,0.5)]"
                    : "text-neutral-500 font-medium scale-100 translate-y-0 hover:text-neutral-300 hover:-translate-y-0.5"
                }`}
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>My Circles</span>
              </button>
            </div>

            {/* ── Content View ── */}
            {activeTab === "join" ? (
              <JoinCircleView
                account={account}
                contractService={contractService}
                onJoinSuccess={handleJoinSuccess}
                initialCircleId={initialCircleId}
                onShowNotification={showNotification}
              />
            ) : activeTab === "create" ? (
              <CreateGroupView
                account={account}
                onCreateGroup={handleCreateGroup}
                isDeploying={isDeploying}
                deployedCircleAddress={lastDeployedAddress}
                onShowNotification={showNotification}
              />
            ) : (
              <MyCirclesView
                account={account}
                contractService={contractService}
                onSelectCircle={(addr) => setActiveCircleAddress(addr)}
                onCreateNewCircle={() => setActiveTab("create")}
                onShowNotification={showNotification}
              />
            )}
          </>
        )}
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
