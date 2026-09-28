import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { initializeDatabase } from "./db/database";
import { apiRouter } from "./api/routes";
import { IndexerService } from "./indexer/listener";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const rpcUrl = process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";

app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);

async function startServer() {
  await initializeDatabase();
  console.log("💾 SQLite database initialized");

  const indexer = new IndexerService(rpcUrl);
  indexer.start();

  app.listen(PORT, () => {
    console.log(`🚀 Vouch Backend API & Indexer running on port ${PORT}`);
  });
}

startServer().catch(console.error);
