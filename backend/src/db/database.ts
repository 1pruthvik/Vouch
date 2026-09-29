// @ts-ignore
import initSqlJs from "sql.js";
type SqlJsDatabase = any;
import * as path from "path";
import * as fs from "fs";
import { CONFIG } from "../config";
import {
  GroupRecord,
  MemberRecord,
  EventRecord,
  DefaultRecord,
  VouchRecord,
  VoucherProfile,
  ProtocolStats,
  GroupState,
} from "../types";

class DatabaseManager {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = CONFIG.DB_FILE;
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public async init(): Promise<void> {
    const SQL = await initSqlJs();
    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(fileBuffer);
    } else {
      this.db = new SQL.Database();
    }

    this.createSchema();
    this.save();
  }

  private save(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error("Failed to persist database to disk:", err);
    }
  }

  private createSchema(): void {
    if (!this.db) throw new Error("Database not initialized");

    this.db.run(`
      CREATE TABLE IF NOT EXISTS groups (
        address TEXT PRIMARY KEY,
        name TEXT,
        member_count INTEGER,
        installment_amount TEXT,
        cycle_duration INTEGER,
        discount_cap_bps INTEGER,
        reserve_fee_bps INTEGER,
        safety_factor_bps INTEGER,
        state INTEGER,
        current_round INTEGER,
        phase_start_time INTEGER,
        reserve_fund TEXT,
        current_pot TEXT,
        lowest_bidder TEXT,
        lowest_bid_amount TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS members (
        group_address TEXT,
        member_address TEXT,
        buffer_balance TEXT,
        locked_dividends TEXT,
        paid_installments INTEGER,
        has_won INTEGER,
        win_round INTEGER,
        is_defaulted INTEGER,
        updated_at INTEGER,
        PRIMARY KEY (group_address, member_address)
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_address TEXT,
        event_name TEXT,
        round INTEGER,
        member_address TEXT,
        amount TEXT,
        details_json TEXT,
        tx_hash TEXT,
        block_number INTEGER,
        timestamp INTEGER
      );

      CREATE TABLE IF NOT EXISTS defaults (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_address TEXT,
        round INTEGER,
        defaulter_address TEXT,
        waterfall_tier INTEGER,
        amount_absorbed TEXT,
        tx_hash TEXT,
        timestamp INTEGER
      );

      CREATE TABLE IF NOT EXISTS vouches (
        record_id TEXT PRIMARY KEY,
        voucher_address TEXT,
        vouchee_address TEXT,
        group_address TEXT,
        staked_amount TEXT,
        active INTEGER,
        tx_hash TEXT,
        timestamp INTEGER
      );

      CREATE TABLE IF NOT EXISTS vouchers (
        address TEXT PRIMARY KEY,
        total_staked TEXT,
        locked_stake TEXT,
        reputation_score INTEGER,
        active_vouchee_count INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS sync_state (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS circle_registrations (
        address TEXT PRIMARY KEY,
        name TEXT,
        member_count INTEGER,
        installment_amount TEXT,
        cycle_duration INTEGER,
        initializer TEXT,
        min_wallet_amt TEXT,
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS circle_join_requests (
        id TEXT PRIMARY KEY,
        circle_address TEXT,
        applicant_address TEXT,
        applicant_name TEXT,
        status TEXT,
        requested_at INTEGER,
        updated_at INTEGER
      );
    `);
  }

  // --- Group Methods ---

  public upsertGroup(group: Partial<GroupRecord> & { address: string }): void {
    if (!this.db) return;
    const existing = this.getGroup(group.address);
    const now = Math.floor(Date.now() / 1000);

    if (existing) {
      const merged: GroupRecord = {
        ...existing,
        ...group,
        updated_at: now,
      };
      this.db.run(
        `UPDATE groups SET
          name = ?, member_count = ?, installment_amount = ?, cycle_duration = ?,
          discount_cap_bps = ?, reserve_fee_bps = ?, safety_factor_bps = ?,
          state = ?, current_round = ?, phase_start_time = ?, reserve_fund = ?,
          current_pot = ?, lowest_bidder = ?, lowest_bid_amount = ?, updated_at = ?
        WHERE address = ?`,
        [
          merged.name,
          merged.member_count,
          merged.installment_amount,
          merged.cycle_duration,
          merged.discount_cap_bps,
          merged.reserve_fee_bps,
          merged.safety_factor_bps,
          merged.state,
          merged.current_round,
          merged.phase_start_time,
          merged.reserve_fund,
          merged.current_pot,
          merged.lowest_bidder,
          merged.lowest_bid_amount,
          merged.updated_at,
          merged.address.toLowerCase(),
        ]
      );
    } else {
      this.db.run(
        `INSERT INTO groups (
          address, name, member_count, installment_amount, cycle_duration,
          discount_cap_bps, reserve_fee_bps, safety_factor_bps, state,
          current_round, phase_start_time, reserve_fund, current_pot,
          lowest_bidder, lowest_bid_amount, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          group.address.toLowerCase(),
          group.name || "Chit Group",
          group.member_count || 0,
          group.installment_amount || "0",
          group.cycle_duration || 0,
          group.discount_cap_bps || 3000,
          group.reserve_fee_bps || 500,
          group.safety_factor_bps || 10000,
          group.state ?? GroupState.Forming,
          group.current_round || 0,
          group.phase_start_time || now,
          group.reserve_fund || "0",
          group.current_pot || "0",
          group.lowest_bidder || "",
          group.lowest_bid_amount || "0",
          group.created_at || now,
          now,
        ]
      );
    }
    this.save();
  }

  public getGroups(): GroupRecord[] {
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM groups ORDER BY created_at DESC");
    const results: GroupRecord[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as GroupRecord);
    }
    stmt.free();
    return results;
  }

  public getGroup(address: string): GroupRecord | null {
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM groups WHERE LOWER(address) = LOWER(?)");
    stmt.bind([address]);
    let result: GroupRecord | null = null;
    if (stmt.step()) {
      result = stmt.getAsObject() as unknown as GroupRecord;
    }
    stmt.free();
    return result;
  }

  // --- Member Methods ---

  public upsertMember(member: Partial<MemberRecord> & { group_address: string; member_address: string }): void {
    if (!this.db) return;
    const existing = this.getMember(member.group_address, member.member_address);
    const now = Math.floor(Date.now() / 1000);

    if (existing) {
      const merged: MemberRecord = {
        ...existing,
        ...member,
        updated_at: now,
      };
      this.db.run(
        `UPDATE members SET
          buffer_balance = ?, locked_dividends = ?, paid_installments = ?,
          has_won = ?, win_round = ?, is_defaulted = ?, updated_at = ?
        WHERE LOWER(group_address) = LOWER(?) AND LOWER(member_address) = LOWER(?)`,
        [
          merged.buffer_balance,
          merged.locked_dividends,
          merged.paid_installments,
          merged.has_won,
          merged.win_round,
          merged.is_defaulted,
          merged.updated_at,
          member.group_address.toLowerCase(),
          member.member_address.toLowerCase(),
        ]
      );
    } else {
      this.db.run(
        `INSERT INTO members (
          group_address, member_address, buffer_balance, locked_dividends,
          paid_installments, has_won, win_round, is_defaulted, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          member.group_address.toLowerCase(),
          member.member_address.toLowerCase(),
          member.buffer_balance || "0",
          member.locked_dividends || "0",
          member.paid_installments || 0,
          member.has_won || 0,
          member.win_round || 0,
          member.is_defaulted || 0,
          now,
        ]
      );
    }
    this.save();
  }

  public getMembers(groupAddress: string): MemberRecord[] {
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM members WHERE LOWER(group_address) = LOWER(?)");
    stmt.bind([groupAddress]);
    const results: MemberRecord[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as MemberRecord);
    }
    stmt.free();
    return results;
  }

  public getMember(groupAddress: string, memberAddress: string): MemberRecord | null {
    if (!this.db) return null;
    const stmt = this.db.prepare(
      "SELECT * FROM members WHERE LOWER(group_address) = LOWER(?) AND LOWER(member_address) = LOWER(?)"
    );
    stmt.bind([groupAddress, memberAddress]);
    let result: MemberRecord | null = null;
    if (stmt.step()) {
      result = stmt.getAsObject() as unknown as MemberRecord;
    }
    stmt.free();
    return result;
  }

  public getMemberGroups(memberAddress: string): Array<MemberRecord & { group_name?: string }> {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT m.*, g.name as group_name, g.state as group_state, g.current_round as group_round
      FROM members m
      JOIN groups g ON LOWER(m.group_address) = LOWER(g.address)
      WHERE LOWER(m.member_address) = LOWER(?)
    `);
    stmt.bind([memberAddress]);
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  // --- Events & Ledger Methods ---

  public recordEvent(event: EventRecord): void {
    if (!this.db) return;
    this.db.run(
      `INSERT INTO events (
        group_address, event_name, round, member_address, amount, details_json, tx_hash, block_number, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        (event.group_address || "").toLowerCase(),
        event.event_name,
        event.round || 0,
        (event.member_address || "").toLowerCase(),
        event.amount || "0",
        event.details_json || "{}",
        event.tx_hash || "",
        event.block_number || 0,
        event.timestamp || Math.floor(Date.now() / 1000),
      ]
    );
    this.save();
  }

  public getGroupLedger(groupAddress: string): EventRecord[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(
      "SELECT * FROM events WHERE LOWER(group_address) = LOWER(?) ORDER BY id DESC"
    );
    stmt.bind([groupAddress]);
    const results: EventRecord[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as EventRecord);
    }
    stmt.free();
    return results;
  }

  public getAllEvents(limit: number = 100): EventRecord[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(
      "SELECT * FROM events ORDER BY id DESC LIMIT ?"
    );
    stmt.bind([limit]);
    const results: EventRecord[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as EventRecord);
    }
    stmt.free();
    return results;
  }

  // --- Defaults Methods ---

  public recordDefault(def: DefaultRecord): void {
    if (!this.db) return;
    this.db.run(
      `INSERT INTO defaults (
        group_address, round, defaulter_address, waterfall_tier, amount_absorbed, tx_hash, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        def.group_address.toLowerCase(),
        def.round,
        def.defaulter_address.toLowerCase(),
        def.waterfall_tier,
        def.amount_absorbed,
        def.tx_hash,
        def.timestamp || Math.floor(Date.now() / 1000),
      ]
    );
    this.save();
  }

  public getGroupDefaults(groupAddress: string): DefaultRecord[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(
      "SELECT * FROM defaults WHERE LOWER(group_address) = LOWER(?) ORDER BY id DESC"
    );
    stmt.bind([groupAddress]);
    const results: DefaultRecord[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as DefaultRecord);
    }
    stmt.free();
    return results;
  }

  // --- Vouching Methods ---

  public upsertVouch(vouch: VouchRecord): void {
    if (!this.db) return;
    this.db.run(
      `INSERT OR REPLACE INTO vouches (
        record_id, voucher_address, vouchee_address, group_address, staked_amount, active, tx_hash, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vouch.record_id,
        vouch.voucher_address.toLowerCase(),
        vouch.vouchee_address.toLowerCase(),
        vouch.group_address.toLowerCase(),
        vouch.staked_amount,
        vouch.active,
        vouch.tx_hash,
        vouch.timestamp || Math.floor(Date.now() / 1000),
      ]
    );
    this.save();
  }

  public getVouchesForVouchee(vouchee: string): VouchRecord[] {
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM vouches WHERE LOWER(vouchee_address) = LOWER(?) AND active = 1");
    stmt.bind([vouchee]);
    const results: VouchRecord[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as VouchRecord);
    }
    stmt.free();
    return results;
  }

  public getVouchesByVoucher(voucher: string): VouchRecord[] {
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM vouches WHERE LOWER(voucher_address) = LOWER(?)");
    stmt.bind([voucher]);
    const results: VouchRecord[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as VouchRecord);
    }
    stmt.free();
    return results;
  }

  public upsertVoucher(profile: Partial<VoucherProfile> & { address: string }): void {
    if (!this.db) return;
    const now = Math.floor(Date.now() / 1000);
    this.db.run(
      `INSERT INTO vouchers (address, total_staked, locked_stake, reputation_score, active_vouchee_count, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(address) DO UPDATE SET
         total_staked = excluded.total_staked,
         locked_stake = excluded.locked_stake,
         reputation_score = excluded.reputation_score,
         active_vouchee_count = excluded.active_vouchee_count,
         updated_at = excluded.updated_at`,
      [
        profile.address.toLowerCase(),
        profile.total_staked || "0",
        profile.locked_stake || "0",
        profile.reputation_score ?? 1000,
        profile.active_vouchee_count || 0,
        now,
      ]
    );
    this.save();
  }

  public getVoucher(address: string): VoucherProfile | null {
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM vouchers WHERE LOWER(address) = LOWER(?)");
    stmt.bind([address]);
    let result: VoucherProfile | null = null;
    if (stmt.step()) {
      result = stmt.getAsObject() as unknown as VoucherProfile;
    }
    stmt.free();
    return result;
  }

  public getAllVouchers(): VoucherProfile[] {
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM vouchers ORDER BY reputation_score DESC");
    const results: VoucherProfile[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as VoucherProfile);
    }
    stmt.free();
    return results;
  }

  // --- Sync State ---

  public getSyncBlock(): number {
    if (!this.db) return 0;
    const stmt = this.db.prepare("SELECT value FROM sync_state WHERE key = 'last_synced_block'");
    let block = 0;
    if (stmt.step()) {
      const obj = stmt.getAsObject() as { value: string };
      block = parseInt(obj.value || "0", 10);
    }
    stmt.free();
    return block;
  }

  public setSyncBlock(blockNumber: number): void {
    if (!this.db) return;
    const now = Math.floor(Date.now() / 1000);
    this.db.run(
      `INSERT OR REPLACE INTO sync_state (key, value, updated_at) VALUES ('last_synced_block', ?, ?)`,
      [blockNumber.toString(), now]
    );
    this.save();
  }

  // --- Protocol Stats ---

  public getStats(latestBlock: number = 0): ProtocolStats {
    const groups = this.getGroups();
    const active = groups.filter((g) => g.state !== GroupState.Closed && g.state !== GroupState.Forming).length;
    const closed = groups.filter((g) => g.state === GroupState.Closed).length;
    
    let totalMembers = 0;
    let totalReserve = BigInt(0);

    for (const g of groups) {
      const members = this.getMembers(g.address);
      totalMembers += members.length;
      try {
        totalReserve += BigInt(g.reserve_fund || "0");
      } catch {}
    }

    let defaultsCount = 0;
    if (this.db) {
      const stmt = this.db.prepare("SELECT COUNT(*) as count FROM defaults");
      if (stmt.step()) {
        defaultsCount = (stmt.getAsObject() as { count: number }).count;
      }
      stmt.free();
    }

    let eventsCount = 0;
    if (this.db) {
      const stmt = this.db.prepare("SELECT COUNT(*) as count FROM events");
      if (stmt.step()) {
        eventsCount = (stmt.getAsObject() as { count: number }).count;
      }
      stmt.free();
    }

    return {
      total_groups: groups.length,
      active_groups: active,
      closed_groups: closed,
      total_members: totalMembers,
      total_events: eventsCount,
      total_defaults_absorbed: defaultsCount,
      total_reserve_accumulated: totalReserve.toString(),
      latest_block: latestBlock,
    };
  }

  // --- Circle Registrations & Join Requests ---

  private sanitizeAddress(addr: string): string {
    if (!addr) return "";
    const match = addr.match(/0x[a-fA-F0-9]{40}/);
    return match ? match[0].toLowerCase() : addr.trim().toLowerCase();
  }

  public upsertCircleRegistration(entry: {
    address: string;
    name?: string;
    member_count?: number;
    installment_amount?: string;
    cycle_duration?: number;
    initializer: string;
    min_wallet_amt?: string;
    created_at?: number;
  }): void {
    if (!this.db) return;
    const cleanAddr = this.sanitizeAddress(entry.address);
    const cleanInit = this.sanitizeAddress(entry.initializer);
    const now = Math.floor(Date.now() / 1000);
    this.db.run(
      `INSERT INTO circle_registrations (address, name, member_count, installment_amount, cycle_duration, initializer, min_wallet_amt, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(address) DO UPDATE SET
         name = excluded.name,
         member_count = excluded.member_count,
         installment_amount = excluded.installment_amount,
         cycle_duration = excluded.cycle_duration,
         initializer = excluded.initializer,
         min_wallet_amt = excluded.min_wallet_amt`,
      [
        cleanAddr,
        entry.name || "Savings Circle",
        entry.member_count || 5,
        entry.installment_amount || "1.0",
        entry.cycle_duration || 0,
        cleanInit,
        entry.min_wallet_amt || "0",
        entry.created_at || now,
      ]
    );
    this.save();
  }

  public getAllCircleRegistrations(): any[] {
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM circle_registrations ORDER BY created_at DESC");
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  public getCircleRegistration(address: string): any | null {
    if (!this.db || !address) return null;
    const cleanAddr = this.sanitizeAddress(address);
    const stmt = this.db.prepare("SELECT * FROM circle_registrations WHERE LOWER(address) = ?");
    stmt.bind([cleanAddr]);
    let result: any = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  }

  public getCirclesByInitializer(initializer: string): any[] {
    if (!this.db || !initializer) return [];
    const cleanInit = this.sanitizeAddress(initializer);
    const stmt = this.db.prepare("SELECT * FROM circle_registrations WHERE LOWER(initializer) = ? ORDER BY created_at DESC");
    stmt.bind([cleanInit]);
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  public submitJoinRequest(circleAddress: string, applicantAddress: string, applicantName?: string): any {
    if (!this.db) return null;
    const cleanCircle = this.sanitizeAddress(circleAddress);
    const cleanApplicant = this.sanitizeAddress(applicantAddress);
    const now = Math.floor(Date.now() / 1000);
    const id = `${cleanCircle}_${cleanApplicant}`;

    const existing = this.getApplicantJoinStatus(cleanCircle, cleanApplicant);
    if (existing && existing.status !== "none") {
      return existing;
    }

    const defaultName = applicantName || `Member (${cleanApplicant.substring(0, 6)}...)`;
    this.db.run(
      `INSERT OR REPLACE INTO circle_join_requests (id, circle_address, applicant_address, applicant_name, status, requested_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
      [id, cleanCircle, cleanApplicant, defaultName, now, now]
    );
    this.save();
    return {
      id,
      circleAddress: cleanCircle,
      applicantAddress: cleanApplicant,
      applicantName: defaultName,
      status: "pending",
      requestedAt: now * 1000,
    };
  }

  public getJoinRequestsForCircle(circleAddress: string): any[] {
    if (!this.db || !circleAddress) return [];
    const cleanCircle = this.sanitizeAddress(circleAddress);
    const stmt = this.db.prepare("SELECT * FROM circle_join_requests WHERE LOWER(circle_address) = ? ORDER BY requested_at DESC");
    stmt.bind([cleanCircle]);
    const results: any[] = [];
    while (stmt.step()) {
      const row: any = stmt.getAsObject();
      results.push({
        id: row.id,
        circleAddress: row.circle_address,
        applicantAddress: row.applicant_address,
        applicantName: row.applicant_name,
        status: row.status,
        requestedAt: row.requested_at > 10000000000 ? row.requested_at : row.requested_at * 1000,
      });
    }
    stmt.free();
    return results;
  }

  public getApplicantJoinStatus(circleAddress: string, applicantAddress: string): any {
    if (!this.db || !circleAddress || !applicantAddress) return { status: "none" };
    const cleanCircle = this.sanitizeAddress(circleAddress);
    const cleanApplicant = this.sanitizeAddress(applicantAddress);
    const stmt = this.db.prepare("SELECT * FROM circle_join_requests WHERE LOWER(circle_address) = ? AND LOWER(applicant_address) = ?");
    stmt.bind([cleanCircle, cleanApplicant]);
    let result: any = null;
    if (stmt.step()) {
      const row: any = stmt.getAsObject();
      result = {
        id: row.id,
        circleAddress: row.circle_address,
        applicantAddress: row.applicant_address,
        applicantName: row.applicant_name,
        status: row.status,
        requestedAt: row.requested_at > 10000000000 ? row.requested_at : row.requested_at * 1000,
      };
    }
    stmt.free();
    return result || { status: "none" };
  }

  public updateJoinRequestStatus(circleAddress: string, applicantAddress: string, status: "verified" | "rejected"): any {
    if (!this.db) return null;
    const cleanCircle = this.sanitizeAddress(circleAddress);
    const cleanApplicant = this.sanitizeAddress(applicantAddress);
    const now = Math.floor(Date.now() / 1000);
    const id = `${cleanCircle}_${cleanApplicant}`;

    this.db.run(
      `INSERT INTO circle_join_requests (id, circle_address, applicant_address, applicant_name, status, requested_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
      [id, cleanCircle, cleanApplicant, `Member (${cleanApplicant.substring(0, 6)}...)`, status, now, now]
    );
    this.save();
    return {
      id,
      circleAddress: cleanCircle,
      applicantAddress: cleanApplicant,
      status,
      updatedAt: now * 1000,
    };
  }
}

export const db = new DatabaseManager();
export async function initializeDatabase(): Promise<void> {
  await db.init();
}
