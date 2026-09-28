import { Router } from "express";
import { db } from "../db/database";

export const apiRouter = Router();

apiRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    network: "MST Testnet",
    chainId: 91562037,
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get("/groups", (req, res) => {
  db.all("SELECT * FROM groups ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

apiRouter.get("/groups/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM groups WHERE address = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Group not found" });
    res.json(row);
  });
});

apiRouter.get("/ledger/:groupId", (req, res) => {
  const { groupId } = req.params;
  db.all(
    "SELECT * FROM events WHERE group_address = ? ORDER BY timestamp DESC",
    [groupId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

apiRouter.get("/members/:address", (req, res) => {
  const { address } = req.params;
  db.all(
    "SELECT * FROM members WHERE member_address = ?",
    [address],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});
