import React, { useState } from "react";
import { UserPlus, Plus, Trash2, Mail, Wallet, AlertCircle, Check, Copy, Share2, Shield } from "lucide-react";
import { ethers } from "ethers";
import { Modal } from "./ui/Modal";
import { VerificationService } from "../services/verificationService";

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleAddress: string;
  circleName: string;
  memberCount: number;
  currentMembersCount: number;
  existingWalletAddresses?: string[];
  onInvitationSent?: () => void;
  onShowNotification?: (msg: string, isError?: boolean) => void;
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  isOpen,
  onClose,
  circleAddress,
  circleName,
  memberCount,
  currentMembersCount,
  existingWalletAddresses = [],
  onInvitationSent,
  onShowNotification,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const remainingSlots = Math.max(0, memberCount - currentMembersCount);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setGeneratedLink(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanWallet = walletAddress.trim();

    if (!cleanName) {
      setErrorMsg("Participant Name is required.");
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }

    if (!cleanWallet.startsWith("0x") || cleanWallet.length !== 42 || !ethers.isAddress(cleanWallet)) {
      setErrorMsg("Please enter a valid 42-character EVM-compatible BridgeKey wallet address (0x...).");
      return;
    }

    const checksummed = ethers.getAddress(cleanWallet);

    // Duplicate check
    const isDuplicate = existingWalletAddresses.some(
      (existing) => existing.toLowerCase() === checksummed.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMsg("This wallet address is already an invited participant or member in this circle.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await VerificationService.createInvitation({
        groupAddress: circleAddress,
        name: cleanName,
        email: cleanEmail,
        walletAddress: checksummed,
      });

      const invId = result.invitation?.id || `inv-${Date.now()}`;
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const fullInviteLink = `${origin}/grouplink?circle=${circleAddress}&invite=${invId}`;
      setGeneratedLink(fullInviteLink);

      setName("");
      setEmail("");
      setWalletAddress("");

      if (onShowNotification) {
        onShowNotification(`Invitation created for ${cleanName}! Link generated.`);
      }
      if (onInvitationSent) {
        onInvitationSent();
      }
    } catch (err: any) {
      console.error("Failed to create invitation:", err);
      setErrorMsg(err.message || "Failed to record invitation on backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (onShowNotification) {
      onShowNotification("Invitation link copied to clipboard!");
    }
  };

  const handleCloseAndReset = () => {
    setName("");
    setEmail("");
    setWalletAddress("");
    setErrorMsg(null);
    setGeneratedLink(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseAndReset}
      title={
        <div className="flex items-center gap-2 text-white font-display">
          <UserPlus className="w-5 h-5 text-red-500" />
          <span>Invite Participant</span>
        </div>
      }
      description={
        <span className="text-xs text-neutral-400">
          Add a member to <strong className="text-neutral-200">{circleName}</strong>. Capacity: {currentMembersCount} / {memberCount}
        </span>
      }
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 text-xs">
        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl flex items-center gap-2.5 text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {generatedLink ? (
          <div className="p-4 bg-black border border-neutral-900 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-green-400 font-semibold text-xs">
              <Check className="w-4 h-4" />
              <span>Invitation Created Successfully</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              Share this direct invitation link with the invited participant. They will connect their BridgeKey wallet to verify and join.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 bg-neutral-900 rounded-lg px-3 py-2 text-xs font-mono text-neutral-300 border-none focus:outline-none"
              />
              <button
                type="button"
                onClick={copyInviteLink}
                className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Link"}</span>
              </button>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setGeneratedLink(null)}
                className="text-xs text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer"
              >
                + Invite Another Participant
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1.5">
                Participant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-neutral-900 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1.5">
                Participant Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. john.doe@workplace.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-neutral-900 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1.5">
                BridgeKey Wallet Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => {
                    setWalletAddress(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-neutral-900 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Must be an EVM-compatible public address (42 hex characters).
              </span>
            </div>

            <div className="pt-3 border-t border-neutral-900 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCloseAndReset}
                className="px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold transition-colors border-none cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || remainingSlots <= 0}
                className="btn-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? "Creating Invitation..." : "Send Invitation"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
