import React, { useState } from "react";
import {
  Users,
  Coins,
  Gavel,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingDown,
  Send,
} from "lucide-react";
import { GroupDetails } from "../services/contractService";

export interface MemberNode {
  id: string;
  name: string;
  address: string;
  blockNumber: number;
  hash: string;
  stakedCollateral: string;
  monthlyDues: string;
  hasPaidThisMonth: boolean;
  color: string;
  isCurrentUser?: boolean;
}

export interface BidBlock {
  id: string;
  roundNumber: number;
  blockNumber: number;
  bidderId: string;
  bidderName: string;
  bidderAddress: string;
  bidAmount: number;
  dividendSavings: number;
  timestamp: string;
  isCurrentBest: boolean;
  isNew: boolean;
}

export interface BlockchainNetworkViewProps {
  currentAccount?: string | null;
  groupDetails?: GroupDetails | null;
  onCommitBid?: (bidAmountMST: string) => Promise<void>;
}

export const BlockchainNetworkView: React.FC<BlockchainNetworkViewProps> = ({
  currentAccount,
  groupDetails,
  onCommitBid,
}) => {
  const targetPot = groupDetails
    ? Number((groupDetails.memberCount * parseFloat(groupDetails.installmentAmount || "1.0")).toFixed(2))
    : 5.0;

  const defaultMembers: MemberNode[] = [
    {
      id: "m-1",
      name: "0x7099...79C8",
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      blockNumber: 10421,
      hash: "0x8fa1...9b2a",
      stakedCollateral: "1.00 tMSTC",
      monthlyDues: "1.00",
      hasPaidThisMonth: false,
      color: "#880d19",
    },
    {
      id: "m-2",
      name: "0x3C44...93BC",
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      blockNumber: 10422,
      hash: "0x72c4...e13d",
      stakedCollateral: "1.00 tMSTC",
      monthlyDues: "1.00",
      hasPaidThisMonth: false,
      color: "#9b111e",
    },
    {
      id: "m-3",
      name: "0x90F7...b906",
      address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      blockNumber: 10423,
      hash: "0x33e8...6ca2",
      stakedCollateral: "1.00 tMSTC",
      monthlyDues: "1.00",
      hasPaidThisMonth: false,
      color: "#750a14",
    },
    {
      id: "m-4",
      name: "You",
      address: currentAccount || "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
      blockNumber: 10425,
      hash: "0x1c80...a47f",
      stakedCollateral: "1.00 tMSTC",
      monthlyDues: "1.00",
      hasPaidThisMonth: false,
      color: "#880d19",
      isCurrentUser: true,
    },
  ];

  const [members] = useState<MemberNode[]>(defaultMembers);
  const [bids, setBids] = useState<BidBlock[]>([]);
  const [customBidderId, setCustomBidderId] = useState<string>("m-4");
  const [customBidAmount, setCustomBidAmount] = useState<string>((targetPot * 0.9).toFixed(2));
  const [isProcessing, setIsProcessing] = useState(false);

  const handleManualBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const bidder = members.find((m) => m.id === customBidderId);
    if (!bidder) return;

    const parsedAmt = parseFloat(customBidAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) return;

    const dividend = Math.max(0, targetPot - parsedAmt);
    const newBidId = `bid-${Date.now()}`;
    const newBlockNum = 10500 + bids.length + 1;

    const isCurrentBest = bids.length === 0 || parsedAmt < Math.min(...bids.map((b) => b.bidAmount));

    const updatedBids = bids.map((b) => ({
      ...b,
      isCurrentBest: isCurrentBest ? false : b.isCurrentBest,
      isNew: false,
    }));

    const newBid: BidBlock = {
      id: newBidId,
      roundNumber: groupDetails?.currentRound || 1,
      blockNumber: newBlockNum,
      bidderId: bidder.id,
      bidderName: bidder.name,
      bidderAddress: bidder.address,
      bidAmount: parsedAmt,
      dividendSavings: dividend,
      timestamp: "Just now",
      isCurrentBest,
      isNew: true,
    };

    setBids([newBid, ...updatedBids]);

    if (onCommitBid) {
      try {
        setIsProcessing(true);
        await onCommitBid(customBidAmount);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="content-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#141414] text-royal-400">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                Reverse Auction Bidding Stream
              </h2>
            </div>
          </div>
        </div>

        {/* Bid Input Panel */}
        <form
          onSubmit={handleManualBid}
          className="p-4 rounded-lg bg-black flex flex-wrap items-center gap-4 text-xs"
        >
          <div className="flex items-center gap-2">
            <label className="text-neutral-400 font-semibold">Select Bidder:</label>
            <select
              value={customBidderId}
              onChange={(e) => setCustomBidderId(e.target.value)}
              className="bg-[#141414] rounded-md px-3 py-1.5 text-white font-medium focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-neutral-400 font-semibold">Payout Bid (tMSTC):</label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max={targetPot}
              value={customBidAmount}
              onChange={(e) => setCustomBidAmount(e.target.value)}
              className="w-24 bg-[#141414] rounded-md px-3 py-1.5 text-white font-mono focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="btn-primary text-xs py-1.5 px-4 ml-auto"
          >
            <Send className="w-3.5 h-3.5" />
            Place Bid Block
          </button>
        </form>

        {/* Live Bidding Blocks Stream */}
        <div className="space-y-3">
          {bids.length === 0 ? (
            <div className="text-center py-10 rounded-lg bg-black text-neutral-500 text-xs">
              No bid blocks submitted yet for this cycle.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bids.map((bid, index) => {
                const isBest = bid.isCurrentBest;
                const isBlinking = bid.isNew;

                return (
                  <div
                    key={bid.id}
                    className={`transition-all duration-300 rounded-lg border p-4 ${
                      isBest
                        ? "bg-black border-royal-600 shadow-lg"
                        : "bg-black border-neutral-900 opacity-75 hover:opacity-100"
                    } ${isBlinking ? "animate-blink-3" : ""}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-sm ${
                            isBest ? "bg-royal-600 text-white" : "bg-[#141414] text-neutral-400"
                          }`}
                        >
                          #{bids.length - index}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm font-display">
                              {bid.bidderName}
                            </span>
                            {isBest && (
                              <span className="badge text-[10px]">
                                ★ Best Bid
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                            <span className="font-mono text-[11px] text-royal-400">
                              BLOCK #{bid.blockNumber}
                            </span>
                            <span>•</span>
                            <span>{bid.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-neutral-400 font-medium">Payout Requested</p>
                          <p className="font-bold text-white font-display text-base">
                            {bid.bidAmount.toFixed(2)} <span className="text-xs text-neutral-400">tMSTC</span>
                          </p>
                        </div>

                        <div className="text-right pl-4 border-l border-neutral-900">
                          <p className="text-xs text-neutral-400 font-medium flex items-center gap-1 justify-end">
                            <TrendingDown className="w-3 h-3 text-royal-400" />
                            Group Dividend
                          </p>
                          <p className="font-bold text-royal-400 font-display text-base">
                            +{bid.dividendSavings.toFixed(2)} <span className="text-xs text-neutral-400">tMSTC</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default BlockchainNetworkView;
