import React from "react";
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, ExternalLink, Calendar, Code2, CheckCircle2 } from "lucide-react";
import { formatINR, formatRawINR } from "../utils/formatters";
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
  // Map raw on-chain events to friendly UPI / Bank statement transactions
  const formatTransaction = (ev: LedgerEvent) => {
    let title = "Transaction";
    let isCredit = false;
    let icon = <ArrowUpRight className="w-4 h-4 text-[#9ca3b4]" />;
    let inrAmount = formatINR(ev.amount.split(" ")[0]);
    let iconBg = 'rgba(255,255,255,0.05)';

    if (ev.eventName === "InstallmentCollected") {
      title = `Month ${ev.round} Contribution Paid`;
      isCredit = false;
      icon = <ArrowUpRight className="w-4 h-4 text-[#f5a623]" />;
      iconBg = 'rgba(245, 166, 35, 0.1)';
    } else if (ev.eventName === "AuctionSettled") {
      title = `Month ${ev.round} Draw Payout`;
      isCredit = true;
      icon = <ArrowDownLeft className="w-4 h-4 text-[#2dd4a8]" />;
      iconBg = 'rgba(45, 212, 168, 0.1)';
    } else if (ev.eventName === "DefaultAbsorbed") {
      title = `Backup Layer Absorbed Deficit`;
      isCredit = false;
      icon = <ShieldCheck className="w-4 h-4 text-[#f43f5e]" />;
      iconBg = 'rgba(244, 63, 94, 0.1)';
    } else if (ev.eventName === "MemberJoined") {
      title = `Security Deposit Confirmed`;
      isCredit = false;
      icon = <ShieldCheck className="w-4 h-4 text-[#8b5cf6]" />;
      iconBg = 'rgba(139, 92, 246, 0.1)';
    } else if (ev.eventName === "BalancesWithdrawn") {
      title = `Deposit & Savings Refunded`;
      isCredit = true;
      icon = <ArrowDownLeft className="w-4 h-4 text-[#2dd4a8]" />;
      iconBg = 'rgba(45, 212, 168, 0.1)';
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

  return (
    <div className="v-card p-6 sm:p-7 space-y-5 anim-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white font-display">Transaction History</h3>
          <p className="text-xs text-[#9ca3b4] mt-0.5">Contributions, draws, and savings credits</p>
        </div>
        <div className="v-badge v-badge-green">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified On-Chain
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-1">
        {sampleEvents.map((ev, index) => {
          const { title, isCredit, icon, inrAmount, iconBg } = formatTransaction(ev);

          return (
            <div
              key={ev.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl transition-all duration-200 hover:bg-white/[0.02] group"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Left */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105" style={{ background: iconBg }}>
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5f6578]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {ev.timestamp}
                    </span>
                    <span>·</span>
                    <a
                      href={`${MST_TESTNET.explorerUrl}/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 font-medium transition-colors duration-200"
                      style={{ color: '#2dd4a8' }}
                    >
                      Verify
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="text-right pl-12 sm:pl-0">
                <p className={`text-sm font-bold font-display ${isCredit ? 'text-[#2dd4a8]' : 'text-white'}`}>
                  {isCredit ? `+${inrAmount}` : inrAmount}
                </p>
                <p className="text-[10px] text-[#5f6578] font-mono">
                  {ev.amount}
                </p>
              </div>

              {/* Technical */}
              {isTechnicalMode && (
                <div className="w-full text-[10px] font-mono flex items-center gap-2 pt-1" style={{ color: 'rgba(139, 92, 246, 0.6)' }}>
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
    </div>
  );
};
