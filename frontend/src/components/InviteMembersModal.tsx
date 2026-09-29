import React, { useState } from "react";
import { UserPlus, Plus, Trash2, Shield, Mail, Wallet, AlertCircle, Sparkles, Check } from "lucide-react";
import { isAddress } from "viem";
import { Modal } from "./ui/Modal";
import { CircleData, ParticipantInput } from "../services/circleLifecycleService";

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  circle: CircleData | null;
  onSendInvitations: (participants: ParticipantInput[]) => void;
}

interface ParticipantFormRow {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  isOpen,
  onClose,
  circle,
  onSendInvitations,
}) => {
  const [participants, setParticipants] = useState<ParticipantFormRow[]>([
    { id: "row-1", name: "", email: "", walletAddress: "" },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!circle) return null;

  const currentMembersCount = circle.members.length;
  const pendingInvitesCount = circle.invitations.filter((i) => i.status === "PENDING").length;
  const remainingSlots = Math.max(0, circle.memberCount - (currentMembersCount + pendingInvitesCount));

  const handleAddRow = () => {
    setErrorMsg(null);
    if (participants.length >= remainingSlots) {
      setErrorMsg(`Cannot add more than ${remainingSlots} participant${remainingSlots === 1 ? "" : "s"}. Circle capacity is ${circle.memberCount}.`);
      return;
    }
    setParticipants([
      ...participants,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: "",
        email: "",
        walletAddress: "",
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setErrorMsg(null);
    if (participants.length <= 1) {
      // Clear instead of removing last row
      setParticipants([{ id: "row-1", name: "", email: "", walletAddress: "" }]);
      return;
    }
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleChangeField = (id: string, field: "name" | "email" | "walletAddress", value: string) => {
    setErrorMsg(null);
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Quick helper to fill a sample valid participant for rapid demo presentation
  const handleQuickFillSample = (index: number) => {
    const samples = [
      { name: "Rahul N", email: "rahul.n@gmail.com", walletAddress: "0x91F221A378D33B037A6668fOd128c4BBA28bb659" },
      { name: "Ananya Rao", email: "ananya.rao@gmail.com", walletAddress: "0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f" },
      { name: "Vikram Patel", email: "vikram.patel@gmail.com", walletAddress: "0xb794f5ea0ba39494ce839613fffba74279579268" },
      { name: "Sneha Iyer", email: "sneha.iyer@gmail.com", walletAddress: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512" },
      { name: "Priya Sharma", email: "priya.sharma@gmail.com", walletAddress: "0x39A88F110B74f5ea0ba39494ce839613fffba742" },
    ];

    const sample = samples[index % samples.length];
    setParticipants((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...sample } : p))
    );
  };

  const handleFillAllRemainingSlots = () => {
    const samples = [
      { name: "Rahul N", email: "rahul.n@gmail.com", walletAddress: "0x91F221A378D33B037A6668fOd128c4BBA28bb659" },
      { name: "Ananya Rao", email: "ananya.rao@gmail.com", walletAddress: "0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f" },
      { name: "Vikram Patel", email: "vikram.patel@gmail.com", walletAddress: "0xb794f5ea0ba39494ce839613fffba74279579268" },
      { name: "Sneha Iyer", email: "sneha.iyer@gmail.com", walletAddress: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512" },
      { name: "Priya Sharma", email: "priya.sharma@gmail.com", walletAddress: "0x39A88F110B74f5ea0ba39494ce839613fffba742" },
    ];

    const filled: ParticipantFormRow[] = [];
    const countToFill = Math.min(samples.length, remainingSlots);
    for (let i = 0; i < countToFill; i++) {
      filled.push({
        id: `row-fill-${i}`,
        ...samples[i],
      });
    }
    setParticipants(filled);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate inputs
    const cleanList: ParticipantInput[] = [];
    const emailsSeen = new Set<string>();
    const addressesSeen = new Set<string>();

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const name = p.name.trim();
      const email = p.email.trim().toLowerCase();
      const wallet = p.walletAddress.trim();

      if (!name) {
        setErrorMsg(`Participant #${i + 1}: Full Name is required.`);
        return;
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrorMsg(`Participant #${i + 1} (${name}): Please provide a valid email address.`);
        return;
      }

      if (!wallet || !isAddress(wallet)) {
        setErrorMsg(
          `Participant #${i + 1} (${name}): Invalid EVM wallet address ("${wallet}"). Must be a valid 0x-prefixed 40-hex-character address.`
        );
        return;
      }

      if (emailsSeen.has(email)) {
        setErrorMsg(`Duplicate email address "${email}" in your invitation list.`);
        return;
      }
      if (addressesSeen.has(wallet.toLowerCase())) {
        setErrorMsg(`Duplicate wallet address "${wallet}" in your invitation list.`);
        return;
      }

      emailsSeen.add(email);
      addressesSeen.add(wallet.toLowerCase());
      cleanList.push({ name, email, walletAddress: wallet });
    }

    if (cleanList.length === 0) {
      setErrorMsg("Please add at least one participant to invite.");
      return;
    }

    if (cleanList.length > remainingSlots) {
      setErrorMsg(`Cannot invite ${cleanList.length} participants. Only ${remainingSlots} open slot${remainingSlots === 1 ? "" : "s"} available.`);
      return;
    }

    setIsSubmitting(true);
    onSendInvitations(cleanList);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Circle Participants"
      description={`Add real participant details to invite them to ${circle.name} (${currentMembersCount}/${circle.memberCount} members)`}
      icon={<UserPlus className="w-5 h-5 text-[#946800]" />}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Capacity Telemetry & Quick Fill Tool */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-black/[0.02] border border-black/[0.05]">
          <div>
            <span className="text-[11px] text-[#5F6368] font-medium">Circle Capacity Status:</span>
            <p className="text-xs font-bold text-[#121316]">
              {circle.memberCount} Total Slots · {currentMembersCount} Joined · {pendingInvitesCount} Pending
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-[#137333] font-semibold border border-emerald-200">
              {remainingSlots} spots available
            </span>
            {remainingSlots > 1 && (
              <button
                type="button"
                onClick={handleFillAllRemainingSlots}
                className="text-[11px] text-[#946800] hover:text-[#7A5400] font-semibold flex items-center gap-1 hover:underline"
                title="Quickly fill sample valid addresses for demo"
              >
                <Sparkles className="w-3 h-3" />
                Fill Sample Data
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* Dynamic Participant Entry List */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
          {participants.map((p, index) => (
            <div
              key={p.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#121316] text-white text-[10px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-bold text-xs text-[#121316]">
                    Participant #{index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFillSample(index)}
                    className="text-[10px] text-[#946800] hover:text-[#7A5400] px-2 py-0.5 rounded-md hover:bg-[#E9B949]/10 transition-colors"
                  >
                    Sample Preset
                  </button>
                  {participants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(p.id)}
                      className="p-1 rounded-md text-[#8F959E] hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove participant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Form Fields for Name, Email, Wallet Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#5F6368] mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleChangeField(p.id, "name", e.target.value)}
                    placeholder="e.g. Rahul N"
                    className="v-input text-xs"
                    required
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#5F6368] mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#8F959E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={p.email}
                      onChange={(e) => handleChangeField(p.id, "email", e.target.value)}
                      placeholder="e.g. rahul@gmail.com"
                      className="v-input pl-8 text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Wallet Address (Full width) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#5F6368] mb-1 flex items-center justify-between">
                    <span>
                      Blockchain Wallet Address (MST Testnet / EVM) <span className="text-red-500">*</span>
                    </span>
                    {p.walletAddress && isAddress(p.walletAddress) && (
                      <span className="text-[10px] text-emerald-600 font-normal flex items-center gap-1">
                        <Check className="w-3 h-3" /> Valid EVM Address
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Wallet className="w-3.5 h-3.5 text-[#8F959E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={p.walletAddress}
                      onChange={(e) => handleChangeField(p.id, "walletAddress", e.target.value)}
                      placeholder="0x91F221A378D33B037A6668fOd128c4BBA28bb659"
                      className="v-input pl-8 font-mono text-[11px]"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Another Participant Button */}
        {participants.length < remainingSlots && (
          <button
            type="button"
            onClick={handleAddRow}
            className="w-full py-2.5 rounded-2xl border border-dashed border-black/[0.15] hover:border-black/[0.3] hover:bg-black/[0.02] text-xs font-semibold text-[#121316] transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#946800]" />
            + Add Another Participant ({participants.length}/{remainingSlots} slots)
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-black/[0.06]">
          <span className="text-[11px] text-[#5F6368] font-mono">
            Inviting: <strong>{participants.filter((p) => p.name && p.email && p.walletAddress).length}</strong> / {remainingSlots}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="v-btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || participants.length === 0}
              className="v-btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#E9B949]" />
              {isSubmitting
                ? "Sending..."
                : `Send ${participants.length} Invitation${participants.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
