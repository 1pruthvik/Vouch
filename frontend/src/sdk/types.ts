import type { Address, Hash, Hex, TransactionReceipt } from "viem";

export const PHASE_NAMES = [
  "Forming",
  "Collect",
  "Commit",
  "Reveal",
  "Settle",
  "Closed",
] as const;

export type PhaseType = typeof PHASE_NAMES[number];

export interface CreateGroupParams {
  factoryAddress?: Address;
  groupName: string;
  memberCount: number;
  installmentAmount: string; // in tMSTC (e.g. "100")
  cycleDuration: number;     // in seconds
  discountCapBps: number;    // basis points (e.g. 3000 = 30%)
  reserveFeeBps: number;     // basis points (e.g. 500 = 5%)
  safetyFactorBps?: number;  // basis points (e.g. 12000 = 120%)
}

export interface GroupDetails {
  address: Address;
  name: string;
  memberCount: number;
  installmentAmount: string;
  installmentAmountRaw: bigint;
  cycleDuration: number;
  discountCapBps: number;
  reserveFeeBps: number;
  safetyFactorBps: number;
  currentState: PhaseType;
  currentRound: number;
  currentPot: string;
  currentPotRaw: bigint;
  minBid: string;
  reserveFundBalance: string;
  reserveFundBalanceRaw: bigint;
  members: Address[];
}

export interface SolvencyInfo {
  isSolvent: boolean;
  totalBacking: string;
  totalBackingRaw: bigint;
  requiredBacking: string;
  requiredBackingRaw: bigint;
}

export interface MemberDetails {
  address: Address;
  isMember?: boolean;
  bufferBalance: string;
  bufferBalanceRaw: bigint;
  lockedDividends: string;
  lockedDividendsRaw: bigint;
  paidInstallments: number;
  hasPaidCurrentRound?: boolean;
  hasWon: boolean;
  winRound: number;
  isDefaulted: boolean;
  solvency: SolvencyInfo;
}

export interface TransactionResult {
  hash: Hash;
  receipt?: TransactionReceipt;
  blockNumber?: bigint;
  status?: "success" | "reverted";
  gasUsed?: bigint;
}

export interface CreateGroupResult extends TransactionResult {
  groupAddress?: Address;
}

export interface VouchSDKConfig {
  rpcUrl?: string;
  chainId?: number;
  factoryAddress?: Address;
  registryAddress?: Address;
  yieldVaultAddress?: Address;
  mockTokenAddress?: Address;
}

// Standardized Event Interfaces
export interface GroupCreatedEvent {
  groupAddress: Address;
  groupName: string;
  memberCount: number;
  installmentAmount: string;
  blockNumber: bigint;
  transactionHash: Hash;
}

export interface UserJoinedEvent {
  groupAddress: Address;
  member: Address;
  bufferDeposited: string;
  blockNumber: bigint;
  transactionHash: Hash;
}

export interface InstallmentPaidEvent {
  groupAddress: Address;
  member: Address;
  round: number;
  amount: string;
  blockNumber: bigint;
  transactionHash: Hash;
}

export interface BidCommittedEvent {
  groupAddress: Address;
  bidder: Address;
  commitmentHash: Hex;
  blockNumber: bigint;
  transactionHash: Hash;
}

export interface BidRevealedEvent {
  groupAddress: Address;
  bidder: Address;
  bidAmount: string;
  blockNumber: bigint;
  transactionHash: Hash;
}

export interface AuctionSettledEvent {
  groupAddress: Address;
  winner: Address;
  winningBid: string;
  dividendPerMember: string;
  reserveFee: string;
  round: number;
  blockNumber: bigint;
  transactionHash: Hash;
}

export interface DefaultAbsorbedEvent {
  groupAddress: Address;
  defaulter: Address;
  waterfallLayer: number;
  amountCovered: string;
  round: number;
  blockNumber: bigint;
  transactionHash: Hash;
}

export interface CollateralDepositedEvent {
  groupAddress: Address;
  member: Address;
  amount: string;
  blockNumber: bigint;
  transactionHash: Hash;
}

export interface CycleAdvancedEvent {
  groupAddress: Address;
  newRound: number;
  newState: PhaseType;
  blockNumber: bigint;
  transactionHash: Hash;
}

export interface GroupEventCallbacks {
  onUserJoined?: (event: UserJoinedEvent) => void;
  onInstallmentPaid?: (event: InstallmentPaidEvent) => void;
  onBidCommitted?: (event: BidCommittedEvent) => void;
  onBidRevealed?: (event: BidRevealedEvent) => void;
  onAuctionSettled?: (event: AuctionSettledEvent) => void;
  onDefaultAbsorbed?: (event: DefaultAbsorbedEvent) => void;
  onCollateralDeposited?: (event: CollateralDepositedEvent) => void;
  onCycleAdvanced?: (event: CycleAdvancedEvent) => void;
  onError?: (error: Error) => void;
}
