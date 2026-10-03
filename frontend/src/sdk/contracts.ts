import type { Address } from "viem";
import {
  ChitFactoryABI,
  ChitGroupABI,
  VouchRegistryABI,
  ChitGroupBytecode,
} from "../contracts/abis";
import deployedContracts from "../contracts/contracts.json";

export { ChitFactoryABI, ChitGroupABI, VouchRegistryABI, ChitGroupBytecode };

export const MockYieldVaultABI = (deployedContracts as any).abis?.MockYieldVault || [];
export const MockERC20ABI = (deployedContracts as any).abis?.MockERC20 || [];

// Default deployed addresses on MST Testnet
export const DEFAULT_CONTRACT_ADDRESSES: {
  ChitFactory: Address;
  VouchRegistry: Address;
  MockYieldVault: Address;
  MockERC20: Address;
} = {
  ChitFactory: ((deployedContracts as any).contracts?.ChitFactory || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0") as Address,
  VouchRegistry: ((deployedContracts as any).contracts?.VouchRegistry || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") as Address,
  MockYieldVault: ((deployedContracts as any).contracts?.MockYieldVault || "0x5FbDB2315678afecb367f032d93F642f64180aa3") as Address,
  MockERC20: ((deployedContracts as any).contracts?.MockERC20 || "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9") as Address,
};
