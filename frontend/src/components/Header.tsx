import React from "react";
import { Shield, Plus, Wallet, LogOut } from "lucide-react";

interface HeaderProps {
  account: string | null;
  balance: string;
  isConnecting: boolean;
  currentUser?: { name: string; email: string; picture?: string } | null;
  onLogout?: () => void;
  onOpenAccountModal: () => void;
  onOpenCreateGroupModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  isConnecting,
  currentUser,
  onLogout,
  onOpenAccountModal,
  onOpenCreateGroupModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-black px-6 sm:px-10 py-4 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="p-2 text-red-500 flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white font-display">
          Vouch
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {currentUser && (
          <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400">
            {currentUser.picture ? (
              <img
                src={currentUser.picture}
                alt=""
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <span className="w-6 h-6 rounded-full bg-red-950 text-red-400 flex items-center justify-center font-bold text-[10px]">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-neutral-300 font-medium">{currentUser.name}</span>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out of Google"
                className="p-1 text-neutral-500 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

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
          <Wallet className="w-4 h-4 text-red-500" />
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
