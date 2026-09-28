import sqlite3 from "sqlite3";
import * as path from "path";
import * as fs from "fs";

const dbDir = path.resolve(__dirname, "../../data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_FILE || path.join(dbDir, "vouch.sqlite");
export const db = new sqlite3.Database(dbPath);

export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Groups Table
      db.run(`
        CREATE TABLE IF NOT EXISTS groups (
          address TEXT PRIMARY KEY,
          name TEXT,
          member_count INTEGER,
          installment_amount TEXT,
          cycle_duration INTEGER,
          state INTEGER,
          current_round INTEGER,
          reserve_fund TEXT,
          created_at INTEGER
        )
      `);

      // Members Table
      db.run(`
        CREATE TABLE IF NOT EXISTS members (
          group_address TEXT,
          member_address TEXT,
          buffer_balance TEXT,
          locked_dividends TEXT,
          paid_installments INTEGER,
          has_won INTEGER,
          win_round INTEGER,
          is_defaulted INTEGER,
          PRIMARY KEY (group_address, member_address)
        )
      `);

      // Ledger Events Table
      db.run(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_address TEXT,
          event_name TEXT,
          round INTEGER,
          member_address TEXT,
          amount TEXT,
          tx_hash TEXT,
          block_number INTEGER,
          timestamp INTEGER
        )
      `);

      // Default History Table
      db.run(`
        CREATE TABLE IF NOT EXISTS defaults (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_address TEXT,
          round INTEGER,
          defaulter_address TEXT,
          waterfall_tier INTEGER,
          amount_absorbed TEXT,
          tx_hash TEXT,
          timestamp INTEGER
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}
