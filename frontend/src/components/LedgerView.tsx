import React from "react";
import { ListFilter, ExternalLink } from "lucide-react";
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
  events?: LedgerEvent[];
}

export const LedgerView: React.FC<LedgerViewProps> = ({ events = [] }) => {
  return (
    <div className="bg-[#0e0e0e] rounded-xl p-8 space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <ListFilter className="w-5 h-5 text-neutral-300" />
          <h2 className="text-lg font-bold text-white font-display">On-Chain Audit Ledger</h2>
        </div>
        <span className="text-xs text-neutral-400">MST Explorer Verified</span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 text-sm bg-black rounded-xl p-6">
          No transactions or protocol events recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-black">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-[#141414] text-neutral-400 uppercase">
              <tr>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Round</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Tx Hash</th>
                <th className="py-3 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#141414] transition-colors">
                  <td className="py-3 px-4">
                    <span className="badge">
                      {ev.eventName}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">R{ev.round}</td>
                  <td className="py-3 px-4 font-mono">{ev.member}</td>
                  <td className="py-3 px-4 text-white font-medium">{ev.amount}</td>
                  <td className="py-3 px-4">
                    <a
                      href={`${MST_TESTNET.explorerUrl}/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-royal-400 hover:text-royal-300 font-mono"
                    >
                      {ev.txHash.substring(0, 10)}...
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-3 px-4 text-neutral-400">{ev.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
