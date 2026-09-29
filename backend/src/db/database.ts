// @ts-ignore
import initSqlJs from "sql.js";
type SqlJsDatabase = any;
import { Pool } from "pg";
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
  private pgPool: Pool | null = null;

  constructor() {
    this.dbPath = CONFIG.DB_FILE;
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (CONFIG.DATABASE_URL) {
      const isLocal = CONFIG.DATABASE_URL.includes("localhost") || CONFIG.DATABASE_URL.includes("127.0.0.1");
      this.pgPool = new Pool({
        connectionString: CONFIG.DATABASE_URL,
        ssl: isLocal ? false : { rejectUnauthorized: false },
      });
      console.log("🐘 PostgreSQL client initialized for Vouch Backend");
    }
  }

  public async init(): Promise<void> {
    const SQL = await initSqlJs();
    this.db = new SQL.Database();

    if (this.pgPool) {
      await this.initPostgres();
    } else {
      if (fs.existsSync(this.dbPath)) {
        try {
          const fileBuffer = fs.readFileSync(this.dbPath);
          this.db = new SQL.Database(fileBuffer);
        } catch (err) {
          console.warn("⚠️ Could not load sqlite file, creating fresh:", err);
          this.db = new SQL.Database();
        }
      }
    }

    this.createSchema();
    if (this.pgPool) {
      await this.loadFromPostgres();
    } else {
      this.save();
    }
  }

  private async pgQuery(text: string, params: any[] = []): Promise<any> {
    if (!this.pgPool) return null;
    try {
      return await this.pgPool.query(text, params);
    } catch (err: any) {
      console.error("❌ PostgreSQL Query Error:", err.message, "SQL:", text);
      return null;
    }
  }

  private async initPostgres(): Promise<void> {
    if (!this.pgPool) return;
    try {
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS groups (
          address VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          member_count INT,
          installment_amount VARCHAR(255),
          cycle_duration INT,
          discount_cap_bps INT,
          reserve_fee_bps INT,
          safety_factor_bps INT,
          state INT,
          current_round INT,
          phase_start_time BIGINT,
          reserve_fund VARCHAR(255),
          current_pot VARCHAR(255),
          lowest_bidder VARCHAR(255),
          lowest_bid_amount VARCHAR(255),
          created_at BIGINT,
          updated_at BIGINT
        );

        CREATE TABLE IF NOT EXISTS members (
          group_address VARCHAR(255),
          member_address VARCHAR(255),
          buffer_balance VARCHAR(255),
          locked_dividends VARCHAR(255),
          paid_installments INT,
          has_won INT,
          win_round INT,
          is_defaulted INT,
          updated_at BIGINT,
          PRIMARY KEY (group_address, member_address)
        );

        CREATE TABLE IF NOT EXISTS events (
          id SERIAL PRIMARY KEY,
          group_address VARCHAR(255),
          event_name VARCHAR(255),
          round INT,
          member_address VARCHAR(255),
          amount VARCHAR(255),
          details_json TEXT,
          tx_hash VARCHAR(255),
          block_number BIGINT,
          timestamp BIGINT
        );

        CREATE TABLE IF NOT EXISTS defaults (
          id SERIAL PRIMARY KEY,
          group_address VARCHAR(255),
          round INT,
          defaulter_address VARCHAR(255),
          waterfall_tier INT,
          amount_absorbed VARCHAR(255),
          tx_hash VARCHAR(255),
          timestamp BIGINT
        );

        CREATE TABLE IF NOT EXISTS vouches (
          record_id VARCHAR(255) PRIMARY KEY,
          voucher_address VARCHAR(255),
          vouchee_address VARCHAR(255),
          group_address VARCHAR(255),
          staked_amount VARCHAR(255),
          active INT,
          tx_hash VARCHAR(255),
          timestamp BIGINT
        );

        CREATE TABLE IF NOT EXISTS vouchers (
          address VARCHAR(255) PRIMARY KEY,
          total_staked VARCHAR(255),
          locked_stake VARCHAR(255),
          reputation_score INT,
          active_vouchee_count INT,
          updated_at BIGINT
        );

        CREATE TABLE IF NOT EXISTS sync_state (
          key VARCHAR(255) PRIMARY KEY,
          value TEXT,
          updated_at BIGINT
        );

        CREATE TABLE IF NOT EXISTS circle_registrations (
          address VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          member_count INT,
          installment_amount VARCHAR(255),
          cycle_duration INT,
          initializer VARCHAR(255),
          min_wallet_amt VARCHAR(255),
          created_at BIGINT
        );

        CREATE TABLE IF NOT EXISTS circle_join_requests (
          id VARCHAR(255) PRIMARY KEY,
          circle_address VARCHAR(255),
          applicant_address VARCHAR(255),
          applicant_name VARCHAR(255),
          status VARCHAR(50),
          requested_at BIGINT,
          updated_at BIGINT
        );

        CREATE TABLE IF NOT EXISTS circle_allowed_members (
          circle_address VARCHAR(255),
          member_address VARCHAR(255),
          added_by VARCHAR(255),
          added_at BIGINT,
          PRIMARY KEY (circle_address, member_address)
        );
      `);
      console.log("✅ PostgreSQL tables verified / created successfully");
    } catch (err: any) {
      console.error("❌ Error initializing PostgreSQL tables:", err.message);
    }
  }

  private async loadFromPostgres(): Promise<void> {
    if (!this.pgPool || !this.db) return;
    try {
      const tables = [
        "groups",
        "members",
        "events",
        "defaults",
        "vouches",
        "vouchers",
        "sync_state",
        "circle_registrations",
        "circle_join_requests",
        "circle_allowed_members",
      ];

      for (const table of tables) {
        const res = await this.pgPool.query(`SELECT * FROM ${table}`);
        for (const row of res.rows) {
          const keys = Object.keys(row);
          if (keys.length === 0) continue;
          const placeholders = keys.map(() => "?").join(", ");
          const values = keys.map((k) => row[k]);
          this.db.run(
            `INSERT OR REPLACE INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
            values
          );
        }
      }
      console.log("📥 In-memory cache successfully synchronized from PostgreSQL");
    } catch (err: any) {
      console.warn("⚠️ Could not load data from PostgreSQL:", err.message);
    }
  }

  private save(): void {
    if (!this.db || this.pgPool) return;
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

      CREATE TABLE IF NOT EXISTS circle_allowed_members (
        circle_address TEXT,
        member_address TEXT,
        added_by TEXT,
        added_at INTEGER,
        PRIMARY KEY (circle_address, member_address)
      );
    `);
  }

  // --- Group Methods ---

  public upsertGroup(group: Partial<GroupRecord> & { address: string }): void {
    if (!this.db) return;
    const existing = this.getGroup(group.address);
    const now = Math.floor(Date.now() / 1000);

    const merged: GroupRecord = {
      address: (group.address || "").toLowerCase(),
      name: group.name || existing?.name || "Chit Group",
      member_count: group.member_count ?? existing?.member_count ?? 0,
      installment_amount: group.installment_amount || existing?.installment_amount || "0",
      cycle_duration: group.cycle_duration ?? existing?.cycle_duration ?? 0,
      discount_cap_bps: group.discount_cap_bps ?? existing?.discount_cap_bps ?? 3000,
      reserve_fee_bps: group.reserve_fee_bps ?? existing?.reserve_fee_bps ?? 500,
      safety_factor_bps: group.safety_factor_bps ?? existing?.safety_factor_bps ?? 10000,
      state: group.state ?? existing?.state ?? GroupState.Forming,
      current_round: group.current_round ?? existing?.current_round ?? 0,
      phase_start_time: group.phase_start_time ?? existing?.phase_start_time ?? now,
      reserve_fund: group.reserve_fund || existing?.reserve_fund || "0",
      current_pot: group.current_pot || existing?.current_pot || "0",
      lowest_bidder: group.lowest_bidder || existing?.lowest_bidder || "",
      lowest_bid_amount: group.lowest_bid_amount || existing?.lowest_bid_amount || "0",
      created_at: existing?.created_at || group.created_at || now,
      updated_at: now,
    };

    if (existing) {
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
          merged.address,
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
          merged.created_at,
          now,
        ]
      );
    }
    this.save();

    this.pgQuery(
      `INSERT INTO groups (
        address, name, member_count, installment_amount, cycle_duration,
        discount_cap_bps, reserve_fee_bps, safety_factor_bps, state,
        current_round, phase_start_time, reserve_fund, current_pot,
        lowest_bidder, lowest_bid_amount, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (address) DO UPDATE SET
        name = EXCLUDED.name,
        member_count = EXCLUDED.member_count,
        installment_amount = EXCLUDED.installment_amount,
        cycle_duration = EXCLUDED.cycle_duration,
        discount_cap_bps = EXCLUDED.discount_cap_bps,
        reserve_fee_bps = EXCLUDED.reserve_fee_bps,
        safety_factor_bps = EXCLUDED.safety_factor_bps,
        state = EXCLUDED.state,
        current_round = EXCLUDED.current_round,
        phase_start_time = EXCLUDED.phase_start_time,
        reserve_fund = EXCLUDED.reserve_fund,
        current_pot = EXCLUDED.current_pot,
        lowest_bidder = EXCLUDED.lowest_bidder,
        lowest_bid_amount = EXCLUDED.lowest_bid_amount,
        updated_at = EXCLUDED.updated_at`,
      [
        merged.address,
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
        merged.created_at,
        now,
      ]
    );
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

    const merged: MemberRecord = {
      group_address: member.group_address.toLowerCase(),
      member_address: member.member_address.toLowerCase(),
      buffer_balance: member.buffer_balance || existing?.buffer_balance || "0",
      locked_dividends: member.locked_dividends || existing?.locked_dividends || "0",
      paid_installments: member.paid_installments ?? existing?.paid_installments ?? 0,
      has_won: member.has_won ?? existing?.has_won ?? 0,
      win_round: member.win_round ?? existing?.win_round ?? 0,
      is_defaulted: member.is_defaulted ?? existing?.is_defaulted ?? 0,
      updated_at: now,
    };

    if (existing) {
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
          merged.group_address,
          merged.member_address,
        ]
      );
    } else {
      this.db.run(
        `INSERT INTO members (
          group_address, member_address, buffer_balance, locked_dividends,
          paid_installments, has_won, win_round, is_defaulted, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          merged.group_address,
          merged.member_address,
          merged.buffer_balance,
          merged.locked_dividends,
          merged.paid_installments,
          merged.has_won,
          merged.win_round,
          merged.is_defaulted,
          now,
        ]
      );
    }
    this.save();

    this.pgQuery(
      `INSERT INTO members (
        group_address, member_address, buffer_balance, locked_dividends,
        paid_installments, has_won, win_round, is_defaulted, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (group_address, member_address) DO UPDATE SET
        buffer_balance = EXCLUDED.buffer_balance,
        locked_dividends = EXCLUDED.locked_dividends,
        paid_installments = EXCLUDED.paid_installments,
        has_won = EXCLUDED.has_won,
        win_round = EXCLUDED.win_round,
        is_defaulted = EXCLUDED.is_defaulted,
        updated_at = EXCLUDED.updated_at`,
      [
        merged.group_address,
        merged.member_address,
        merged.buffer_balance,
        merged.locked_dividends,
        merged.paid_installments,
        merged.has_won,
        merged.win_round,
        merged.is_defaulted,
        now,
      ]
    );
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
    const now = event.timestamp || Math.floor(Date.now() / 1000);
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
        now,
      ]
    );
    this.save();

    this.pgQuery(
      `INSERT INTO events (
        group_address, event_name, round, member_address, amount, details_json, tx_hash, block_number, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        (event.group_address || "").toLowerCase(),
        event.event_name,
        event.round || 0,
        (event.member_address || "").toLowerCase(),
        event.amount || "0",
        event.details_json || "{}",
        event.tx_hash || "",
        event.block_number || 0,
        now,
      ]
    );
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
    const now = def.timestamp || Math.floor(Date.now() / 1000);
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
        now,
      ]
    );
    this.save();

    this.pgQuery(
      `INSERT INTO defaults (
        group_address, round, defaulter_address, waterfall_tier, amount_absorbed, tx_hash, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        def.group_address.toLowerCase(),
        def.round,
        def.defaulter_address.toLowerCase(),
        def.waterfall_tier,
        def.amount_absorbed,
        def.tx_hash,
        now,
      ]
    );
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
    const now = vouch.timestamp || Math.floor(Date.now() / 1000);
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
        now,
      ]
    );
    this.save();

    this.pgQuery(
      `INSERT INTO vouches (
        record_id, voucher_address, vouchee_address, group_address, staked_amount, active, tx_hash, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (record_id) DO UPDATE SET
        voucher_address = EXCLUDED.voucher_address,
        vouchee_address = EXCLUDED.vouchee_address,
        group_address = EXCLUDED.group_address,
        staked_amount = EXCLUDED.staked_amount,
        active = EXCLUDED.active,
        tx_hash = EXCLUDED.tx_hash,
        timestamp = EXCLUDED.timestamp`,
      [
        vouch.record_id,
        vouch.voucher_address.toLowerCase(),
        vouch.vouchee_address.toLowerCase(),
        vouch.group_address.toLowerCase(),
        vouch.staked_amount,
        vouch.active,
        vouch.tx_hash,
        now,
      ]
    );
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

    this.pgQuery(
      `INSERT INTO vouchers (address, total_staked, locked_stake, reputation_score, active_vouchee_count, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT(address) DO UPDATE SET
         total_staked = EXCLUDED.total_staked,
         locked_stake = EXCLUDED.locked_stake,
         reputation_score = EXCLUDED.reputation_score,
         active_vouchee_count = EXCLUDED.active_vouchee_count,
         updated_at = EXCLUDED.updated_at`,
      [
        profile.address.toLowerCase(),
        profile.total_staked || "0",
        profile.locked_stake || "0",
        profile.reputation_score ?? 1000,
        profile.active_vouchee_count || 0,
        now,
      ]
    );
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

    this.pgQuery(
      `INSERT INTO sync_state (key, value, updated_at) VALUES ('last_synced_block', $1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [blockNumber.toString(), now]
    );
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
    if (cleanInit) {
      this.addAllowedMember(cleanAddr, cleanInit, cleanInit);
    }
    this.save();

    this.pgQuery(
      `INSERT INTO circle_registrations (address, name, member_count, installment_amount, cycle_duration, initializer, min_wallet_amt, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT(address) DO UPDATE SET
         name = EXCLUDED.name,
         member_count = EXCLUDED.member_count,
         installment_amount = EXCLUDED.installment_amount,
         cycle_duration = EXCLUDED.cycle_duration,
         initializer = EXCLUDED.initializer,
         min_wallet_amt = EXCLUDED.min_wallet_amt`,
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
  }

  public updateCircleRegistration(
    address: string,
    updates: {
      name?: string;
      min_wallet_amt?: string;
      member_count?: number;
      installment_amount?: string;
    }
  ): any | null {
    if (!this.db || !address) return null;
    const cleanAddr = this.sanitizeAddress(address);
    const existing = this.getCircleRegistration(cleanAddr);
    if (!existing) return null;

    const newName = updates.name !== undefined ? updates.name : existing.name;
    const newMinWallet = updates.min_wallet_amt !== undefined ? updates.min_wallet_amt : existing.min_wallet_amt;
    const newMemberCount = updates.member_count !== undefined ? updates.member_count : existing.member_count;
    const newInstallment = updates.installment_amount !== undefined ? updates.installment_amount : existing.installment_amount;

    this.db.run(
      `UPDATE circle_registrations SET
        name = ?,
        min_wallet_amt = ?,
        member_count = ?,
        installment_amount = ?
      WHERE LOWER(address) = ?`,
      [newName, newMinWallet, newMemberCount, newInstallment, cleanAddr]
    );

    this.db.run(
      `UPDATE groups SET
        name = ?,
        member_count = ?,
        installment_amount = ?
      WHERE LOWER(address) = ?`,
      [newName, newMemberCount, newInstallment, cleanAddr]
    );

    this.save();

    this.pgQuery(
      `UPDATE circle_registrations SET
        name = $1, min_wallet_amt = $2, member_count = $3, installment_amount = $4
      WHERE LOWER(address) = $5`,
      [newName, newMinWallet, newMemberCount, newInstallment, cleanAddr]
    );

    this.pgQuery(
      `UPDATE groups SET
        name = $1, member_count = $2, installment_amount = $3
      WHERE LOWER(address) = $4`,
      [newName, newMemberCount, newInstallment, cleanAddr]
    );

    return this.getCircleRegistration(cleanAddr);
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

  public getCirclesForMember(userAddress: string): any[] {
    if (!this.db || !userAddress) return [];
    const cleanUser = this.sanitizeAddress(userAddress);
    const stmt = this.db.prepare(`
      SELECT DISTINCT c.* FROM circle_registrations c
      LEFT JOIN circle_allowed_members a ON LOWER(a.circle_address) = LOWER(c.address)
      LEFT JOIN members m ON LOWER(m.group_address) = LOWER(c.address)
      WHERE LOWER(c.initializer) = ?
         OR LOWER(a.member_address) = ?
         OR LOWER(m.member_address) = ?
      ORDER BY c.created_at DESC
    `);
    stmt.bind([cleanUser, cleanUser, cleanUser]);
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

    this.pgQuery(
      `INSERT INTO circle_join_requests (id, circle_address, applicant_address, applicant_name, status, requested_at, updated_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [id, cleanCircle, cleanApplicant, defaultName, now, now]
    );

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
    const defaultName = `Member (${cleanApplicant.substring(0, 6)}...)`;

    this.db.run(
      `INSERT INTO circle_join_requests (id, circle_address, applicant_address, applicant_name, status, requested_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
      [id, cleanCircle, cleanApplicant, defaultName, status, now, now]
    );
    if (status === "verified") {
      this.addAllowedMember(cleanCircle, cleanApplicant);
    }

    this.save();

    this.pgQuery(
      `INSERT INTO circle_join_requests (id, circle_address, applicant_address, applicant_name, status, requested_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT(id) DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
      [id, cleanCircle, cleanApplicant, defaultName, status, now, now]
    );

    return {
      id,
      circleAddress: cleanCircle,
      applicantAddress: cleanApplicant,
      status,
      updatedAt: now * 1000,
    };
  }

  // --- Allowed Members (Whitelist) Methods ---

  public addAllowedMember(circleAddress: string, memberAddress: string, addedBy: string = ""): void {
    if (!this.db) return;
    const cleanCircle = this.sanitizeAddress(circleAddress);
    const cleanMember = this.sanitizeAddress(memberAddress);
    const cleanAddedBy = this.sanitizeAddress(addedBy);
    const now = Math.floor(Date.now() / 1000);

    this.db.run(
      `INSERT OR REPLACE INTO circle_allowed_members (circle_address, member_address, added_by, added_at)
       VALUES (?, ?, ?, ?)`,
      [cleanCircle, cleanMember, cleanAddedBy, now]
    );
    this.save();

    this.pgQuery(
      `INSERT INTO circle_allowed_members (circle_address, member_address, added_by, added_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (circle_address, member_address) DO UPDATE SET added_by = EXCLUDED.added_by, added_at = EXCLUDED.added_at`,
      [cleanCircle, cleanMember, cleanAddedBy, now]
    );
  }

  public isMemberAllowed(circleAddress: string, memberAddress: string): boolean {
    if (!this.db || !circleAddress || !memberAddress) return false;
    const cleanCircle = this.sanitizeAddress(circleAddress);
    const cleanMember = this.sanitizeAddress(memberAddress);

    // Initializer is always allowed
    const circle = this.getCircleRegistration(cleanCircle);
    if (circle && circle.initializer && circle.initializer.toLowerCase() === cleanMember.toLowerCase()) {
      return true;
    }

    const stmt = this.db.prepare(
      "SELECT COUNT(*) as count FROM circle_allowed_members WHERE LOWER(circle_address) = ? AND LOWER(member_address) = ?"
    );
    stmt.bind([cleanCircle, cleanMember]);
    let allowed = false;
    if (stmt.step()) {
      const obj = stmt.getAsObject() as { count: number };
      allowed = obj.count > 0;
    }
    stmt.free();

    // Check if verified join request exists
    if (!allowed) {
      const req = this.getApplicantJoinStatus(cleanCircle, cleanMember);
      if (req && req.status === "verified") {
        this.addAllowedMember(cleanCircle, cleanMember, circle ? circle.initializer : "");
        return true;
      }
    }

    return allowed;
  }

  public getAllowedMembers(circleAddress: string): string[] {
    if (!this.db || !circleAddress) return [];
    const cleanCircle = this.sanitizeAddress(circleAddress);
    const stmt = this.db.prepare("SELECT member_address FROM circle_allowed_members WHERE LOWER(circle_address) = ?");
    stmt.bind([cleanCircle]);
    const results: string[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as { member_address: string };
      results.push(row.member_address);
    }
    stmt.free();

    // Include initializer
    const circle = this.getCircleRegistration(cleanCircle);
    if (circle && circle.initializer && !results.includes(circle.initializer.toLowerCase())) {
      results.unshift(circle.initializer.toLowerCase());
    }

    return results;
  }

  public removeAllowedMember(circleAddress: string, memberAddress: string): void {
    if (!this.db || !circleAddress || !memberAddress) return;
    const cleanCircle = this.sanitizeAddress(circleAddress);
    const cleanMember = this.sanitizeAddress(memberAddress);
    this.db.run(
      "DELETE FROM circle_allowed_members WHERE LOWER(circle_address) = ? AND LOWER(member_address) = ?",
      [cleanCircle, cleanMember]
    );
    this.save();

    this.pgQuery(
      `DELETE FROM circle_allowed_members WHERE LOWER(circle_address) = $1 AND LOWER(member_address) = $2`,
      [cleanCircle, cleanMember]
    );
  }

  public deleteCircleRegistration(circleAddress: string): void {
    if (!this.db || !circleAddress) return;
    const raw = circleAddress.toLowerCase();
    const cleanCircle = this.sanitizeAddress(circleAddress).toLowerCase();
    const pattern = cleanCircle ? `${cleanCircle}%` : raw;

    const tablesWithAddress = ["circle_registrations", "groups"];
    for (const t of tablesWithAddress) {
      this.db.run(
        `DELETE FROM ${t} WHERE LOWER(address) = ? OR LOWER(address) = ? OR LOWER(address) LIKE ?`,
        [cleanCircle, raw, pattern]
      );
    }

    const tablesWithCircleAddress = ["circle_allowed_members", "circle_join_requests"];
    for (const t of tablesWithCircleAddress) {
      this.db.run(
        `DELETE FROM ${t} WHERE LOWER(circle_address) = ? OR LOWER(circle_address) = ? OR LOWER(circle_address) LIKE ?`,
        [cleanCircle, raw, pattern]
      );
    }

    const tablesWithGroupAddress = ["members", "events", "defaults", "vouches"];
    for (const t of tablesWithGroupAddress) {
      this.db.run(
        `DELETE FROM ${t} WHERE LOWER(group_address) = ? OR LOWER(group_address) = ? OR LOWER(group_address) LIKE ?`,
        [cleanCircle, raw, pattern]
      );
    }

    this.save();

    this.pgQuery(`DELETE FROM circle_registrations WHERE LOWER(address) = $1 OR LOWER(address) LIKE $2`, [cleanCircle, pattern]);
    this.pgQuery(`DELETE FROM groups WHERE LOWER(address) = $1 OR LOWER(address) LIKE $2`, [cleanCircle, pattern]);
    this.pgQuery(`DELETE FROM circle_allowed_members WHERE LOWER(circle_address) = $1 OR LOWER(circle_address) LIKE $2`, [cleanCircle, pattern]);
    this.pgQuery(`DELETE FROM circle_join_requests WHERE LOWER(circle_address) = $1 OR LOWER(circle_address) LIKE $2`, [cleanCircle, pattern]);
    this.pgQuery(`DELETE FROM members WHERE LOWER(group_address) = $1 OR LOWER(group_address) LIKE $2`, [cleanCircle, pattern]);
    this.pgQuery(`DELETE FROM events WHERE LOWER(group_address) = $1 OR LOWER(group_address) LIKE $2`, [cleanCircle, pattern]);
    this.pgQuery(`DELETE FROM defaults WHERE LOWER(group_address) = $1 OR LOWER(group_address) LIKE $2`, [cleanCircle, pattern]);
    this.pgQuery(`DELETE FROM vouches WHERE LOWER(group_address) = $1 OR LOWER(group_address) LIKE $2`, [cleanCircle, pattern]);
  }
}

export const db = new DatabaseManager();
export async function initializeDatabase(): Promise<void> {
  await db.init();
}
