import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config();

function loadDeploymentAddresses() {
  try {
    const deploymentPath = path.resolve(__dirname, "../../deployments/deployments.json");
    if (fs.existsSync(deploymentPath)) {
      const raw = fs.readFileSync(deploymentPath, "utf-8");
      const parsed = JSON.parse(raw);
      return parsed.contracts || {};
    }
  } catch (err) {
    console.warn("⚠️ Could not read deployments/deployments.json", err);
  }
  return {};
}

const deployments = loadDeploymentAddresses();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || "4000", 10),
  MST_RPC_URL: process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com",
  CHAIN_ID: parseInt(process.env.CHAIN_ID || "91562037", 10),
  EXPLORER_URL: process.env.EXPLORER_URL || "https://testnet.mstscan.com",
  KEEPER_PRIVATE_KEY: process.env.KEEPER_PRIVATE_KEY || "",
  FACTORY_ADDRESS: process.env.FACTORY_ADDRESS || deployments.ChitFactory || "",
  VOUCH_REGISTRY_ADDRESS: process.env.VOUCH_REGISTRY_ADDRESS || deployments.VouchRegistry || "",
  YIELD_VAULT_ADDRESS: process.env.YIELD_VAULT_ADDRESS || deployments.MockYieldVault || "",
  DB_FILE: process.env.DB_FILE || path.resolve(__dirname, "../../data/vouch.sqlite"),
  POLL_INTERVAL_MS: parseInt(process.env.POLL_INTERVAL_MS || "5000", 10),
  KEEPER_INTERVAL_MS: parseInt(process.env.KEEPER_INTERVAL_MS || "8000", 10),
};
