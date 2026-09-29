import { ethers } from "ethers";
import { CONFIG } from "../config";
import { db } from "../db/database";
import ChitGroupAbi from "../abis/ChitGroup.json";
import { GroupState } from "../types";

export class KeeperBot {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;
  private isRunning: boolean = false;
  private loopTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.MST_RPC_URL);

    if (CONFIG.KEEPER_PRIVATE_KEY && CONFIG.KEEPER_PRIVATE_KEY.length >= 64) {
      try {
        const pk = CONFIG.KEEPER_PRIVATE_KEY.startsWith("0x")
          ? CONFIG.KEEPER_PRIVATE_KEY
          : `0x${CONFIG.KEEPER_PRIVATE_KEY}`;
        this.wallet = new ethers.Wallet(pk, this.provider);
        console.log(`🤖 Keeper Bot wallet initialized: ${this.wallet.address}`);
      } catch (err: any) {
        console.warn(`⚠️ Invalid KEEPER_PRIVATE_KEY, running Keeper in observation/read-only mode:`, err.message);
      }
    } else {
      console.log(`ℹ️ Keeper Bot running in observation mode (no private key configured).`);
    }
  }

  public startAutomationLoop(): void {
    this.isRunning = true;
    console.log(`⏱️ Vouch Keeper automation active (check interval: ${CONFIG.KEEPER_INTERVAL_MS}ms)`);
    this.runLoop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    console.log("🛑 Keeper Bot stopped.");
  }

  private async runLoop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.checkAllActiveGroups();
    } catch (err: any) {
      console.error(`⚠️ Keeper loop error:`, err.message);
    }

    if (this.isRunning) {
      this.loopTimer = setTimeout(() => this.runLoop(), CONFIG.KEEPER_INTERVAL_MS);
    }
  }

  public async checkAllActiveGroups(): Promise<void> {
    const groups = db.getGroups();
    const activeGroups = groups.filter(
      (g) => g.state !== GroupState.Closed && g.state !== GroupState.Forming
    );

    for (const g of activeGroups) {
      await this.evaluateGroup(g.address);
    }
  }

  public async evaluateGroup(groupAddress: string): Promise<{ triggered: boolean; action: string; txHash?: string }> {
    try {
      const contract = new ethers.Contract(groupAddress, ChitGroupAbi, this.provider);
      const [state, currentRound, phaseStartTime, cycleDuration, memberCount, membersList] = await Promise.all([
        contract.currentState().then(Number),
        contract.currentRound().then(Number),
        contract.phaseStartTime().then(Number),
        contract.cycleDuration().then(Number),
        contract.memberCount().then(Number),
        contract.getMembers(),
      ]);

      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - phaseStartTime;

      // 1. Collect Phase Evaluation
      if (state === GroupState.Collect) {
        let allPaid = true;
        for (const mAddr of membersList) {
          const m = await contract.members(mAddr);
          if (Number(m.paidInstallments) < currentRound) {
            allPaid = false;
            break;
          }
        }

        // Trigger transition if all paid or cycle duration elapsed
        if (allPaid || elapsed >= cycleDuration) {
          console.log(`🤖 Keeper trigger: Group ${groupAddress} ready for Commit (allPaid: ${allPaid}, elapsed: ${elapsed}s/${cycleDuration}s)`);
          return await this.executeAction(groupAddress, "advanceToCommit");
        }
      }

      // 2. Commit Phase Evaluation (Auction window: compressed to 60s for demo or 20% of cycleDuration)
      if (state === GroupState.Commit) {
        const commitWindow = Math.min(60, Math.max(10, Math.floor(cycleDuration / 3)));
        if (elapsed >= commitWindow) {
          console.log(`🤖 Keeper trigger: Group ${groupAddress} commit window finished (${elapsed}s >= ${commitWindow}s). Advancing to Reveal.`);
          return await this.executeAction(groupAddress, "advanceToReveal");
        }
      }

      // 3. Reveal Phase Evaluation (Reveal window: 60s for demo or 20% of cycleDuration)
      if (state === GroupState.Reveal) {
        const revealWindow = Math.min(60, Math.max(10, Math.floor(cycleDuration / 3)));
        if (elapsed >= revealWindow) {
          console.log(`🤖 Keeper trigger: Group ${groupAddress} reveal window finished (${elapsed}s >= ${revealWindow}s). Settling Round ${currentRound}.`);
          return await this.executeAction(groupAddress, "settleRound");
        }
      }

      return { triggered: false, action: "none" };
    } catch (err: any) {
      console.warn(`Keeper evaluation warning for ${groupAddress}:`, err.message);
      return { triggered: false, action: "error", txHash: err.message };
    }
  }

  public async forceAdvance(groupAddress: string): Promise<{ success: boolean; action: string; txHash?: string; message: string }> {
    try {
      const contract = new ethers.Contract(groupAddress, ChitGroupAbi, this.provider);
      const state = await contract.currentState().then(Number);

      let action: "advanceToCommit" | "advanceToReveal" | "settleRound";
      if (state === GroupState.Collect) action = "advanceToCommit";
      else if (state === GroupState.Commit) action = "advanceToReveal";
      else if (state === GroupState.Reveal) action = "settleRound";
      else {
        return {
          success: false,
          action: "none",
          message: `Cannot fast-forward in state: ${GroupState[state]}`,
        };
      }

      const res = await this.executeAction(groupAddress, action);
      return {
        success: res.triggered,
        action,
        txHash: res.txHash,
        message: res.triggered ? `Successfully executed ${action}` : `Action ${action} attempted in observation mode`,
      };
    } catch (err: any) {
      return { success: false, action: "error", message: err.message };
    }
  }

  private async executeAction(groupAddress: string, actionName: "advanceToCommit" | "advanceToReveal" | "settleRound"): Promise<{ triggered: boolean; action: string; txHash?: string }> {
    if (!this.wallet) {
      console.log(`[Keeper Dry-Run] Would execute ${actionName}() on ${groupAddress}`);
      return { triggered: false, action: actionName };
    }

    try {
      const contract = new ethers.Contract(groupAddress, ChitGroupAbi, this.wallet);
      const tx = await contract[actionName]();
      console.log(`🚀 Keeper submitted tx: ${tx.hash} for ${actionName}() on ${groupAddress}`);
      const receipt = await tx.wait();
      console.log(`✅ Keeper tx confirmed: ${receipt.hash} in block ${receipt.blockNumber}`);
      return { triggered: true, action: actionName, txHash: receipt.hash };
    } catch (err: any) {
      console.error(`❌ Keeper tx execution failed for ${actionName} on ${groupAddress}:`, err.message);
      return { triggered: false, action: actionName, txHash: err.message };
    }
  }
}
