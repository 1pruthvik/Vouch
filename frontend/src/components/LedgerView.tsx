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
    let icon = <ArrowUpRight className="w-4 h-4 text-slate-400" />;
    let inrAmount = formatINR(ev.amount.split(" ")[0]);

    if (ev.eventName === "InstallmentCollected") {
      title = `Month ${ev.round} Contribution Paid`;
      isCredit = false;
      icon = <ArrowUpRight className="w-4 h-4 text-slate-400" />;
    } else if (ev.eventName === "AuctionSettled") {
      title = `Month ${ev.round} Community Draw Payout`;
      isCredit = true;
      icon = <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
    } else if (ev.eventName === "DefaultAbsorbed") {
      title = `Backup Layer Absorbed Deficit`;
      isCredit = false;
      icon = <ShieldCheck className="w-4 h-4 text-amber-400" />;
    } else if (ev.eventName === "MemberJoined") {
      title = `Security Deposit Confirmed`;
      isCredit = false;
      icon = <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    } else if (ev.eventName === "BalancesWithdrawn") {
      title = `Final Deposit & Savings Refunded`;
      isCredit = true;
      icon = <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
    }

    return { title, isCredit, icon, inrAmount };
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
    <div className="cred-card p-6 sm:p-7 border-white/5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/5">
        <div>
          <h3 className="text-base font-bold text-white font-display">Transaction History</h3>
          <p className="text-xs text-slate-400">Statement of all monthly contributions, draws, and savings credits</p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Live Bank-Grade Verification
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-white/5">
        {sampleEvents.map((ev) => {
          const { title, isCredit, icon, inrAmount } = formatTransaction(ev);

          return (
            <div
              key={ev.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-colors"
            >
              {/* Left: Icon + Title + Date */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white font-display">{title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {ev.timestamp}
                    </span>
                    <span>•</span>
                    <a
                      href={`${MST_TESTNET.explorerUrl}/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-0.5 font-medium"
                    >
                      Verify on blockchain
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right: Amount & Token Equivalent */}
              <div className="text-right pl-12 sm:pl-0">
                <p className={`text-sm font-extrabold font-display ${isCredit ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {isCredit ? `+${inrAmount}` : inrAmount}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {ev.amount}
                </p>
              </div>

              {/* Technical Mode Detail (if enabled) */}
              {isTechnicalMode && (
                <div className="w-full text-[10px] font-mono text-indigo-300/80 pt-1 flex items-center gap-2">
                  <Code2 className="w-3 h-3 text-indigo-400" />
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
