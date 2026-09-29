import React from "react";
import { Shield, Wallet, Plus } from "lucide-react";

interface HeaderProps {
  account: string | null;
  balance: string;
  isConnecting: boolean;
  onOpenAccountModal: () => void;
  onOpenCreateGroupModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  isConnecting,
  onOpenAccountModal,
  onOpenCreateGroupModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-black border-b border-neutral-900 px-6 sm:px-10 py-4 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-royal-600 text-white flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white font-display">
          Vouch
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCreateGroupModal}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Group</span>
        </button>

        <button
          onClick={onOpenAccountModal}
          disabled={isConnecting}
          className="btn-secondary"
        >
          <Wallet className="w-4 h-4 text-royal-400" />
          {account
            ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
            : isConnecting
            ? "Connecting..."
            : "Connect Wallet"}
        </button>
      </div>
    </header>
  );
};
