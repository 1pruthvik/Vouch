import { ethers } from "ethers";
import { db } from "../db/database";

export class IndexerService {
  private provider: ethers.JsonRpcProvider;
  private isRunning: boolean = false;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  public start() {
    this.isRunning = true;
    console.log("📡 Vouch Indexer listening to MST Testnet RPC...");
  }

  public stop() {
    this.isRunning = false;
  }

  public recordEvent(
    groupAddress: string,
    eventName: string,
    round: number,
    memberAddress: string,
    amount: string,
    txHash: string,
    blockNumber: number
  ) {
    const timestamp = Math.floor(Date.now() / 1000);
    db.run(
      `INSERT INTO events (group_address, event_name, round, member_address, amount, tx_hash, block_number, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [groupAddress, eventName, round, memberAddress, amount, txHash, blockNumber, timestamp]
    );
  }
}
