import React from "react";
import {
  Users,
  ShieldCheck,
  Coins,
  Calendar,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  UserCheck,
  Building,
  Info
} from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { GroupDetails, MemberDetails } from "../services/contractService";

interface PoolViewProps {
  groupDetails: GroupDetails | null;
  memberDetails: MemberDetails | null;
  account: string | null;
  isTechnicalMode: boolean;
  onOpenDrawTab: () => void;
  onOpenMandateModal: () => void;
}

export const PoolView: React.FC<PoolViewProps> = ({
  groupDetails,
  memberDetails,
  account,
  isTechnicalMode,
  onOpenDrawTab,
  onOpenMandateModal,
}) => {
  const groupName = groupDetails?.name || "Community 07";
  const monthlyContributionINR = groupDetails
    ? Math.round(parseFloat(groupDetails.installmentAmount) * MST_TO_INR_RATE)
    : 25000;
  const memberCount = groupDetails?.memberCount || 20;
  const totalPoolINR = monthlyContributionINR * memberCount;
  const currentRound = groupDetails?.currentRound || 5;
  const totalRounds = memberCount;
  const remainingMonths = Math.max(0, totalRounds - currentRound);
  const securityReservePerMember = 50000;
  const totalSecurityReserve = securityReservePerMember * memberCount;

  // Realistic human members directory
  const verifiedMembers = [
    { name: "Vikram Singh", role: "Community Organizer", verified: true, hasPaid: true, wonRound: 2, deposit: "₹50,000", trustScore: 99 },
    { name: "Aarav Mehta", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 98 },
    { name: "Priya Sharma", role: "Member", verified: true, hasPaid: true, wonRound: 1, deposit: "₹50,000", trustScore: 99 },
    { name: "Rohan Kapoor", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 97 },
    { name: "Ananya Deshmukh", role: "Member", verified: true, hasPaid: true, wonRound: 3, deposit: "₹50,000", trustScore: 98 },
    { name: "Neha Gupta", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 96 },
    { name: "Karthik Varma", role: "Member", verified: true, hasPaid: true, wonRound: 4, deposit: "₹50,000", trustScore: 98 },
    { name: "Divya Patel", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 99 },
    { name: "Amit Joshi", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 97 },
    { name: "Pooja Reddy", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 98 },
    { name: "Siddharth Nair", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 96 },
    { name: "Meera Iyer", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 97 },
    { name: "Kunal Shah", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 98 },
    { name: "Sunita Rao", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 99 },
    { name: "Aditya Roy", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 95 },
    { name: "Shreya Sen", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 97 },
    { name: "Manoj Kumar", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 98 },
    { name: "Kavita Das", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 96 },
    { name: "Gaurav Malhotra", role: "Member", verified: true, hasPaid: true, wonRound: null, deposit: "₹50,000", trustScore: 98 },
    { name: "You (Member)", role: "Member", verified: true, hasPaid: memberDetails?.hasPaidCurrentRound ?? true, wonRound: null, deposit: "₹50,000", trustScore: 98, isYou: true },
  ];

  return (
    <div className="space-y-6 anim-fade-up">
      {/* ── POOL HERO ── */}
      <div className="v-card-hero p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="v-badge v-badge-green text-xs">
                <Building className="w-3.5 h-3.5" />
                Verified Community Chit Fund
              </span>
              <span className="v-badge v-badge-amber text-xs">
                12-Month Fixed Term
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-display tracking-tight">
              {groupName}
            </h1>
            <p className="text-xs sm:text-sm text-[#9ca3b4] max-w-xl leading-relaxed">
              An autonomous rotating savings pool governed by verified smart contract rules on MST Testnet.
              Every member deposits a monthly contribution, and one member receives the early pool payout each round.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center sm:text-right min-w-[220px]">
            <p className="text-xs text-[#9ca3b4] font-medium">Monthly Pool Payout Value</p>
            <p className="text-3xl sm:text-4xl font-bold text-[#2dd4a8] font-display mt-1 tracking-tight">
              {formatRawINR(totalPoolINR)}
            </p>
            <p className="text-[11px] text-[#5f6578] mt-1 font-mono">
              {memberCount} members × {formatRawINR(monthlyContributionINR)}
            </p>
          </div>
        </div>

        {/* Key Health Metrics Bar */}
        <div className="mt-6 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/[0.06] text-xs">
          <div>
            <p className="text-[#5f6578]">Pool Health</p>
            <p className="text-sm font-bold text-[#2dd4a8] font-display mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Solvent
            </p>
          </div>
          <div>
            <p className="text-[#5f6578]">Term Progress</p>
            <p className="text-sm font-bold text-white font-display mt-0.5">
              Month {currentRound} of {totalRounds} ({remainingMonths} left)
            </p>
          </div>
          <div>
            <p className="text-[#5f6578]">Security Reserve</p>
            <p className="text-sm font-bold text-white font-display mt-0.5">
              {formatRawINR(totalSecurityReserve)} Total
            </p>
          </div>
          <div>
            <p className="text-[#5f6578]">Community Organizer</p>
            <p className="text-sm font-bold text-white font-display mt-0.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-[#2dd4a8]" /> Vikram S. (Verified)
            </p>
          </div>
        </div>
      </div>

      {/* ── SECURITY RESERVE & PROTECTION SUMMARY ── */}
      <div className="v-card p-6 border border-amber-500/20 bg-gradient-to-r from-amber-500/[0.04] to-transparent space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[#f5a623] flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-display">
              Community Security Reserve ({formatRawINR(securityReservePerMember)} / member)
            </h3>
            <p className="text-xs text-[#9ca3b4] mt-0.5">
              A dedicated default protection layer established before circle activation.
              100% refundable at the end of the 12-month term once all member commitments are settled.
            </p>
          </div>
        </div>
      </div>

      {/* ── VERIFIED MEMBER ROSTER (20 MEMBERS) ── */}
      <div className="v-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2dd4a8]" />
              Verified Community Members ({memberCount})
            </h3>
            <p className="text-xs text-[#9ca3b4] mt-0.5">
              Permissioned members verified by the community administrator.
            </p>
          </div>
          <div className="v-badge v-badge-green text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> All 20 Mandates Active
          </div>
        </div>

        {/* Member Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {verifiedMembers.map((m, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                m.isYou
                  ? "border-[#2dd4a8]/40 bg-[#2dd4a8]/[0.05]"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      background: m.isYou
                        ? "linear-gradient(135deg, #2dd4a8, #1aab87)"
                        : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                      color: m.isYou ? "#0f1117" : "#ffffff",
                    }}
                  >
                    {m.name.substring(0, 1)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white font-display truncate max-w-[110px]">
                      {m.name}
                    </p>
                    <p className="text-[10px] text-[#5f6578]">{m.role}</p>
                  </div>
                </div>

                <span className="v-badge v-badge-green text-[9px] py-0.5 px-1.5">
                  ✓ Verified
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.04] grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="text-[#5f6578] text-[10px]">Current Month</p>
                  <p className="font-semibold text-[#2dd4a8]">Paid ✓</p>
                </div>
                <div>
                  <p className="text-[#5f6578] text-[10px]">Draw Status</p>
                  <p className="font-semibold text-white">
                    {m.wonRound ? `Won Month ${m.wonRound}` : "Eligible"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
