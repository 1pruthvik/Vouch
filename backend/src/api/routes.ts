import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import { db } from "../db/database";
import { CONFIG } from "../config";
import { IndexerService } from "../indexer/listener";
import { KeeperBot } from "../keeper/bot";
import ChitGroupAbi from "../abis/ChitGroup.json";

export function createApiRouter(indexer: IndexerService, keeper: KeeperBot): Router {
  const router = Router();
  const provider = new ethers.JsonRpcProvider(CONFIG.MST_RPC_URL);

  // Health & Network Info
  router.get("/health", async (_req: Request, res: Response) => {
    let blockNumber = 0;
    try {
      blockNumber = await provider.getBlockNumber();
    } catch {}

    res.json({
      status: "ok",
      protocol: "Vouch ROSCA",
      network: "MST Blockchain Testnet",
      chainId: CONFIG.CHAIN_ID,
      rpcUrl: CONFIG.MST_RPC_URL,
      explorerUrl: CONFIG.EXPLORER_URL,
      factoryAddress: CONFIG.FACTORY_ADDRESS,
      vouchRegistryAddress: CONFIG.VOUCH_REGISTRY_ADDRESS,
      latestBlock: blockNumber,
      lastIndexedBlock: db.getSyncBlock(),
      timestamp: new Date().toISOString(),
    });
  });

  // Protocol Stats
  router.get("/stats", async (_req: Request, res: Response) => {
    let blockNumber = 0;
    try {
      blockNumber = await provider.getBlockNumber();
    } catch {}
    res.json(db.getStats(blockNumber));
  });

  // All Groups
  router.get("/groups", (_req: Request, res: Response) => {
    const groups = db.getGroups();
    res.json(groups);
  });

  // Single Group Details
  router.get("/groups/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const group = db.getGroup(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found in indexer database" });
    }

    const members = db.getMembers(id);
    const defaults = db.getGroupDefaults(id);

    // Live contract check for solvency if address is valid
    let liveSolvency: any[] = [];
    try {
      if (ethers.isAddress(id)) {
        const contract = new ethers.Contract(id, ChitGroupAbi, provider);
        liveSolvency = await Promise.all(
          members.map(async (m) => {
            try {
              const res = await contract.checkSolvency(m.member_address);
              return {
                member: m.member_address,
                isSolvent: res.isSolvent,
                totalBacking: res.totalBacking.toString(),
                requiredBacking: res.requiredBacking.toString(),
              };
            } catch {
              return null;
            }
          })
        );
      }
    } catch {}

    res.json({
      ...group,
      members,
      defaults,
      solvencyInfo: liveSolvency.filter(Boolean),
    });
  });

  // Group Members
  router.get("/groups/:id/members", (req: Request, res: Response) => {
    const { id } = req.params;
    const members = db.getMembers(id);
    res.json(members);
  });

  // Group Ledger / Events
  router.get("/groups/:id/ledger", (req: Request, res: Response) => {
    const { id } = req.params;
    const events = db.getGroupLedger(id).map((ev) => ({
      ...ev,
      explorerTxUrl: ev.tx_hash ? `${CONFIG.EXPLORER_URL}/tx/${ev.tx_hash}` : null,
    }));
    res.json(events);
  });

  // Alternative ledger route for frontend compatibility
  router.get("/ledger/:groupId", (req: Request, res: Response) => {
    const { groupId } = req.params;
    const events = db.getGroupLedger(groupId).map((ev) => ({
      ...ev,
      explorerTxUrl: ev.tx_hash ? `${CONFIG.EXPLORER_URL}/tx/${ev.tx_hash}` : null,
    }));
    res.json(events);
  });

  // Group Defaults (Waterfall history)
  router.get("/groups/:id/defaults", (req: Request, res: Response) => {
    const { id } = req.params;
    const defaults = db.getGroupDefaults(id).map((def) => ({
      ...def,
      explorerTxUrl: def.tx_hash ? `${CONFIG.EXPLORER_URL}/tx/${def.tx_hash}` : null,
    }));
    res.json(defaults);
  });

  // Member Dashboard across all groups
  router.get("/members/:address", (req: Request, res: Response) => {
    const { address } = req.params;
    const groups = db.getMemberGroups(address);
    const vouches = db.getVouchesForVouchee(address);
    const voucherProfile = db.getVoucher(address);

    res.json({
      address,
      participatingGroups: groups,
      activeVouchesReceived: vouches,
      voucherProfile,
    });
  });

  // Vouchers List & Profile
  router.get("/vouchers", (_req: Request, res: Response) => {
    res.json(db.getAllVouchers());
  });

  router.get("/vouchers/:address", (req: Request, res: Response) => {
    const { address } = req.params;
    const profile = db.getVoucher(address);
    const givenVouches = db.getVouchesByVoucher(address);
    res.json({
      profile: profile || {
        address,
        total_staked: "0",
        locked_stake: "0",
        reputation_score: 1000,
        active_vouchee_count: 0,
      },
      vouchesGiven: givenVouches,
    });
  });

  // Vouches for a vouchee
  router.get("/vouches/vouchee/:address", (req: Request, res: Response) => {
    const { address } = req.params;
    res.json(db.getVouchesForVouchee(address));
  });

  // Manual Trigger to index a new group address
  router.post("/groups/index", async (req: Request, res: Response) => {
    const { address } = req.body;
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid group address provided" });
    }

    try {
      indexer.trackGroup(address);
      await indexer.syncGroupState(address);
      const group = db.getGroup(address);
      res.json({ success: true, message: `Group ${address} registered and synced`, group });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Keeper: Evaluate Group
  router.post("/keeper/evaluate/:groupId", async (req: Request, res: Response) => {
    const { groupId } = req.params;
    try {
      const result = await keeper.evaluateGroup(groupId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Keeper: Admin Fast-Forward Cycle (Demo Aid)
  router.post("/keeper/advance/:groupId", async (req: Request, res: Response) => {
    const { groupId } = req.params;
    try {
      const result = await keeper.forceAdvance(groupId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
