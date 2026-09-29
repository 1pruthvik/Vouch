import React, { useState } from "react";
import { Search, UserPlus, Check, X, Shield, Mail, Users, Sparkles, AlertCircle } from "lucide-react";
import { Modal } from "./ui/Modal";
import { DEMO_USERS, DemoUser, CircleData } from "../services/circleLifecycleService";

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  circle: CircleData | null;
  onSendInvitations: (selectedUsers: DemoUser[]) => void;
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  isOpen,
  onClose,
  circle,
  onSendInvitations,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!circle) return null;

  const currentMemberAddresses = new Set(
    circle.members.map((m) => m.address.toLowerCase())
  );
  const alreadyInvitedIds = new Set(circle.invitations.map((i) => i.userId));

  const remainingSlots = Math.max(0, circle.memberCount - circle.members.length);

  // Filter available users: exclude those already members or already invited
  const eligibleUsers = DEMO_USERS.filter((user) => {
    const isMember = currentMemberAddresses.has(user.address.toLowerCase());
    const isInvited = alreadyInvitedIds.has(user.id);
    return !isMember && !isInvited;
  });

  const filteredUsers = eligibleUsers.filter((user) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.address.toLowerCase().includes(query)
    );
  });

  const handleToggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      if (selectedUserIds.length >= remainingSlots) {
        return; // Capacity limit reached
      }
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSelectAllEligible = () => {
    const toSelect = filteredUsers.slice(0, remainingSlots).map((u) => u.id);
    setSelectedUserIds(toSelect);
  };

  const handleClearSelection = () => {
    setSelectedUserIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const usersToInvite = DEMO_USERS.filter((u) => selectedUserIds.includes(u.id));
    onSendInvitations(usersToInvite);
    setIsSubmitting(false);
    setSelectedUserIds([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Circle Participants"
      description={`Invite members to join ${circle.name} (${circle.members.length}/${circle.memberCount} joined)`}
      icon={<UserPlus className="w-5 h-5 text-[#946800]" />}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Search Bar & Capacity Badge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#5F6368] font-medium">
              Circle Capacity: <strong className="text-[#121316]">{circle.memberCount} members</strong>
            </span>
            <span className="text-[#137333] font-semibold">
              {remainingSlots} spots available
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#8F959E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email or wallet address..."
              className="v-input pl-9 pr-4 text-xs"
              autoFocus
            />
          </div>
        </div>

        {/* Quick Selection Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllEligible}
              disabled={eligibleUsers.length === 0 || remainingSlots === 0}
              className="text-[11px] font-semibold text-[#946800] hover:text-[#7A5400] disabled:opacity-40"
            >
              Select All Eligible ({Math.min(eligibleUsers.length, remainingSlots)})
            </button>
            {selectedUserIds.length > 0 && (
              <>
                <span className="text-[#8F959E]">·</span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-[11px] text-[#5F6368] hover:text-[#121316]"
                >
                  Clear Selection
                </button>
              </>
            )}
          </div>

          <span className="text-[11px] font-mono text-[#5F6368]">
            Selected: <strong className="text-[#121316]">{selectedUserIds.length}</strong> / {remainingSlots}
          </span>
        </div>

        {/* User Directory List */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 no-scrollbar border border-black/[0.06] rounded-2xl p-2 bg-black/[0.01]">
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-[#5F6368] space-y-1">
              <Users className="w-6 h-6 text-[#8F959E] mx-auto opacity-50" />
              <p className="font-medium text-xs text-[#121316]">No eligible participants found</p>
              <p className="text-[11px]">
                {searchQuery
                  ? "Try another search term."
                  : "All available demo participants are already invited or joined."}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);
              const isAtCapacity = selectedUserIds.length >= remainingSlots && !isSelected;

              return (
                <div
                  key={user.id}
                  onClick={() => !isAtCapacity && handleToggleUser(user.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-white border-[#E9B949] shadow-sm ring-1 ring-[#E9B949]/30"
                      : isAtCapacity
                      ? "opacity-40 cursor-not-allowed bg-black/[0.02] border-transparent"
                      : "bg-white/60 hover:bg-white border-black/[0.04] hover:border-black/[0.08]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full ${user.avatarBg} text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm`}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-[#121316] truncate">{user.name}</p>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-[#137333] font-mono">
                          Score: {user.creditScore}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5F6368] truncate flex items-center gap-1 font-mono">
                        <Mail className="w-2.5 h-2.5 text-[#8F959E]" />
                        {user.email} · {user.address.substring(0, 6)}...{user.address.substring(user.address.length - 4)}
                      </p>
                    </div>
                  </div>

                  <div className="pl-2 flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#121316] text-white"
                          : "border border-black/[0.15] hover:border-black/[0.3]"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Demo Mode Notice */}
        <div className="p-3 rounded-xl bg-[#FAF9F5] border border-black/[0.06] flex items-start gap-2 text-[11px] text-[#5F6368]">
          <Sparkles className="w-3.5 h-3.5 text-[#946800] mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            Invitations are stored in the application workspace. You will be able to simulate invitation acceptance to demonstrate the full savings circle lifecycle.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="v-btn-secondary text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={selectedUserIds.length === 0 || isSubmitting}
            className="v-btn-primary text-xs px-5"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#E9B949]" />
            {isSubmitting
              ? "Sending..."
              : `Send ${selectedUserIds.length} Invitation${selectedUserIds.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
