import React from "react";
import {
  Users,
  Plus,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building,
  Lock,
  Zap,
  Coins,
  ArrowUpRight,
  LogOut,
  Key,
  Wallet
} from "lucide-react";
import { UserKYCProfile } from "./KYCOnboarding";
import { AvailableCircle } from "./MemberDashboard";

export interface HubChoiceScreenProps {
  userProfile: UserKYCProfile | null;
  account?: string | null;
  availableGroups: AvailableCircle[];
  onSelectJoinOption: () => void;
  onSelectCreateOption: () => void;
  onQuickJoinCircle: (address: string) => void;
  onReVerifyKYC: () => void;
  onOpenConnectModal?: () => void;
}

export const HubChoiceScreen: React.FC<HubChoiceScreenProps> = ({
  userProfile,
  account,
  availableGroups,
  onSelectJoinOption,
  onSelectCreateOption,
  onQuickJoinCircle,
  onReVerifyKYC,
  onOpenConnectModal,
}) => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8 relative max-w-6xl mx-auto">
      {/* Background Glow */}
      <div className="absolute top-10 left-1/4 w-[450px] h-[450px] bg-[#00F5A0]/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-[#7928CA]/15 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Profile Strip */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg font-display shadow-[0_0_20px_rgba(0,245,160,0.3)]"
            style={{
              background: "linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%)",
              color: "#06080F",
            }}
          >
            {userProfile ? userProfile.fullName.substring(0, 2).toUpperCase() : "MB"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-display">
                {userProfile?.fullName || "Verified Member"}
              </h2>
              <span className="v-badge v-badge-emerald text-[10px] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                KYC Verified
              </span>
            </div>
            <p className="text-xs text-[#7A889B] mt-0.5">
              {userProfile?.communityLocation || "Bangalore Community"} · Trust Score:{" "}
              <strong className="text-[#00F5A0] font-mono">{userProfile?.trustScore || 98}/100</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* BridgeKey / Private Key Status Indicator */}
          {account ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/25 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00F5A0] anim-pulse-soft" />
              <span className="text-[#00F5A0] font-semibold">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
            </div>
          ) : (
            <button
              onClick={onOpenConnectModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#FFB800] bg-[#FFB800]/10 border border-[#FFB800]/30 hover:bg-[#FFB800]/20 transition-all"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Link BridgeKey Wallet</span>
            </button>
          )}

          <button
            onClick={onReVerifyKYC}
            className="text-xs text-[#7A889B] hover:text-white flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08]"
          >
            <LogOut className="w-3.5 h-3.5 text-[#00D9F5]" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Hero Heading */}
      <div className="text-center space-y-3 mb-10 relative z-10 max-w-xl">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-display tracking-tight leading-tight">
          Choose Your Journey
        </h1>
        <p className="text-sm sm:text-base text-[#7A889B]">
          Join an existing gated community chain with a secret group code, or deploy a new circle with secret admin approval.
        </p>
      </div>

      {/* ── 2 MAIN CHOICE CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full relative z-10 mb-12">
        {/* CARD 1: JOIN A COMMUNITY CHAIN */}
        <div
          onClick={onSelectJoinOption}
          className="v-glass-card-interactive p-8 sm:p-10 space-y-6 group flex flex-col justify-between cursor-pointer"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-[#00F5A0]/10 border border-[#00F5A0]/25 text-[#00F5A0] flex items-center justify-center shadow-[0_0_25px_rgba(0,245,160,0.2)] group-hover:scale-105 transition-transform">
                <Users className="w-7 h-7 stroke-[2.2]" />
              </div>
              <span className="v-badge v-badge-emerald">Hashed Group Code</span>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white font-display group-hover:text-[#00F5A0] transition-colors">
                Join an Existing Chain / Party
              </h3>
              <p className="text-sm text-[#7A889B] mt-2 leading-relaxed">
                Enter your invitation Hashed Group Code (e.g. <code className="text-[#00F5A0]">VOUCH-ALPHA-8D33</code>) to join verified circles.
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs text-[#7A889B]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00F5A0] flex-shrink-0" />
                <span>Instant Group Code resolver with collateral buffer preview</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00F5A0] flex-shrink-0" />
                <span>Automated UPI e-Mandates for monthly dues</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00F5A0] flex-shrink-0" />
                <span>Protected by BridgeKey cryptographic private tokens</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="v-btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 mt-4"
          >
            Enter Group Code & Join Chain
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* CARD 2: CREATE A NEW COMMUNITY CHAIN */}
        <div
          onClick={onSelectCreateOption}
          className="v-glass-card-interactive p-8 sm:p-10 space-y-6 group flex flex-col justify-between border-violet-500/20 hover:border-violet-500/40 cursor-pointer"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7928CA]/20 to-[#4F46E5]/20 border border-violet-500/30 text-[#A78BFA] flex items-center justify-center shadow-[0_0_25px_rgba(121,40,202,0.25)] group-hover:scale-105 transition-transform">
                <Plus className="w-7 h-7 stroke-[2.2]" />
              </div>
              <span className="v-badge v-badge-violet">Admin Gatekeeper</span>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white font-display group-hover:text-[#A78BFA] transition-colors">
                Create Your Community Chain
              </h3>
              <p className="text-sm text-[#7A889B] mt-2 leading-relaxed">
                Deploy an autonomous pool, generate a shareable Group Code, and approve incoming members with your Secret Passcode.
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs text-[#7A889B]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A78BFA] flex-shrink-0" />
                <span>Auto-generates shareable Hashed Group Code</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A78BFA] flex-shrink-0" />
                <span>Admin Secret Key for approving prospective members</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A78BFA] flex-shrink-0" />
                <span>Deployed directly to MST Testnet smart contracts</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="v-btn-violet w-full py-4 text-sm font-bold flex items-center justify-center gap-2 mt-4"
          >
            Deploy Chain & Get Group Code
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── QUICK ACCESS TO FEATURED CHAINS ── */}
      {availableGroups && availableGroups.length > 0 && (
        <div className="w-full space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Building className="w-4 h-4 text-[#00F5A0]" />
              Active Community Chains on MST Testnet
            </h3>
            <span className="text-xs text-[#7A889B]">Click any card to enter directly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {availableGroups.map((circle) => (
              <div
                key={circle.address}
                onClick={() => onQuickJoinCircle(circle.address)}
                className="v-glass-card p-4 space-y-3 cursor-pointer hover:border-[#00F5A0]/40 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-white font-display group-hover:text-[#00F5A0] transition-colors">
                    {circle.name}
                  </h4>
                  <span className="v-badge v-badge-emerald text-[9px] py-0.5">Active</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#7A889B] border-t border-white/[0.04] pt-2 font-mono">
                  <span>{circle.memberCount} Members</span>
                  <span className="text-[#00F5A0] font-bold font-display">₹{parseFloat(circle.installmentAmount) * 1000}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


