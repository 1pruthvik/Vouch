import express from "express";
import cors from "cors";
import { CONFIG } from "./config";
import { initializeDatabase } from "./db/database";
import { IndexerService } from "./indexer/listener";
import { KeeperBot } from "./keeper/bot";
import { createApiRouter } from "./api/routes";

const app = express();

app.use(cors());
app.use(express.json());

async function bootstrap() {
  console.log("--------------------------------------------------");
  console.log("🌟 Starting Vouch Backend Engine (Indexer + Keeper)");
  console.log(`🌐 MST RPC: ${CONFIG.MST_RPC_URL}`);
  console.log(`⛓️  Chain ID: ${CONFIG.CHAIN_ID}`);
  console.log("--------------------------------------------------");

  // 1. Initialize SQLite Database
  await initializeDatabase();
  console.log("💾 Persistent SQLite database initialized (clean start, zero dummy rows)");

  // 2. Initialize Indexer
  const indexer = new IndexerService(CONFIG.MST_RPC_URL);
  await indexer.start();

  // 3. Initialize Keeper Bot
  const keeper = new KeeperBot();
  keeper.startAutomationLoop();

  // 4. Attach API Routes
  app.use("/api", createApiRouter(indexer, keeper));

  // Root welcome
  app.get("/", (_req, res) => {
    res.json({
      name: "Vouch ROSCA Backend API",
      status: "online",
      endpoints: {
        health: "/api/health",
        stats: "/api/stats",
        groups: "/api/groups",
        ledger: "/api/groups/:id/ledger",
        defaults: "/api/groups/:id/defaults",
        members: "/api/members/:address",
        vouchers: "/api/vouchers",
      },
    });
  });

  const server = app.listen(CONFIG.PORT, () => {
    console.log(`🚀 Vouch Backend API server listening on http://localhost:${CONFIG.PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("\n🛑 Gracefully shutting down Vouch Backend...");
    indexer.stop();
    keeper.stop();
    server.close(() => {
      console.log("👋 Backend service terminated cleanly.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
  console.error("💥 Fatal error during backend bootstrap:", err);
  process.exit(1);
});
