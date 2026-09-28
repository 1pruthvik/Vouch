import { ethers, artifacts } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying Vouch Protocol contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "tMSTC");

  // 1. Deploy MockYieldVault
  console.log("\n1. Deploying MockYieldVault...");
  const YieldVault = await ethers.getContractFactory("MockYieldVault");
  const yieldVault = await YieldVault.deploy();
  await yieldVault.waitForDeployment();
  const yieldVaultAddress = await yieldVault.getAddress();
  console.log("✅ MockYieldVault deployed at:", yieldVaultAddress);

  // 2. Deploy VouchRegistry
  console.log("\n2. Deploying VouchRegistry...");
  const VouchRegistry = await ethers.getContractFactory("VouchRegistry");
  const vouchRegistry = await VouchRegistry.deploy();
  await vouchRegistry.waitForDeployment();
  const vouchRegistryAddress = await vouchRegistry.getAddress();
  console.log("✅ VouchRegistry deployed at:", vouchRegistryAddress);

  // 3. Deploy ChitFactory
  console.log("\n3. Deploying ChitFactory...");
  const ChitFactory = await ethers.getContractFactory("ChitFactory");
  const chitFactory = await ChitFactory.deploy(vouchRegistryAddress, yieldVaultAddress);
  await chitFactory.waitForDeployment();
  const chitFactoryAddress = await chitFactory.getAddress();
  console.log("✅ ChitFactory deployed at:", chitFactoryAddress);

  // 4. Deploy MockERC20 (mUSDC) for stablecoin demos
  console.log("\n4. Deploying MockERC20 (mUSDC)...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy("Mock USD Coin", "mUSDC", 6);
  await mockERC20.waitForDeployment();
  const mockERC20Address = await mockERC20.getAddress();
  console.log("✅ MockERC20 deployed at:", mockERC20Address);

  // Authorize ChitFactory in VouchRegistry
  console.log("\n5. Authorizing ChitFactory in VouchRegistry...");
  const authTx = await vouchRegistry.authorizeGroup(chitFactoryAddress, true);
  await authTx.wait();
  console.log("✅ ChitFactory authorized to register groups in VouchRegistry");

  // Fetch ABIs
  const chitFactoryArtifact = await artifacts.readArtifact("ChitFactory");
  const chitGroupArtifact = await artifacts.readArtifact("ChitGroup");
  const vouchRegistryArtifact = await artifacts.readArtifact("VouchRegistry");
  const yieldVaultArtifact = await artifacts.readArtifact("MockYieldVault");
  const mockERC20Artifact = await artifacts.readArtifact("MockERC20");

  const deploymentData = {
    network: "mstTestnet",
    chainId: 91562037,
    rpcUrl: "https://testnetrpc.mstblockchain.com",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ChitFactory: chitFactoryAddress,
      VouchRegistry: vouchRegistryAddress,
      MockYieldVault: yieldVaultAddress,
      MockERC20: mockERC20Address,
    },
    abis: {
      ChitFactory: chitFactoryArtifact.abi,
      ChitGroup: chitGroupArtifact.abi,
      VouchRegistry: vouchRegistryArtifact.abi,
      MockYieldVault: yieldVaultArtifact.abi,
      MockERC20: mockERC20Artifact.abi,
    },
  };

  // 1. Write to deployments/deployments.json
  const deploymentsDir = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(path.join(deploymentsDir, "deployments.json"), JSON.stringify(deploymentData, null, 2));

  // 2. Export to frontend/src/contracts/
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) fs.mkdirSync(frontendContractsDir, { recursive: true });
  fs.writeFileSync(
    path.join(frontendContractsDir, "contracts.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  // 3. Export to backend/src/contracts/
  const backendContractsDir = path.join(__dirname, "../../backend/src/contracts");
  if (!fs.existsSync(backendContractsDir)) fs.mkdirSync(backendContractsDir, { recursive: true });
  fs.writeFileSync(
    path.join(backendContractsDir, "contracts.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("\n🎉 Full deployment data & ABIs exported to:");
  console.log("   - deployments/deployments.json");
  console.log("   - frontend/src/contracts/contracts.json");
  console.log("   - backend/src/contracts/contracts.json");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
