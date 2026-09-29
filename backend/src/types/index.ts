export enum GroupState {
  Forming = 0,
  Collect = 1,
  Commit = 2,
  Reveal = 3,
  Settle = 4,
  Closed = 5,
}

export interface GroupRecord {
  address: string;
  name: string;
  member_count: number;
  installment_amount: string;
  cycle_duration: number;
  discount_cap_bps: number;
  reserve_fee_bps: number;
  safety_factor_bps: number;
  state: GroupState;
  current_round: number;
  phase_start_time: number;
  reserve_fund: string;
  current_pot: string;
  lowest_bidder: string;
  lowest_bid_amount: string;
  created_at: number;
  updated_at: number;
}

export interface MemberRecord {
  group_address: string;
  member_address: string;
  buffer_balance: string;
  locked_dividends: string;
  paid_installments: number;
  has_won: number; // 0 or 1
  win_round: number;
  is_defaulted: number; // 0 or 1
  updated_at: number;
}

export interface EventRecord {
  id?: number;
  group_address: string;
  event_name: string;
  round: number;
  member_address: string;
  amount: string;
  details_json: string;
  tx_hash: string;
  block_number: number;
  timestamp: number;
}

export interface DefaultRecord {
  id?: number;
  group_address: string;
  round: number;
  defaulter_address: string;
  waterfall_tier: number;
  amount_absorbed: string;
  tx_hash: string;
  timestamp: number;
}

export interface VouchRecord {
  record_id: string;
  voucher_address: string;
  vouchee_address: string;
  group_address: string;
  staked_amount: string;
  active: number; // 0 or 1
  tx_hash: string;
  timestamp: number;
}

export interface VoucherProfile {
  address: string;
  total_staked: string;
  locked_stake: string;
  reputation_score: number;
  active_vouchee_count: number;
  updated_at: number;
}

export interface ProtocolStats {
  total_groups: number;
  active_groups: number;
  closed_groups: number;
  total_members: number;
  total_events: number;
  total_defaults_absorbed: number;
  total_reserve_accumulated: string;
  latest_block: number;
}
