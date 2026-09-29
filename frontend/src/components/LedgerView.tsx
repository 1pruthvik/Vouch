import React from "react";
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, ExternalLink, Calendar, Code2, CheckCircle2, History } from "lucide-react";
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
  const formatTransaction = (ev: LedgerEvent) => {
    let title = "Transaction";
    let isCredit = false;
    let icon = <ArrowUpRight className="w-4 h-4 text-neutral-400" />;
    let inrAmount = formatINR(ev.amount.split(" ")[0]);

    if (ev.eventName === "InstallmentCollected") {
      title = `Month ${ev.round} Contribution Paid`;
      isCredit = false;
      icon = <ArrowUpRight className="w-4 h-4 text-neutral-400" />;
    } else if (ev.eventName === "AuctionSettled") {
      title = `Month ${ev.round} Community Draw Payout`;
      isCredit = true;
      icon = <ArrowDownLeft className="w-4 h-4 text-royal-400" />;
    } else if (ev.eventName === "DefaultAbsorbed") {
      title = `Backup Layer Absorbed Deficit`;
      isCredit = false;
      icon = <ShieldCheck className="w-4 h-4 text-yellow-500" />;
    } else if (ev.eventName === "MemberJoined") {
      title = `Security Deposit Confirmed`;
      isCredit = false;
      icon = <ShieldCheck className="w-4 h-4 text-royal-400" />;
    } else if (ev.eventName === "BalancesWithdrawn") {
      title = `Deposit & Savings Refunded`;
      isCredit = true;
      icon = <ArrowDownLeft className="w-4 h-4 text-royal-400" />;
    }

    return { title, isCredit, icon, inrAmount };
  };

  return (
    <div className="content-card space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-900">
        <div>
          <h3 className="text-base font-bold text-white font-display">Transaction History</h3>
          <p className="text-xs text-neutral-400">Statement of monthly contributions, draws, and dividends</p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#141414] text-xs font-semibold text-neutral-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-royal-400" />
          On-Chain Ledger
        </div>
      </div>

      {/* Transaction List or Empty State */}
      {events.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#141414] text-neutral-500 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-neutral-300 font-display">No Transactions Yet</p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Transactions will appear here automatically once group members join, contribute, or settle draws.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-900">
          {events.map((ev) => {
            const { title, isCredit, icon, inrAmount } = formatTransaction(ev);

            return (
              <div
                key={ev.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#141414]/50 -mx-2 px-2 rounded-lg transition-colors"
              >
                {/* Left: Icon + Title + Date */}
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#141414] flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white font-display">{title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {ev.timestamp}
                      </span>
                      <span>•</span>
                      <a
                        href={`${MST_TESTNET.explorerUrl}/tx/${ev.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-royal-400 hover:text-royal-300 inline-flex items-center gap-0.5 font-medium"
                      >
                        Verify on explorer
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Token Equivalent */}
                <div className="text-right pl-12 sm:pl-0">
                  <p className={`text-sm font-extrabold font-display ${isCredit ? 'text-green-400' : 'text-neutral-200'}`}>
                    {isCredit ? `+${inrAmount}` : inrAmount}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    {ev.amount}
                  </p>
                </div>

                {/* Technical Mode Detail (if enabled) */}
                {isTechnicalMode && (
                  <div className="w-full text-[10px] font-mono text-neutral-400 pt-1 flex items-center gap-2">
                    <Code2 className="w-3 h-3 text-royal-400" />
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
