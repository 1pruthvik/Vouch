import React, { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Lock,
  Sparkles,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code2
} from "lucide-react";
import { formatRawINR, formatINR } from "../utils/formatters";
import { MST_TESTNET } from "../config/network";
import { LedgerEvent } from "./LedgerView";

interface ActivityViewProps {
  events?: LedgerEvent[];
  isTechnicalMode: boolean;
}

export const ActivityView: React.FC<ActivityViewProps> = ({ events = [], isTechnicalMode }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "contributions" | "draws" | "yield">("all");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Realistic curated financial transaction log
  const financialRecords = [
    {
      id: "tx-1",
      category: "contributions",
      type: "Monthly Contribution",
      amount: "₹25,000",
      isCredit: false,
      status: "Completed",
      date: "5 Sep, 2026 · 10:00 AM",
      desc: "Month 4 contribution auto-debited via approved UPI e-Mandate",
      txHash: "0x8fa1b937c04128f092314a51be8c9b2a1840c9f123d88190d71a81239bf0192a",
      block: 10452,
      contract: "ChitGroup.sol (0xAf37...4D9b)",
      network: "MST Blockchain Testnet (91562037)",
    },
    {
      id: "tx-2",
      category: "draws",
      type: "Draw Dividend Received",
      amount: "+₹1,200",
      isCredit: true,
      status: "Credited",
      date: "10 Sep, 2026 · 06:30 PM",
      desc: "Month 4 auction discount surplus distributed equally among non-winning members",
      txHash: "0x33e81029cfa7718902ba12903841029cf1293810293812039182309182309182",
      block: 10488,
      contract: "Settlement.sol (0xAf37...4D9b)",
      network: "MST Blockchain Testnet (91562037)",
    },
    {
      id: "tx-3",
      category: "yield",
      type: "Treasury Yield Accrual",
      amount: "+₹2,840",
      isCredit: true,
      status: "Accrued",
      date: "15 Sep, 2026 · 12:00 PM",
      desc: "Simulated ERC-4626 core pool yield accrued to reduce upcoming cycle dues",
      txHash: "0x4b9171ef99823109283019283019283019283019283019283019283019283019",
      block: 10520,
      contract: "MockYieldVault.sol",
      network: "MST Blockchain Testnet (91562037)",
    },
    {
      id: "tx-4",
      category: "contributions",
      type: "Monthly Contribution",
      amount: "₹25,000",
      isCredit: false,
      status: "Completed",
      date: "5 Aug, 2026 · 10:00 AM",
      desc: "Month 3 contribution processed on blockchain escrow",
      txHash: "0x72c4e13d98127391827391827391827391827391827391827391827391827391",
      block: 10320,
      contract: "ChitGroup.sol (0xAf37...4D9b)",
      network: "MST Blockchain Testnet (91562037)",
    },
    {
      id: "tx-5",
      category: "draws",
      type: "Draw Payout Settlement",
      amount: "+₹4,82,000",
      isCredit: true,
      status: "Awarded",
      date: "10 Aug, 2026 · 07:00 PM",
      desc: "Month 3 draw payout transferred to winning member (Priya S.)",
      txHash: "0x9182309182309182309182309182309182309182309182309182309182309182",
      block: 10350,
      contract: "Auction.sol (0xAf37...4D9b)",
      network: "MST Blockchain Testnet (91562037)",
    },
    {
      id: "tx-6",
      category: "contributions",
      type: "Security Reserve Deposit",
      amount: "₹50,000",
      isCredit: false,
      status: "Staked",
      date: "1 Jun, 2026 · 11:30 AM",
      desc: "Initial 100% refundable collateral buffer deposited upon circle activation",
      txHash: "0x1c80a47f12389012389012389012389012389012389012389012389012389012",
      block: 10001,
      contract: "ChitPool.sol (0xAf37...4D9b)",
      network: "MST Blockchain Testnet (91562037)",
    },
  ];

  const filtered = financialRecords.filter((r) => {
    if (filter === "all") return true;
    return r.category === filter;
  });

  return (
    <div className="space-y-6 anim-fade-up">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
            Activity & Transaction History
          </h1>
          <p className="text-xs sm:text-sm text-[#9ca3b4] mt-0.5">
            Complete record of your contributions, draw dividends, security reserve, and simulated yield.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(["all", "contributions", "draws", "yield"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                filter === f
                  ? "bg-[#2dd4a8] text-[#0f1117]"
                  : "bg-white/[0.04] text-[#9ca3b4] hover:bg-white/[0.08]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── TRANSACTION LIST ── */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className="v-card p-5 transition-all border-white/[0.06] hover:border-white/[0.12]"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
              >
                {/* Left */}
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: item.isCredit ? 'rgba(45, 212, 168, 0.1)' : 'rgba(245, 166, 35, 0.1)',
                      color: item.isCredit ? '#2dd4a8' : '#f5a623',
                    }}
                  >
                    {item.isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white font-display">{item.type}</h3>
                      <span className="v-badge v-badge-green text-[9px] py-0.5 px-1.5">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#9ca3b4] mt-0.5">{item.desc}</p>
                    <p className="text-[11px] text-[#5f6578] mt-0.5">{item.date}</p>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pl-14 sm:pl-0">
                  <div className="text-left sm:text-right">
                    <p
                      className={`text-base font-bold font-display ${
                        item.isCredit ? 'text-[#2dd4a8]' : 'text-white'
                      }`}
                    >
                      {item.amount}
                    </p>
                    <span className="text-[10px] text-[#2dd4a8] font-medium flex items-center gap-1 sm:justify-end mt-0.5">
                      {isExpanded ? "Hide Verification" : "View Blockchain Details"}
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── EXPANDABLE INLINE BLOCKCHAIN VERIFICATION ── */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3 anim-fade-up text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2dd4a8] flex items-center gap-1.5 font-display text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      Smart Contract Verification Record
                    </span>
                    <a
                      href={`${MST_TESTNET.explorerUrl}/tx/${item.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2dd4a8] hover:underline flex items-center gap-1 text-[11px]"
                    >
                      Open MST Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px]">
                    <div>
                      <p className="text-[#5f6578]">Transaction Hash</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <code className="text-[#9ca3b4] truncate">{item.txHash}</code>
                        <button
                          onClick={() => copyToClipboard(item.txHash, item.id)}
                          className="text-[#5f6578] hover:text-white"
                        >
                          {copiedKey === item.id ? <Check className="w-3.5 h-3.5 text-[#2dd4a8]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[#5f6578]">Block Number</p>
                      <p className="text-white mt-0.5">#{item.block}</p>
                    </div>

                    <div>
                      <p className="text-[#5f6578]">Executing Smart Contract</p>
                      <p className="text-white mt-0.5">{item.contract}</p>
                    </div>

                    <div>
                      <p className="text-[#5f6578]">Network</p>
                      <p className="text-[#2dd4a8] mt-0.5">{item.network}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
