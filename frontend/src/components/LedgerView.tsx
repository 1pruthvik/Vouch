import React from "react";
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, History } from "lucide-react";
import { formatINR } from "../utils/formatters";

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
      icon = <ArrowDownLeft className="w-4 h-4 text-red-500" />;
    } else if (ev.eventName === "DefaultAbsorbed") {
      title = `Backup Layer Absorbed Deficit`;
      isCredit = false;
      icon = <ShieldCheck className="w-4 h-4 text-yellow-500" />;
    } else if (ev.eventName === "MemberJoined") {
      title = `Security Deposit Confirmed`;
      isCredit = false;
      icon = <ShieldCheck className="w-4 h-4 text-red-500" />;
    } else if (ev.eventName === "BalancesWithdrawn") {
      title = `Deposit & Savings Refunded`;
      isCredit = true;
      icon = <ArrowDownLeft className="w-4 h-4 text-red-500" />;
    }

    return { title, isCredit, icon, inrAmount };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h3 className="text-base font-bold text-white font-display">Transaction History</h3>
          <p className="text-xs text-neutral-400">On-chain ledger of contributions, draws, and dividends</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 text-neutral-500 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-neutral-300 font-display">No Transactions Yet</p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Transactions will appear here automatically once group members join, contribute, or settle draws.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((ev) => {
            const { title, isCredit, icon, inrAmount } = formatTransaction(ev);

            return (
              <div
                key={ev.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white font-display">{title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
                      <span>{ev.timestamp}</span>
                      <span>•</span>
                      <span className="font-mono">{ev.member ? `${ev.member.substring(0, 6)}...` : "Circle"}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right pl-10 sm:pl-0">
                  <p className={`text-sm font-bold font-display ${isCredit ? 'text-red-400' : 'text-neutral-200'}`}>
                    {isCredit ? `+${inrAmount}` : `-${inrAmount}`}
                  </p>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    {ev.amount}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
