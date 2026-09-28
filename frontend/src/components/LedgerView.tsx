import React from "react";
import { ListFilter, ExternalLink, ShieldAlert, CheckCircle2 } from "lucide-react";
import { MST_TESTNET } from "../config/network";

interface LedgerEvent {
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
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  events = [
    {
      id: "1",
      eventName: "AuctionSettled",
      round: 1,
      member: "0x71C...392B",
      amount: "2.1 tMSTC",
      txHash: "0x58f...91a",
      timestamp: "10 mins ago",
    },
    {
      id: "2",
      eventName: "InstallmentCollected",
      round: 2,
      member: "0x39A...881F",
      amount: "0.5 tMSTC",
      txHash: "0x31a...04b",
      timestamp: "5 mins ago",
    },
    {
      id: "3",
      eventName: "DefaultAbsorbed",
      round: 2,
      member: "0x91F...221A",
      amount: "0.5 tMSTC (Buffer Tier 1)",
      txHash: "0x77d...88c",
      timestamp: "1 min ago",
    },
  ],
}) => {
  return (
    <div className="glass-card p-6 border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListFilter className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white font-display">On-Chain Audit Ledger</h2>
        </div>
        <span className="text-xs text-slate-400">Live MST Explorer Sync</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 border-b border-white/5 uppercase">
            <tr>
              <th className="py-2.5 px-3">Event</th>
              <th className="py-2.5 px-3">Round</th>
              <th className="py-2.5 px-3">Member</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Tx Hash</th>
              <th className="py-2.5 px-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-3">
                  <span
                    className={`badge ${
                      ev.eventName === "DefaultAbsorbed"
                        ? "badge-danger"
                        : ev.eventName === "AuctionSettled"
                        ? "badge-success"
                        : "badge-indigo"
                    }`}
                  >
                    {ev.eventName}
                  </span>
                </td>
                <td className="py-3 px-3 font-semibold text-white">R{ev.round}</td>
                <td className="py-3 px-3 font-mono">{ev.member}</td>
                <td className="py-3 px-3 text-white font-medium">{ev.amount}</td>
                <td className="py-3 px-3">
                  <a
                    href={`${MST_TESTNET.explorerUrl}/tx/${ev.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-mono"
                  >
                    {ev.txHash.substring(0, 10)}...
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="py-3 px-3 text-slate-400">{ev.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
