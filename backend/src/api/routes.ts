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

  // Group Invitations
  router.get("/groups/:id/invitations", (req: Request, res: Response) => {
    const { id } = req.params;
    const invitations = db.getInvitations(id);
    res.json(invitations);
  });

  router.post("/groups/:id/invitations", (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, wallet_address, status } = req.body;
    if (!name || !email || !wallet_address) {
      return res.status(400).json({ error: "Name, email and wallet_address are required" });
    }

    const invitationId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    db.addInvitation({
      id: invitationId,
      group_address: id,
      name,
      email,
      wallet_address,
      status: status || "PENDING",
    });

    res.json({
      success: true,
      invitation: {
        id: invitationId,
        group_address: id,
        name,
        email,
        wallet_address,
        status: status || "PENDING",
      },
    });
  });

  router.get("/invitations/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const invitation = db.getInvitationById(id);
    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }
    res.json(invitation);
  });

  router.patch("/invitations/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    db.updateInvitationStatus(id, status);
    res.json({ success: true, id, status });
  });

  router.delete("/invitations/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    db.deleteInvitation(id);
    res.json({ success: true, id });
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

  // --- Circle Registrations & Join Requests ---

  // Register a new circle created by an initializer
  router.post("/circles/register", (req: Request, res: Response) => {
    const { address, name, memberCount, installmentAmount, cycleDuration, initializer, minWalletAmt } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Circle address is required" });
    }
    db.upsertCircleRegistration({
      address,
      name,
      member_count: memberCount,
      installment_amount: installmentAmount,
      cycle_duration: cycleDuration,
      initializer: initializer || "",
      min_wallet_amt: minWalletAmt,
      created_at: Date.now(),
    });
    res.json({ success: true, circle: db.getCircleRegistration(address) });
  });

  // Get all registered circles
  router.get("/circles", (_req: Request, res: Response) => {
    const circles = db.getAllCircleRegistrations().map((c) => ({
      address: c.address,
      name: c.name,
      memberCount: c.member_count,
      installmentAmount: c.installment_amount,
      cycleDuration: c.cycle_duration,
      initializer: c.initializer,
      minWalletAmt: c.min_wallet_amt,
      createdAt: c.created_at > 10000000000 ? c.created_at : c.created_at * 1000,
    }));
    res.json(circles);
  });

  // Get circle by address
  router.get("/circles/:address", (req: Request, res: Response) => {
    const { address } = req.params;
    const c = db.getCircleRegistration(address);
    if (!c) {
      return res.status(404).json({ error: "Circle not found in registry" });
    }
    res.json({
      address: c.address,
      name: c.name,
      memberCount: c.member_count,
      installmentAmount: c.installment_amount,
      cycleDuration: c.cycle_duration,
      initializer: c.initializer,
      minWalletAmt: c.min_wallet_amt,
      createdAt: c.created_at > 10000000000 ? c.created_at : c.created_at * 1000,
    });
  });

  // Update a circle
  router.put("/circles/:address", (req: Request, res: Response) => {
    const { address } = req.params;
    const { name, minWalletAmt, memberCount, installmentAmount } = req.body;
    const updated = db.updateCircleRegistration(address, {
      name,
      min_wallet_amt: minWalletAmt,
      member_count: memberCount,
      installment_amount: installmentAmount,
    });
    if (!updated) {
      return res.status(404).json({ error: "Circle not found" });
    }
    res.json({
      success: true,
      circle: {
        address: updated.address,
        name: updated.name,
        memberCount: updated.member_count,
        installmentAmount: updated.installment_amount,
        cycleDuration: updated.cycle_duration,
        initializer: updated.initializer,
        minWalletAmt: updated.min_wallet_amt,
        createdAt: updated.created_at > 10000000000 ? updated.created_at : updated.created_at * 1000,
      },
    });
  });

  // Get circles by initializer address
  router.get("/circles/initializer/:initializer", (req: Request, res: Response) => {
    const { initializer } = req.params;
    const circles = db.getCirclesByInitializer(initializer).map((c) => ({
      address: c.address,
      name: c.name,
      memberCount: c.member_count,
      installmentAmount: c.installment_amount,
      cycleDuration: c.cycle_duration,
      initializer: c.initializer,
      minWalletAmt: c.min_wallet_amt,
      createdAt: c.created_at > 10000000000 ? c.created_at : c.created_at * 1000,
    }));
    res.json(circles);
  });

  // Get all circles relevant to a user (as initializer, whitelisted member, or joined member)
  router.get("/circles/member/:userAddress", (req: Request, res: Response) => {
    const { userAddress } = req.params;
    const circles = db.getCirclesForMember(userAddress).map((c) => ({
      address: c.address,
      name: c.name,
      memberCount: c.member_count,
      installmentAmount: c.installment_amount,
      cycleDuration: c.cycle_duration,
      initializer: c.initializer,
      minWalletAmt: c.min_wallet_amt,
      createdAt: c.created_at > 10000000000 ? c.created_at : c.created_at * 1000,
    }));
    res.json(circles);
  });

  // Submit join request from an applicant
  router.post("/circles/:address/requests", (req: Request, res: Response) => {
    const { address } = req.params;
    const { applicantAddress, applicantName } = req.body;
    if (!applicantAddress) {
      return res.status(400).json({ error: "applicantAddress is required" });
    }
    const result = db.submitJoinRequest(address, applicantAddress, applicantName);
    res.json(result);
  });

  // Get all join requests for a circle
  router.get("/circles/:address/requests", (req: Request, res: Response) => {
    const { address } = req.params;
    const requests = db.getJoinRequestsForCircle(address);
    res.json(requests);
  });

  // Get specific applicant status for a circle
  router.get("/circles/:address/requests/:applicant", (req: Request, res: Response) => {
    const { address, applicant } = req.params;
    const statusObj = db.getApplicantJoinStatus(address, applicant);
    res.json(statusObj);
  });

  // Initializer verifies (approves) applicant
  router.post("/circles/:address/requests/:applicant/verify", (req: Request, res: Response) => {
    const { address, applicant } = req.params;
    const result = db.updateJoinRequestStatus(address, applicant, "verified");
    res.json({ success: true, request: result });
  });

  // Initializer rejects applicant
  router.post("/circles/:address/requests/:applicant/reject", (req: Request, res: Response) => {
    const { address, applicant } = req.params;
    const result = db.updateJoinRequestStatus(address, applicant, "rejected");
    res.json({ success: true, request: result });
  });

  // --- Allowed Members (Whitelist) Endpoints ---

  // Get all allowed members for a circle
  router.get("/circles/:address/allowed", (req: Request, res: Response) => {
    const { address } = req.params;
    const allowed = db.getAllowedMembers(address);
    res.json({ circleAddress: address, allowedMembers: allowed });
  });

  // Check if a specific member is allowed to view / join the circle
  router.get("/circles/:address/allowed/:memberAddress", (req: Request, res: Response) => {
    const { address, memberAddress } = req.params;
    const isAllowed = db.isMemberAllowed(address, memberAddress);
    res.json({ circleAddress: address, memberAddress, isAllowed });
  });

  // Add a member directly to allowed list
  router.post("/circles/:address/allowed", (req: Request, res: Response) => {
    const { address } = req.params;
    const { memberAddress, addedBy } = req.body;
    if (!memberAddress) {
      return res.status(400).json({ error: "memberAddress is required" });
    }
    db.addAllowedMember(address, memberAddress, addedBy || "");
    res.json({ success: true, message: `Member ${memberAddress} added to allowed list for circle ${address}` });
  });

  // Remove a member from allowed list
  router.delete("/circles/:address/allowed/:memberAddress", (req: Request, res: Response) => {
    const { address, memberAddress } = req.params;
    db.removeAllowedMember(address, memberAddress);
    res.json({ success: true, message: `Member ${memberAddress} removed from allowed list for circle ${address}` });
  });

  // Delete a circle from registry & indexer
  router.delete("/circles/:address", (req: Request, res: Response) => {
    const { address } = req.params;
    db.deleteCircleRegistration(address);
    indexer.untrackGroup(address);
    res.json({ success: true, message: `Circle ${address} deleted from registry and indexer` });
  });

  return router;
}
