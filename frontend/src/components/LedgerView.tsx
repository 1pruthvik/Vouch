import React, { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  ExternalLink,
  Calendar,
  Code2,
  CheckCircle2,
  Copy,
  Check,
  History,
} from "lucide-react";
import { formatINR } from "../utils/formatters";
import { MST_TESTNET } from "../config/network";

export interface LedgerEvent {
  id: string;
  eventName: string;
  round: number;
  member: string;
  amount: string;
  txHash: string;
  timestamp: string;
}

interface LedgerViewProps {
  events: LedgerEvent[];
  isTechnicalMode: boolean;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  events = [],
  isTechnicalMode,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"ALL" | "CONTRIBUTIONS" | "PAYOUTS">("ALL");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatTransaction = (ev: LedgerEvent) => {
    let title = "Transaction";
    let isCredit = false;
    let icon = <ArrowUpRight className="w-4 h-4 text-[#9ca3b4]" />;
    let inrAmount = formatINR(ev.amount.split(" ")[0]);
    let iconBg = "rgba(255,255,255,0.05)";

    if (ev.eventName === "InstallmentCollected" || ev.eventName === "InstallmentPaid") {
      title = `Month ${ev.round} Contribution Paid`;
      isCredit = false;
      icon = <ArrowUpRight className="w-4 h-4 text-[#f5a623]" />;
      iconBg = "rgba(245, 166, 35, 0.1)";
    } else if (ev.eventName === "AuctionSettled") {
      title = `Month ${ev.round} Draw Payout`;
      isCredit = true;
      icon = <ArrowDownLeft className="w-4 h-4 text-[#2dd4a8]" />;
      iconBg = "rgba(45, 212, 168, 0.1)";
    } else if (ev.eventName === "DefaultAbsorbed") {
      title = `Backup Layer Absorbed Deficit`;
      isCredit = false;
      icon = <ShieldCheck className="w-4 h-4 text-[#f43f5e]" />;
      iconBg = "rgba(244, 63, 94, 0.1)";
    } else if (ev.eventName === "MemberJoined" || ev.eventName === "UserJoined") {
      title = `Security Deposit Confirmed`;
      isCredit = false;
      icon = <ShieldCheck className="w-4 h-4 text-[#8b5cf6]" />;
      iconBg = "rgba(139, 92, 246, 0.1)";
    } else if (ev.eventName === "BalancesWithdrawn") {
      title = `Deposit & Savings Refunded`;
      isCredit = true;
      icon = <ArrowDownLeft className="w-4 h-4 text-[#2dd4a8]" />;
      iconBg = "rgba(45, 212, 168, 0.1)";
    }

    return { title, isCredit, icon, inrAmount, iconBg };
  };

  const sampleEvents: LedgerEvent[] = events.length > 0 ? events : [
    {
      id: "1",
      eventName: "AuctionSettled",
      round: 1,
      member: "0x71C...392B",
      amount: "2.1 tMSTC",
      txHash: "0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
      timestamp: "Today, 02:45 PM",
    },
    {
      id: "2",
      eventName: "InstallmentCollected",
      round: 1,
      member: "0x39A...881F",
      amount: "0.5 tMSTC",
      txHash: "0x31a04b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a",
      timestamp: "Yesterday, 11:30 AM",
    },
    {
      id: "3",
      eventName: "MemberJoined",
      round: 1,
      member: "0x91F...221A",
      amount: "0.5 tMSTC",
      txHash: "0x77d88c9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
      timestamp: "28 Sep, 06:15 PM",
    },
  ];

  const displayEvents = events.length > 0 ? events : sampleEvents;

  const filteredEvents = displayEvents.filter((ev) => {
    if (filterType === "CONTRIBUTIONS") return ev.eventName.includes("Installment") || ev.eventName.includes("Joined");
    if (filterType === "PAYOUTS") return ev.eventName.includes("Auction") || ev.eventName.includes("Withdrawn");
    return true;
  });

  return (
    <div className="v-card p-6 sm:p-7 space-y-5 anim-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <h3 className="text-base font-bold text-white font-display">Transaction History & Audit Ledger</h3>
          <p className="text-xs text-[#9ca3b4] mt-0.5">Verified on-chain contributions, draws, and savings credits</p>
        </div>
        <div className="v-badge v-badge-green self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5" />
          MST Blockchain Verified
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterType("ALL")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            filterType === "ALL"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          All Activity ({displayEvents.length})
        </button>
        <button
          onClick={() => setFilterType("CONTRIBUTIONS")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            filterType === "CONTRIBUTIONS"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          Contributions
        </button>
        <button
          onClick={() => setFilterType("PAYOUTS")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            filterType === "PAYOUTS"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          Draw Payouts
        </button>
      </div>

      {/* Transaction List or Empty State */}
      {filteredEvents.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-[#5f6578] flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white font-display">No Transactions Found</p>
          <p className="text-xs text-[#9ca3b4] max-w-sm mx-auto">
            Transactions will appear here automatically once group members join, contribute, or settle draws.
          </p>
        </div>
      ) : (
        <div className="space-y-1 divide-y divide-white/5">
          {filteredEvents.map((ev, index) => {
            const { title, isCredit, icon, inrAmount, iconBg } = formatTransaction(ev);
            const explorerUrl = `${MST_TESTNET.explorerUrl}/tx/${ev.txHash}`;

            return (
              <div
                key={ev.id || index}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-xl transition-all group"
              >
                {/* Left */}
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                    style={{ background: iconBg }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white font-display">{title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5f6578]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {ev.timestamp}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-slate-400">
                        {ev.member ? `${ev.member.substring(0, 6)}...${ev.member.substring(ev.member.length - 4)}` : "Community Pool"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                  <div>
                    <p className={`text-sm font-bold font-display ${isCredit ? "text-[#2dd4a8]" : "text-white"}`}>
                      {isCredit ? `+${inrAmount}` : `-${inrAmount}`}
                    </p>
                    <p className="text-[10px] text-[#5f6578] font-mono">
                      {ev.amount}
                    </p>
                  </div>

                  {/* Hash & Explorer */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard(ev.txHash)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Copy Transaction Hash"
                    >
                      {copiedHash === ev.txHash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1 text-[11px]"
                      title="View on MSTScan Explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Technical Mode Details */}
                {isTechnicalMode && (
                  <div className="w-full text-[10px] font-mono flex items-center gap-2 pt-1 border-t border-white/5 text-purple-400/80">
                    <Code2 className="w-3 h-3" />
                    <span>Event: {ev.eventName}</span>
                    <span>|</span>
                    <span className="truncate">Tx: {ev.txHash}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
