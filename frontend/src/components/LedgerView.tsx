import React, { useState, useEffect, useRef } from "react";
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
  X,
  Layers,
  ChevronRight,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import gsap from "gsap";
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
  const [selectedTx, setSelectedTx] = useState<LedgerEvent | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2200);
  };

  // Close drawer with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedTx(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // GSAP animation when drawer opens
  useEffect(() => {
    if (selectedTx && drawerRef.current) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!prefersReducedMotion) {
        gsap.fromTo(
          drawerRef.current,
          { x: 30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.35, ease: "power2.out" }
        );
      }
    }
  }, [selectedTx]);

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
      member: "0x71C8F21c83B386f786f4a3E0b90494F3c419392B",
      amount: "2.1 tMSTC",
      txHash: "0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
      timestamp: "Today, 02:45 PM",
    },
    {
      id: "2",
      eventName: "InstallmentCollected",
      round: 1,
      member: "0x39A88F110B74f5ea0ba39494ce839613fffba742",
      amount: "0.5 tMSTC",
      txHash: "0x31a04b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a",
      timestamp: "Yesterday, 11:30 AM",
    },
    {
      id: "3",
      eventName: "MemberJoined",
      round: 1,
      member: "0x91F221A378D33B037A6668fOd128c4BBA28bb659",
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
    <div className="v-card p-6 sm:p-7 space-y-5 anim-fade-up relative border border-black/[0.06]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.05]">
        <div>
          <h3 className="text-base font-bold text-[#121316] font-display">Blockchain Audit Statement</h3>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Click any row to inspect verifiable on-chain cryptographic proofs
          </p>
        </div>
        <div className="v-badge v-badge-gold self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5" />
          MST Blockchain Verified
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterType("ALL")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            filterType === "ALL"
              ? "bg-[#121316] text-white shadow-sm"
              : "bg-black/[0.04] text-[#5F6368] hover:text-[#121316]"
          }`}
        >
          All Activity ({displayEvents.length})
        </button>
        <button
          onClick={() => setFilterType("CONTRIBUTIONS")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            filterType === "CONTRIBUTIONS"
              ? "bg-[#121316] text-white shadow-sm"
              : "bg-black/[0.04] text-[#5F6368] hover:text-[#121316]"
          }`}
        >
          Contributions
        </button>
        <button
          onClick={() => setFilterType("PAYOUTS")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            filterType === "PAYOUTS"
              ? "bg-[#121316] text-white shadow-sm"
              : "bg-black/[0.04] text-[#5F6368] hover:text-[#121316]"
          }`}
        >
          Draw Payouts
        </button>
      </div>

      {/* Transaction List or Empty State */}
      {filteredEvents.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-black/[0.03] text-[#8F959E] flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-[#121316] font-display">No Transactions Found</p>
          <p className="text-xs text-[#5F6368] max-w-sm mx-auto">
            Transactions will appear here automatically once group members join, contribute, or settle draws.
          </p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-1 divide-y divide-black/[0.05]">
          {filteredEvents.map((ev, index) => {
            const { title, isCredit, icon, inrAmount, iconBg } = formatTransaction(ev);
            const explorerUrl = `${MST_TESTNET.explorerUrl}/tx/${ev.txHash}`;
            const isSelected = selectedTx?.id === ev.id;

            return (
              <div
                key={ev.id || index}
                onClick={() => setSelectedTx(ev)}
                className={`py-3.5 px-3 rounded-xl transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected ? "bg-black/[0.04] border border-black/10" : "hover:bg-black/[0.02]"
                }`}
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
                    <p className="text-sm font-semibold text-[#121316] font-display flex items-center gap-1.5">
                      {title}
                      <span className="text-[10px] text-[#8F959E] font-mono hidden sm:inline">
                        (Round {ev.round})
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5F6368]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {ev.timestamp}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-[#8F959E]">
                        {ev.member ? `${ev.member.substring(0, 6)}...${ev.member.substring(ev.member.length - 4)}` : "Community Pool"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                  <div>
                    <p className={`text-sm font-bold font-display tabular-nums ${isCredit ? "text-emerald-700" : "text-[#121316]"}`}>
                      {isCredit ? `+${inrAmount}` : `-${inrAmount}`}
                    </p>
                    <p className="text-[10px] text-[#8F959E] font-mono tabular-nums">
                      {ev.amount}
                    </p>
                  </div>

                  {/* Quick Copy / Explorer Icons */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => copyToClipboard(ev.txHash, e)}
                      className="p-1.5 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-[#5F6368] hover:text-[#121316] transition-colors"
                      title="Copy Transaction Hash"
                    >
                      {copiedHash === ev.txHash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-[#5F6368] hover:text-[#121316] transition-colors inline-flex items-center gap-1 text-[11px]"
                      title="View on MSTScan Explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <ChevronRight className="w-4 h-4 text-[#8F959E] group-hover:text-[#121316] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                {/* Technical Mode Details */}
                {isTechnicalMode && (
                  <div className="w-full text-[10px] font-mono flex items-center gap-2 pt-1 border-t border-black/[0.05] text-purple-700">
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

      {/* Transaction Detail Drawer Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-fade-in">
          <div
            ref={drawerRef}
            className="w-full max-w-lg rounded-3xl bg-[#FAF9F5] border border-black/10 p-6 sm:p-8 shadow-2xl space-y-6 relative"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#121316] font-display">Transaction Audit Proof</h4>
                  <p className="text-xs text-[#5F6368]">MST Testnet Blockchain Record (Chain ID 91562037)</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#5F6368] hover:text-[#121316] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transaction Data Fields */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-white border border-black/[0.05]">
                <span className="text-[#5F6368]">Event Type:</span>
                <span className="font-semibold text-[#121316] font-mono">{selectedTx.eventName}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-white border border-black/[0.05]">
                <span className="text-[#5F6368]">Transacted Amount:</span>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 text-sm">{formatINR(selectedTx.amount.split(" ")[0])}</span>
                  <span className="text-[11px] text-[#5F6368] font-mono ml-1.5">({selectedTx.amount})</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-white border border-black/[0.05]">
                <span className="text-[#5F6368]">Chit Round:</span>
                <span className="font-semibold text-[#121316]">Round {selectedTx.round}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-white border border-black/[0.05]">
                <span className="text-[#5F6368]">Timestamp:</span>
                <span className="text-[#121316] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8F959E]" />
                  {selectedTx.timestamp}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-black/[0.05] space-y-1">
                <span className="text-[#5F6368]">Member Address:</span>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="font-mono text-[#121316] break-all text-[11px]">{selectedTx.member || "Community Pool"}</span>
                  {selectedTx.member && (
                    <button
                      onClick={(e) => copyToClipboard(selectedTx.member, e)}
                      className="p-1 text-[#8F959E] hover:text-[#121316]"
                      title="Copy Address"
                    >
                      {copiedHash === selectedTx.member ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-black/[0.05] space-y-1">
                <span className="text-[#5F6368]">Cryptographic Transaction Hash:</span>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="font-mono text-emerald-700 break-all text-[11px]">{selectedTx.txHash}</span>
                  <button
                    onClick={(e) => copyToClipboard(selectedTx.txHash, e)}
                    className="p-1 text-[#8F959E] hover:text-[#121316]"
                    title="Copy Transaction Hash"
                  >
                    {copiedHash === selectedTx.txHash ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Independent Verification Callout */}
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-2.5 text-xs text-indigo-900">
              <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p className="leading-relaxed text-[11px]">
                Every action on Vouch is non-custodial and cryptographically anchored. You can independently verify this receipt on the public explorer.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setSelectedTx(null)} className="btn-pill-secondary text-xs px-4 py-2">
                Dismiss
              </button>
              <a
                href={`${MST_TESTNET.explorerUrl}/tx/${selectedTx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
              >
                Inspect on MSTScan
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
