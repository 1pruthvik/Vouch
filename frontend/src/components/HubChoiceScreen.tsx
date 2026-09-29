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
  LogOut
} from "lucide-react";
import { UserKYCProfile } from "./KYCOnboarding";
import { AvailableCircle } from "./MemberDashboard";

export interface HubChoiceScreenProps {
  userProfile: UserKYCProfile | null;
  availableGroups: AvailableCircle[];
  onSelectJoinOption: () => void;
  onSelectCreateOption: () => void;
  onQuickJoinCircle: (address: string) => void;
  onReVerifyKYC: () => void;
}

export const HubChoiceScreen: React.FC<HubChoiceScreenProps> = ({
  userProfile,
  availableGroups,
  onSelectJoinOption,
  onSelectCreateOption,
  onQuickJoinCircle,
  onReVerifyKYC,
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

        <button
          onClick={onReVerifyKYC}
          className="text-xs text-[#7A889B] hover:text-white flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08]"
        >
          <LogOut className="w-3.5 h-3.5 text-[#00D9F5]" />
          Edit Identity Profile
        </button>
      </div>

      {/* Hero Heading */}
      <div className="text-center space-y-3 mb-10 relative z-10 max-w-xl">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-display tracking-tight leading-tight">
          Choose Your Journey
        </h1>
        <p className="text-sm sm:text-base text-[#7A889B]">
          Participate in a verified community chit chain or launch your own autonomous pool with custom contribution rules.
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
              <span className="v-badge v-badge-emerald">Option 1</span>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white font-display group-hover:text-[#00F5A0] transition-colors">
                Join an Existing Chain / Party
              </h3>
              <p className="text-sm text-[#7A889B] mt-2 leading-relaxed">
                Enter an invitation code or join verified apartment societies, employee savings circles, or family chit funds.
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs text-[#7A889B]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00F5A0] flex-shrink-0" />
                <span>Zero administrative fees & 100% smart contract escrow</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00F5A0] flex-shrink-0" />
                <span>Automated UPI e-Mandates for hands-free monthly savings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00F5A0] flex-shrink-0" />
                <span>Protected by 5 layers of community default security</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="v-btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 mt-4"
          >
            Explore & Join a Chain
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
              <span className="v-badge v-badge-violet">Option 2</span>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white font-display group-hover:text-[#A78BFA] transition-colors">
                Create Your Community Chain
              </h3>
              <p className="text-sm text-[#7A889B] mt-2 leading-relaxed">
                Launch an autonomous rotating savings pool for your neighborhood or friend circle in under 60 seconds.
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs text-[#7A889B]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A78BFA] flex-shrink-0" />
                <span>Custom contribution sizes (₹5,000 – ₹1,00,000/month)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A78BFA] flex-shrink-0" />
                <span>Deterministic reverse auction rules on MST Testnet</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A78BFA] flex-shrink-0" />
                <span>Automatic yield generation on idle pooled capital</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="v-btn-violet w-full py-4 text-sm font-bold flex items-center justify-center gap-2 mt-4"
          >
            Launch New Community Chain
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

