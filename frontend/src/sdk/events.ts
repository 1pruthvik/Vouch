import {
  type Address,
  type PublicClient,
  type WatchContractEventReturnType,
  formatEther,
} from "viem";
import { ChitGroupABI, ChitFactoryABI } from "./contracts";
import {
  type GroupEventCallbacks,
  type UserJoinedEvent,
  type InstallmentPaidEvent,
  type BidCommittedEvent,
  type BidRevealedEvent,
  type AuctionSettledEvent,
  type DefaultAbsorbedEvent,
  type CollateralDepositedEvent,
  type CycleAdvancedEvent,
  type GroupCreatedEvent,
  PHASE_NAMES,
} from "./types";

export class VouchEventManager {
  private publicClient: PublicClient;

  constructor(publicClient: PublicClient) {
    this.publicClient = publicClient;
  }

  /**
   * Watch real-time events for a specific ChitGroup contract
   */
  public watchGroupEvents(
    groupAddress: Address,
    callbacks: GroupEventCallbacks
  ): () => void {
    const unwatch = this.publicClient.watchContractEvent({
      address: groupAddress,
      abi: ChitGroupABI,
      onLogs: (logs) => {
        for (const log of logs) {
          try {
            const eventName = (log as any).eventName;
            const args = (log as any).args;

            if (!args) continue;

            if (eventName === "UserJoined" && callbacks.onUserJoined) {
              const eventPayload: UserJoinedEvent = {
                groupAddress,
                member: args.member as Address,
                bufferDeposited: formatEther(args.bufferDeposited || 0n),
                blockNumber: log.blockNumber || 0n,
                transactionHash: log.transactionHash || ("0x0" as any),
              };
              callbacks.onUserJoined(eventPayload);
            } else if (eventName === "InstallmentPaid" && callbacks.onInstallmentPaid) {
              const eventPayload: InstallmentPaidEvent = {
                groupAddress,
                member: args.member as Address,
                round: Number(args.round || 0n),
                amount: formatEther(args.amount || 0n),
                blockNumber: log.blockNumber || 0n,
                transactionHash: log.transactionHash || ("0x0" as any),
              };
              callbacks.onInstallmentPaid(eventPayload);
            } else if (eventName === "BidCommitted" && callbacks.onBidCommitted) {
              const eventPayload: BidCommittedEvent = {
                groupAddress,
                bidder: args.bidder as Address,
                commitmentHash: args.commitmentHash,
                blockNumber: log.blockNumber || 0n,
                transactionHash: log.transactionHash || ("0x0" as any),
              };
              callbacks.onBidCommitted(eventPayload);
            } else if (eventName === "BidRevealed" && callbacks.onBidRevealed) {
              const eventPayload: BidRevealedEvent = {
                groupAddress,
                bidder: args.bidder as Address,
                bidAmount: formatEther(args.bidAmount || 0n),
                blockNumber: log.blockNumber || 0n,
                transactionHash: log.transactionHash || ("0x0" as any),
              };
              callbacks.onBidRevealed(eventPayload);
            } else if (eventName === "AuctionSettled" && callbacks.onAuctionSettled) {
              const eventPayload: AuctionSettledEvent = {
                groupAddress,
                winner: args.winner as Address,
                winningBid: formatEther(args.winningBid || 0n),
                dividendPerMember: formatEther(args.dividendPerMember || 0n),
                reserveFee: formatEther(args.reserveFee || 0n),
                round: Number(args.round || 0n),
                blockNumber: log.blockNumber || 0n,
                transactionHash: log.transactionHash || ("0x0" as any),
              };
              callbacks.onAuctionSettled(eventPayload);
            } else if (eventName === "DefaultAbsorbed" && callbacks.onDefaultAbsorbed) {
              const eventPayload: DefaultAbsorbedEvent = {
                groupAddress,
                defaulter: args.defaulter as Address,
                waterfallLayer: Number(args.layer || 0n),
                amountCovered: formatEther(args.amount || 0n),
                round: Number(args.round || 0n),
                blockNumber: log.blockNumber || 0n,
                transactionHash: log.transactionHash || ("0x0" as any),
              };
              callbacks.onDefaultAbsorbed(eventPayload);
            } else if (eventName === "CollateralDeposited" && callbacks.onCollateralDeposited) {
              const eventPayload: CollateralDepositedEvent = {
                groupAddress,
                member: args.member as Address,
                amount: formatEther(args.amount || 0n),
                blockNumber: log.blockNumber || 0n,
                transactionHash: log.transactionHash || ("0x0" as any),
              };
              callbacks.onCollateralDeposited(eventPayload);
            } else if (eventName === "CycleAdvanced" && callbacks.onCycleAdvanced) {
              const stateIndex = Number(args.newState || 0n);
              const eventPayload: CycleAdvancedEvent = {
                groupAddress,
                newRound: Number(args.newRound || 0n),
                newState: PHASE_NAMES[stateIndex] || "Forming",
                blockNumber: log.blockNumber || 0n,
                transactionHash: log.transactionHash || ("0x0" as any),
              };
              callbacks.onCycleAdvanced(eventPayload);
            }
          } catch (err: any) {
            if (callbacks.onError) callbacks.onError(err);
          }
        }
      },
      onError: (err) => {
        if (callbacks.onError) callbacks.onError(err);
      },
    });

    return unwatch;
  }

  /**
   * Watch ChitFactory GroupCreated events
   */
  public watchFactoryEvents(
    factoryAddress: Address,
    onGroupCreated: (event: GroupCreatedEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    const unwatch = this.publicClient.watchContractEvent({
      address: factoryAddress,
      abi: ChitFactoryABI,
      eventName: "GroupCreated",
      onLogs: (logs) => {
        for (const log of logs) {
          const args = (log as any).args;
          if (args) {
            onGroupCreated({
              groupAddress: args.groupAddress as Address,
              groupName: args.groupName as string,
              memberCount: Number(args.memberCount || 0n),
              installmentAmount: formatEther(args.installmentAmount || 0n),
              blockNumber: log.blockNumber || 0n,
              transactionHash: log.transactionHash || ("0x0" as any),
            });
          }
        }
      },
      onError: (err) => {
        if (onError) onError(err);
      },
    });

    return unwatch;
  }
}
