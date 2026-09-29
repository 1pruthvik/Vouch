import React from "react";
import { Shield, Plus, Wallet, Code2 } from "lucide-react";
import { formatINR } from "../utils/formatters";

interface HeaderProps {
  account: string | null;
  balance: string;
  isConnecting: boolean;
  groupName?: string;
  isTechnicalMode?: boolean;
  onToggleTechnicalMode?: () => void;
  onOpenAccountModal: () => void;
  onOpenCreateGroupModal: () => void;
  onSwitchGroup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  balance,
  isConnecting,
  groupName,
  isTechnicalMode,
  onToggleTechnicalMode,
  onOpenAccountModal,
  onOpenCreateGroupModal,
  onSwitchGroup,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-black px-6 sm:px-10 py-4 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 text-red-500 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            Vouch
          </h1>
        </div>

        {/* Active Group / Circle Switcher */}
        {groupName ? (
          <button
            onClick={onSwitchGroup}
            className="hidden md:flex items-center gap-2 px-3 py-1 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
            title="Click to view other Savings Circles"
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Circle: <strong className="text-white">{groupName}</strong></span>
            <span className="text-[10px] text-red-400 underline ml-0.5">Switch</span>
          </button>
        ) : (
          <button
            onClick={onSwitchGroup}
            className="hidden md:flex items-center gap-1.5 px-3 py-1 text-xs text-neutral-400 hover:text-white transition-colors bg-transparent border-none"
          >
            <span>Explore Circles</span>
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {onToggleTechnicalMode && (
          <button
            onClick={onToggleTechnicalMode}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors bg-transparent border-none"
          >
            <Code2 className="w-3.5 h-3.5 text-red-500" />
            <span>Tech View</span>
          </button>
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
