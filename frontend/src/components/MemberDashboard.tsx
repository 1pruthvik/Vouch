import React, { useState } from "react";
import {
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Lock,
  HeartHandshake,
  CheckCircle2,
  Zap,
  Code2,
  Plus,
  UserPlus,
  Compass,
  Users,
  ArrowUpRight
} from "lucide-react";
import { formatINR, formatRawINR } from "../utils/formatters";
import { GroupDetails, MemberDetails } from "../services/contractService";
import { RiskPredictionResponse } from "../services/aiService";

export interface AvailableCircle {
  address: string;
  name: string;
  memberCount: number;
  installmentAmount: string;
}

interface MemberDashboardProps {
  account: string | null;
  groupDetails: GroupDetails | null;
  memberDetails: MemberDetails | null;
  riskAdvisory: RiskPredictionResponse | null;
  isTechnicalMode: boolean;
  isMandateActive?: boolean;
  availableGroups?: AvailableCircle[];
  onSelectGroup?: (address: string) => void;
  onPayInstallment: () => Promise<void>;
  onOpenMandateModal: () => void;
  onOpenDrawTab: () => void;
  onJoinGroup: () => void;
  onCreateGroup?: () => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  groupDetails,
  memberDetails,
  isTechnicalMode,
  isMandateActive = false,
  availableGroups = [],
  onSelectGroup,
  onPayInstallment,
  onOpenMandateModal,
  onOpenDrawTab,
  onJoinGroup,
  onCreateGroup,
}) => {
  const [isBackupLayersExpanded, setIsBackupLayersExpanded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  if (!groupDetails) {
    return (
      <div className="space-y-6">
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-500">
                <Compass className="w-4 h-4" />
                Community Savings Pools
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
                Choose a Savings Circle
              </h2>
              <p className="text-sm text-neutral-400 max-w-lg leading-relaxed">
                Join an active rotating savings pool or launch your own private circle on the MST blockchain.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {onCreateGroup && (
                <button onClick={onCreateGroup} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Start New Circle
                </button>
              )}
              <button onClick={onJoinGroup} className="btn-secondary">
                <UserPlus className="w-4 h-4" />
                Join by Address
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              Active Circles on MST Testnet
            </h3>
            {availableGroups.length > 0 && (
              <span className="text-xs text-neutral-500">Tap to select circle</span>
            )}
          </div>

          {availableGroups.length === 0 ? (
            <div className="text-center py-12 px-6 space-y-3">
              <div className="w-12 h-12 text-neutral-500 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white font-display">No Deployed Circles Found</h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Create the first savings circle on-chain or join using a contract address.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableGroups.map((circle) => {
                const instInr = Math.round(parseFloat(circle.installmentAmount || "0") * 1000);
                const potInr = instInr * circle.memberCount;

                return (
                  <div
                    key={circle.address}
                    onClick={() => onSelectGroup && onSelectGroup(circle.address)}
                    className="p-5 space-y-4 cursor-pointer transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-bold text-white font-display group-hover:text-red-400 transition-colors">
                          {circle.name}
                        </h4>
                        <p className="text-[11px] text-neutral-500 font-mono truncate max-w-[200px] mt-0.5">
                          {circle.address}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-red-400">
                        Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div>
                        <p className="text-neutral-500 text-[11px]">Monthly Deposit</p>
                        <p className="font-bold text-white font-display mt-0.5">{formatRawINR(instInr)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500 text-[11px]">Total Pot</p>
                        <p className="font-bold text-red-400 font-display mt-0.5">{formatRawINR(potInr)}</p>
                      </div>
                    </div>

                    <button className="w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 text-neutral-400 group-hover:text-red-400">
                      Enter Circle
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const groupName = groupDetails.name;
  const currentRound = groupDetails.currentRound || 1;
  const totalRounds = groupDetails.memberCount || 1;
  const rawInstallment = groupDetails.installmentAmount || "0";
  const formattedInstallment = formatINR(rawInstallment);

  const bufferBalance = memberDetails?.bufferBalance || "0";
  const lockedDividends = memberDetails?.lockedDividends || "0";
  const hasPaidCurrentRound = memberDetails?.hasPaidCurrentRound || false;
  const isMember = memberDetails?.isMember ?? false;

  const progressPercent = Math.min(100, Math.round((currentRound / totalRounds) * 100));

  const handlePay = async () => {
    try {
      setIsProcessingPayment(true);
      await onPayInstallment();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const backupLayers = [
    { num: 1, title: "Personal Buffer", desc: "If a member misses an installment, their security buffer covers it automatically." },
    { num: 2, title: "Accrued Dividends", desc: "Past savings dividends from prior rounds backstop the remaining obligation." },
    { num: 3, title: "Trusted Backer", desc: "The member's nominated social voucher absorbs deficits from staked collateral." },
    { num: 4, title: "Circle Reserve Fund", desc: "The community reserve pool cushions any remaining shortfall." },
    { num: 5, title: "Shared Adjustment", desc: "A mutual adjustment protocol guaranteeing the pot is 100% paid out every round." },
  ];

  return (
    <div className="space-y-6">
      {/* ── UPI AutoPay Status Banner ── */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 text-red-500">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white font-display">
                UPI Auto-Debit Status
              </h4>
              {isMandateActive ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-neutral-500">
                  Not Configured
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isMandateActive
                ? `Authorized for ₹${(parseFloat(rawInstallment) * 1000).toLocaleString('en-IN')}/month. Debits execute automatically on due date.`
                : "Enable automated recurring payments for on-time contributions."}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenMandateModal}
          className="btn-secondary text-xs whitespace-nowrap self-start sm:self-center"
        >
          <Zap className="w-3.5 h-3.5 text-red-500" />
          {isMandateActive ? "Manage AutoPay" : "Enable AutoPay"}
        </button>
      </div>

      {/* ── 1. Hero Contribution Section ── */}
      <div className="relative overflow-hidden space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold text-white">
                {groupName}
              </span>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-neutral-400 font-medium">Monthly Contribution</p>
              <div className="flex items-baseline gap-3 mt-0.5">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
                  {formattedInstallment}
                </h2>
                <span className="text-xs text-neutral-400 font-mono">
                  ({rawInstallment} tMSTC)
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
              {!isMember
                ? "Deposit collateral to activate your membership in this savings circle."
                : hasPaidCurrentRound
                ? "You have completed this month's contribution. The draw is currently in progress!"
                : `Monthly contribution due for Round ${currentRound}. Approved mandates execute automatically.`}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {!isMember ? (
              <button
                onClick={onJoinGroup}
                className="btn-primary w-full sm:w-auto"
              >
                Join Group with Deposit
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                {!hasPaidCurrentRound ? (
                  <button
                    onClick={handlePay}
                    disabled={isProcessingPayment}
                    className="btn-primary w-full sm:w-auto"
                  >
                    {isProcessingPayment ? "Processing..." : `Pay ${formattedInstallment}`}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onOpenDrawTab}
                    className="btn-primary w-full sm:w-auto"
                  >
                    View Round Draw
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onOpenMandateModal}
                  className="btn-secondary w-full sm:w-auto"
                >
                  <Zap className="w-4 h-4 text-red-500" />
                  Auto-Debit Mandate
                </button>
              </>
            )}
          </div>
        </div>

        {/* Round Progress Bar */}
        <div className="pt-4 relative z-10">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-white font-display">Round {currentRound} of {totalRounds}</span>
            <span className="text-neutral-400">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── 2. Core Metrics (Deposit, Dividends, Backer) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Security Deposit */}
        <div className="p-4 relative">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Security Deposit</span>
            <div className="p-1 text-red-500">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white font-display">{formatINR(bufferBalance)}</p>
          <p className="text-xs text-neutral-400 font-medium mt-1">100% Refundable at Cycle End</p>

          {!isMember && (
            <button
              onClick={onJoinGroup}
              className="mt-3 w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 text-red-400 hover:text-red-300"
            >
              Deposit to activate
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Metric 2: Accumulated Savings */}
        <div className="p-4 relative">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Accumulated Dividends</span>
            <div className="p-1 text-red-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white font-display">{formatINR(lockedDividends)}</p>
          <p className="text-xs text-neutral-400 font-medium mt-1">Earned from Reverse Auction Discounts</p>
        </div>

        {/* Metric 3: Backer / Security */}
        <div className="p-4 relative">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Backer Bond</span>
            <div className="p-1 text-red-500">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          {parseFloat(memberDetails?.solvency?.totalBacking || "0") > 0 ? (
            <div>
              <p className="text-2xl font-bold text-white font-display">
                {formatINR(memberDetails?.solvency?.totalBacking || "0")}
              </p>
              <p className="text-xs text-green-400 font-medium mt-1">Active Staked Voucher</p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-bold text-white font-display">Self-Secured</p>
              <p className="text-xs text-neutral-400 font-medium mt-1">Backed by your collateral deposit</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. 5-Layer Backup Guarantee Explainer ── */}
      <div>
        <div
          onClick={() => setIsBackupLayersExpanded(!isBackupLayersExpanded)}
          className="flex items-center justify-between cursor-pointer select-none py-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-1 text-red-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                Protected by 5 layers of on-chain backup
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Every contribution is shielded by autonomous smart contract guarantees. Click to expand.
              </p>
            </div>
          </div>
          <button className="p-2 text-neutral-400 hover:text-white transition-colors">
            {isBackupLayersExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isBackupLayersExpanded && (
          <div className="mt-4 pt-3 grid grid-cols-1 md:grid-cols-5 gap-4">
            {backupLayers.map((layer) => (
              <div key={layer.num} className="p-3 space-y-1.5">
                <span className="text-[10px] font-bold text-red-500">
                  Layer {layer.num}
                </span>
                <h4 className="text-xs font-bold text-white font-display">{layer.title}</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {layer.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. On-Chain Protocol State ── */}
      {isTechnicalMode && (
        <div className="text-xs space-y-3 py-4">
          <div className="flex items-center justify-between pb-2">
            <span className="font-bold text-neutral-200 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-red-500" />
              On-Chain Protocol State & Invariants
            </span>
            <span className="text-[10px] font-mono text-neutral-400">MST Testnet (Chain ID 91562037)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div>
              <p className="text-neutral-500">Contract Address</p>
              <p className="font-mono text-neutral-300 truncate">{groupDetails?.address || "0x..."}</p>
            </div>
            <div>
              <p className="text-neutral-500">Raw Buffer / Dividends</p>
              <p className="font-mono text-neutral-300">{bufferBalance} / {lockedDividends} tMSTC</p>
            </div>
            <div>
              <p className="text-neutral-500">Solvency Invariant</p>
              <p className="font-mono text-neutral-300">
                (Buffer + Divs) ≥ (Rem. × {groupDetails?.safetyFactorBps || 12000} bps)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
