import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying Vouch contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy MockYieldVault
  const YieldVault = await ethers.getContractFactory("MockYieldVault");
  const yieldVault = await YieldVault.deploy();
  await yieldVault.waitForDeployment();
  const yieldVaultAddress = await yieldVault.getAddress();
  console.log("✅ MockYieldVault deployed to:", yieldVaultAddress);

  // 2. Deploy VouchRegistry
  const VouchRegistry = await ethers.getContractFactory("VouchRegistry");
  const vouchRegistry = await VouchRegistry.deploy();
  await vouchRegistry.waitForDeployment();
  const vouchRegistryAddress = await vouchRegistry.getAddress();
  console.log("✅ VouchRegistry deployed to:", vouchRegistryAddress);

  // 3. Deploy ChitFactory
  const ChitFactory = await ethers.getContractFactory("ChitFactory");
  const chitFactory = await ChitFactory.deploy(vouchRegistryAddress, yieldVaultAddress);
  await chitFactory.waitForDeployment();
  const chitFactoryAddress = await chitFactory.getAddress();
  console.log("✅ ChitFactory deployed to:", chitFactoryAddress);

  // 4. Deploy MockERC20 (mUSDC)
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy("Mock USD Coin", "mUSDC", 6);
  await mockERC20.waitForDeployment();
  const mockERC20Address = await mockERC20.getAddress();
  console.log("✅ MockERC20 (mUSDC) deployed to:", mockERC20Address);

  // Transfer VouchRegistry ownership or authorize ChitFactory
  await vouchRegistry.authorizeGroup(chitFactoryAddress, true);

  // Export deployments
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
  };

  const deploymentsDir = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "deployments.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("📁 Deployment info saved to deployments/deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
