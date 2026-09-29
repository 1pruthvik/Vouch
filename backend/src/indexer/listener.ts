import { ethers } from "ethers";
import { db } from "../db/database";
import { CONFIG } from "../config";
import ChitFactoryAbi from "../abis/ChitFactory.json";
import ChitGroupAbi from "../abis/ChitGroup.json";
import VouchRegistryAbi from "../abis/VouchRegistry.json";
import { GroupState } from "../types";

export class IndexerService {
  private provider: ethers.JsonRpcProvider;
  private isRunning: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private factoryContract: ethers.Contract | null = null;
  private vouchRegistryContract: ethers.Contract | null = null;
  private trackedGroups: Set<string> = new Set();

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    if (CONFIG.FACTORY_ADDRESS && ethers.isAddress(CONFIG.FACTORY_ADDRESS)) {
      this.factoryContract = new ethers.Contract(CONFIG.FACTORY_ADDRESS, ChitFactoryAbi, this.provider);
    }
    if (CONFIG.VOUCH_REGISTRY_ADDRESS && ethers.isAddress(CONFIG.VOUCH_REGISTRY_ADDRESS)) {
      this.vouchRegistryContract = new ethers.Contract(CONFIG.VOUCH_REGISTRY_ADDRESS, VouchRegistryAbi, this.provider);
    }
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    console.log(`📡 Vouch Indexer started on ${CONFIG.MST_RPC_URL} (Chain ID: ${CONFIG.CHAIN_ID})`);

    // Load existing groups from database into memory
    const existingGroups = db.getGroups();
    for (const g of existingGroups) {
      this.trackedGroups.add(g.address.toLowerCase());
    }
    console.log(`📋 Loaded ${this.trackedGroups.size} existing groups from DB into indexer.`);

    // Fetch initial state from factory if deployed
    await this.discoverFactoryGroups();

    // Start block polling loop
    this.pollLoop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    console.log("🛑 Vouch Indexer stopped.");
  }

  public trackGroup(groupAddress: string): void {
    if (!ethers.isAddress(groupAddress)) return;
    const addr = groupAddress.toLowerCase();
    if (!this.trackedGroups.has(addr)) {
      this.trackedGroups.add(addr);
      console.log(`➕ Indexer now tracking group: ${addr}`);
    }
    // Sync state immediately
    this.syncGroupState(addr).catch((err) =>
      console.warn(`Failed initial sync for group ${addr}:`, err.message)
    );
  }

  private async discoverFactoryGroups(): Promise<void> {
    if (!this.factoryContract) return;
    try {
      const deployed: string[] = await this.factoryContract.getDeployedGroups();
      console.log(`🔍 Factory reports ${deployed.length} deployed groups.`);
      for (const groupAddr of deployed) {
        this.trackGroup(groupAddr);
      }
    } catch (err: any) {
      console.warn(`⚠️ Could not query factory deployed groups:`, err.message);
    }
  }

  private async pollLoop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.syncNewBlocks();
    } catch (err: any) {
      console.error(`⚠️ Indexer block sync error:`, err.message);
    }

    if (this.isRunning) {
      this.pollTimer = setTimeout(() => this.pollLoop(), CONFIG.POLL_INTERVAL_MS);
    }
  }

  public async syncNewBlocks(): Promise<void> {
    const currentBlock = await this.provider.getBlockNumber();
    let lastBlock = db.getSyncBlock();

    if (lastBlock === 0) {
      // First sync: scan last 100 blocks or start from currentBlock - 50
      lastBlock = Math.max(0, currentBlock - 50);
    }

    if (currentBlock < lastBlock) {
      db.setSyncBlock(currentBlock);
      return;
    }

    if (currentBlock === lastBlock) {
      return; // Up to date
    }

    const fromBlock = lastBlock + 1;
    const toBlock = Math.min(currentBlock, fromBlock + 99); // 100 blocks max per batch

    // 1. Index Factory Events
    if (this.factoryContract) {
      await this.indexFactoryEvents(fromBlock, toBlock);
    }

    // 2. Index Vouch Registry Events
    if (this.vouchRegistryContract) {
      await this.indexVouchRegistryEvents(fromBlock, toBlock);
    }

    // 3. Index Tracked Groups
    for (const groupAddress of Array.from(this.trackedGroups)) {
      await this.indexGroupEvents(groupAddress, fromBlock, toBlock);
    }

    db.setSyncBlock(toBlock);
  }

  private async indexFactoryEvents(fromBlock: number, toBlock: number): Promise<void> {
    if (!this.factoryContract) return;
    try {
      const filter = this.factoryContract.filters.GroupCreated();
      const events = await this.factoryContract.queryFilter(filter, fromBlock, toBlock);

      for (const event of events) {
        if ("args" in event) {
          const { groupAddress, groupName, memberCount, installmentAmount, cycleDuration } = event.args as any;
          console.log(`✨ GroupCreated detected: ${groupName} (${groupAddress})`);

          db.upsertGroup({
            address: groupAddress,
            name: groupName,
            member_count: Number(memberCount),
            installment_amount: installmentAmount.toString(),
            cycle_duration: Number(cycleDuration),
            state: GroupState.Forming,
            current_round: 0,
            created_at: Math.floor(Date.now() / 1000),
          });

          this.trackGroup(groupAddress);

          db.recordEvent({
            group_address: groupAddress,
            event_name: "GroupCreated",
            round: 0,
            member_address: "",
            amount: installmentAmount.toString(),
            details_json: JSON.stringify({ groupName, memberCount: Number(memberCount), cycleDuration: Number(cycleDuration) }),
            tx_hash: event.transactionHash,
            block_number: event.blockNumber,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      }
    } catch (err: any) {
      console.warn(`Error querying factory events:`, err.message);
    }
  }

  private async indexVouchRegistryEvents(fromBlock: number, toBlock: number): Promise<void> {
    if (!this.vouchRegistryContract) return;
    try {
      // StakeDeposited
      const depositEvents = await this.vouchRegistryContract.queryFilter(
        this.vouchRegistryContract.filters.StakeDeposited(),
        fromBlock,
        toBlock
      );
      for (const ev of depositEvents) {
        if ("args" in ev) {
          const { voucher, amount } = ev.args as any;
          await this.syncVoucher(voucher);
          db.recordEvent({
            group_address: CONFIG.VOUCH_REGISTRY_ADDRESS,
            event_name: "StakeDeposited",
            round: 0,
            member_address: voucher,
            amount: amount.toString(),
            details_json: JSON.stringify({ voucher, amount: amount.toString() }),
            tx_hash: ev.transactionHash,
            block_number: ev.blockNumber,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      }

      // StakeWithdrawn
      const withdrawEvents = await this.vouchRegistryContract.queryFilter(
        this.vouchRegistryContract.filters.StakeWithdrawn(),
        fromBlock,
        toBlock
      );
      for (const ev of withdrawEvents) {
        if ("args" in ev) {
          const { voucher, amount } = ev.args as any;
          await this.syncVoucher(voucher);
          db.recordEvent({
            group_address: CONFIG.VOUCH_REGISTRY_ADDRESS,
            event_name: "StakeWithdrawn",
            round: 0,
            member_address: voucher,
            amount: amount.toString(),
            details_json: JSON.stringify({ voucher, amount: amount.toString() }),
            tx_hash: ev.transactionHash,
            block_number: ev.blockNumber,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      }

      // VouchRegistered
      const vouchEvents = await this.vouchRegistryContract.queryFilter(
        this.vouchRegistryContract.filters.VouchRegistered(),
        fromBlock,
        toBlock
      );
      for (const ev of vouchEvents) {
        if ("args" in ev) {
          const { recordId, voucher, vouchee, chitGroup, amount } = ev.args as any;
          db.upsertVouch({
            record_id: recordId,
            voucher_address: voucher,
            vouchee_address: vouchee,
            group_address: chitGroup,
            staked_amount: amount.toString(),
            active: 1,
            tx_hash: ev.transactionHash,
            timestamp: Math.floor(Date.now() / 1000),
          });
          await this.syncVoucher(voucher);
        }
      }

      // VoucherSlashed
      const slashEvents = await this.vouchRegistryContract.queryFilter(
        this.vouchRegistryContract.filters.VoucherSlashed(),
        fromBlock,
        toBlock
      );
      for (const ev of slashEvents) {
        if ("args" in ev) {
          const { voucher, vouchee, chitGroup, amount } = ev.args as any;
          await this.syncVoucher(voucher);
          db.recordEvent({
            group_address: chitGroup,
            event_name: "VoucherSlashed",
            round: 0,
            member_address: voucher,
            amount: amount.toString(),
            details_json: JSON.stringify({ vouchee, slashedAmount: amount.toString() }),
            tx_hash: ev.transactionHash,
            block_number: ev.blockNumber,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      }
    } catch (err: any) {
      console.warn(`Error querying vouch registry events:`, err.message);
    }
  }

  private async indexGroupEvents(groupAddress: string, fromBlock: number, toBlock: number): Promise<void> {
    try {
      const contract = new ethers.Contract(groupAddress, ChitGroupAbi, this.provider);

      // 1. MemberJoined
      const joinedEvents = await contract.queryFilter(contract.filters.MemberJoined(), fromBlock, toBlock);
      for (const ev of joinedEvents) {
        if ("args" in ev) {
          const { member, bufferDeposit } = ev.args as any;
          db.upsertMember({
            group_address: groupAddress,
            member_address: member,
            buffer_balance: bufferDeposit.toString(),
            locked_dividends: "0",
            paid_installments: 0,
            has_won: 0,
            win_round: 0,
            is_defaulted: 0,
          });
          db.recordEvent({
            group_address: groupAddress,
            event_name: "MemberJoined",
            round: 0,
            member_address: member,
            amount: bufferDeposit.toString(),
            details_json: JSON.stringify({ bufferDeposit: bufferDeposit.toString() }),
            tx_hash: ev.transactionHash,
            block_number: ev.blockNumber,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      }

      // 2. PhaseChanged
      const phaseEvents = await contract.queryFilter(contract.filters.PhaseChanged(), fromBlock, toBlock);
      for (const ev of phaseEvents) {
        if ("args" in ev) {
          const { newState, round } = ev.args as any;
          db.upsertGroup({
            address: groupAddress,
            state: Number(newState),
            current_round: Number(round),
            phase_start_time: Math.floor(Date.now() / 1000),
          });
          db.recordEvent({
            group_address: groupAddress,
            event_name: "PhaseChanged",
            round: Number(round),
            member_address: "",
            amount: "0",
            details_json: JSON.stringify({ newState: Number(newState), stateName: GroupState[Number(newState)] }),
            tx_hash: ev.transactionHash,
            block_number: ev.blockNumber,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      }

      // 3. InstallmentCollected
      const collectEvents = await contract.queryFilter(contract.filters.InstallmentCollected(), fromBlock, toBlock);
      for (const ev of collectEvents) {
        if ("args" in ev) {
          const { member, round, amount } = ev.args as any;
          const currentMember = db.getMember(groupAddress, member);
          const currentPaid = currentMember ? currentMember.paid_installments + 1 : 1;
          db.upsertMember({
            group_address: groupAddress,
            member_address: member,
            paid_installments: currentPaid,
          });
          db.recordEvent({
            group_address: groupAddress,
            event_name: "InstallmentCollected",
            round: Number(round),
            member_address: member,
            amount: amount.toString(),
            details_json: JSON.stringify({ round: Number(round) }),
            tx_hash: ev.transactionHash,
            block_number: ev.blockNumber,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      }

      // 4. BidCommitted
      const commitEvents = await contract.queryFilter(contract.filters.BidCommitted(), fromBlock, toBlock);
      for (const ev of commitEvents) {
        if ("args" in ev) {
          const { member, round, commitmentHash } = ev.args as any;
          db.recordEvent({
            group_address: groupAddress,
            event_name: "BidCommitted",
            round: Number(round),
            member_address: member,
            amount: "0",
            details_json: JSON.stringify({ commitmentHash }),
            tx_hash: ev.transactionHash,
            block_number: ev.blockNumber,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      }

      // 5. BidRevealed
      const revealEvents = await contract.queryFilter(contract.filters.BidRevealed(), fromBlock, toBlock);
      for (const ev of revealEvents) {
        if ("args" in ev) {
          const { member, round, bidAmount } = ev.args as any;
          db.recordEvent({
            group_address: groupAddress,
            event_name: "BidRevealed",
            round: Number(round),
            member_address: member,
            amount: bidAmount.toString(),
            details_json: JSON.stringify({ bidAmount: bidAmount.toString() }),
            tx_hash: ev.transactionHash,
            block_number: ev.blockNumber,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      }

      // 6. AuctionSettled
      const settleEvents = await contract.queryFilter(contract.filters.AuctionSettled(), fromBlock, toBlock);
      for (const ev of settleEvents) {
        if ("args" in ev) {
          const { round, winner, payout, dividendPerMember } = ev.args as any;
          db.upsertMember({
            group_address: groupAddress,
            member_address: winner,
            has_won: 1,
            win_round: Number(round),
          });
          db.recordEvent({
            group_address: groupAddress,
            event_name: "AuctionSettled",
            round: Number(round),
            member_address: winner,
            amount: payout.toString(),
            details_json: JSON.stringify({ winner, payout: payout.toString(), dividendPerMember: dividendPerMember.toString() }),
            tx_hash: ev.transactionHash,
            block_number: ev.blockNumber,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      }

      // 7. DefaultAbsorbed (Waterfall Protection)
      const defaultEvents = await contract.queryFilter(contract.filters.DefaultAbsorbed(), fromBlock, toBlock);
      for (const ev of defaultEvents) {
        if ("args" in ev) {
          const { defaulter, round, tierUsed, amount } = ev.args as any;
          db.recordDefault({
            group_address: groupAddress,
            round: Number(round),
            defaulter_address: defaulter,
            waterfall_tier: Number(tierUsed),
            amount_absorbed: amount.toString(),
            tx_hash: ev.transactionHash,
            timestamp: Math.floor(Date.now() / 1000),
          });
          db.upsertMember({
            group_address: groupAddress,
            member_address: defaulter,
            is_defaulted: 1,
          });
          db.recordEvent({
            group_address: groupAddress,
            event_name: "DefaultAbsorbed",
            round: Number(round),
            member_address: defaulter,
            amount: amount.toString(),
            details_json: JSON.stringify({ tierUsed: Number(tierUsed), amount: amount.toString() }),
            tx_hash: ev.transactionHash,
            block_number: ev.blockNumber,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      }

      // 8. GroupClosed
      const closeEvents = await contract.queryFilter(contract.filters.GroupClosed(), fromBlock, toBlock);
      for (const ev of closeEvents) {
        db.upsertGroup({
          address: groupAddress,
          state: GroupState.Closed,
        });
        db.recordEvent({
          group_address: groupAddress,
          event_name: "GroupClosed",
          round: 0,
          member_address: "",
          amount: "0",
          details_json: "{}",
          tx_hash: ev.transactionHash,
          block_number: ev.blockNumber,
          timestamp: Math.floor(Date.now() / 1000),
        });
      }

      // Sync state variables from contract to DB
      await this.syncGroupState(groupAddress);
    } catch (err: any) {
      console.warn(`Error indexing events for group ${groupAddress}:`, err.message);
    }
  }

  public async syncGroupState(groupAddress: string): Promise<void> {
    try {
      const contract = new ethers.Contract(groupAddress, ChitGroupAbi, this.provider);

      const [
        groupName,
        memberCount,
        installmentAmount,
        cycleDuration,
        discountCapBps,
        reserveFeeBps,
        safetyFactorBps,
        currentState,
        currentRound,
        phaseStartTime,
        reserveFundBalance,
        currentPot,
        lowestBidder,
        lowestBidAmount,
        membersList,
      ] = await Promise.all([
        contract.groupName().catch(() => "Chit Group"),
        contract.memberCount().catch(() => BigInt(0)),
        contract.installmentAmount().catch(() => BigInt(0)),
        contract.cycleDuration().catch(() => BigInt(0)),
        contract.discountCapBps().catch(() => BigInt(3000)),
        contract.reserveFeeBps().catch(() => BigInt(500)),
        contract.safetyFactorBps().catch(() => BigInt(10000)),
        contract.currentState().catch(() => 0),
        contract.currentRound().catch(() => BigInt(0)),
        contract.phaseStartTime().catch(() => BigInt(0)),
        contract.reserveFundBalance().catch(() => BigInt(0)),
        contract.currentPot().catch(() => BigInt(0)),
        contract.lowestBidder().catch(() => ethers.ZeroAddress),
        contract.lowestBidAmount().catch(() => BigInt(0)),
        contract.getMembers().catch(() => []),
      ]);

      db.upsertGroup({
        address: groupAddress,
        name: groupName,
        member_count: Number(memberCount),
        installment_amount: installmentAmount.toString(),
        cycle_duration: Number(cycleDuration),
        discount_cap_bps: Number(discountCapBps),
        reserve_fee_bps: Number(reserveFeeBps),
        safety_factor_bps: Number(safetyFactorBps),
        state: Number(currentState),
        current_round: Number(currentRound),
        phase_start_time: Number(phaseStartTime),
        reserve_fund: reserveFundBalance.toString(),
        current_pot: currentPot.toString(),
        lowest_bidder: lowestBidder === ethers.ZeroAddress ? "" : lowestBidder,
        lowest_bid_amount: lowestBidAmount.toString(),
      });

      // Sync member details
      for (const mAddr of membersList) {
        try {
          const mData = await contract.members(mAddr);
          db.upsertMember({
            group_address: groupAddress,
            member_address: mAddr,
            buffer_balance: mData.bufferBalance.toString(),
            locked_dividends: mData.lockedDividends.toString(),
            paid_installments: Number(mData.paidInstallments),
            has_won: mData.hasWon ? 1 : 0,
            win_round: Number(mData.winRound),
            is_defaulted: mData.isDefaulted ? 1 : 0,
          });
        } catch {}
      }
    } catch (err: any) {
      console.warn(`Could not sync contract state for ${groupAddress}:`, err.message);
    }
  }

  public async syncVoucher(voucherAddress: string): Promise<void> {
    if (!this.vouchRegistryContract) return;
    try {
      const vData = await this.vouchRegistryContract.vouchers(voucherAddress);
      db.upsertVoucher({
        address: voucherAddress,
        total_staked: vData.totalStaked.toString(),
        locked_stake: vData.lockedStake.toString(),
        reputation_score: Number(vData.reputationScore),
        active_vouchee_count: Number(vData.activeVoucheeCount),
      });
    } catch {}
  }
}
