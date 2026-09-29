export interface NetworkConfig {
  name: string;
  chainId: number;
  chainIdHex: string;
  rpcUrl: string;
  symbol: string;
  decimals: number;
  explorerUrl: string;
}

export const MST_TESTNET: NetworkConfig = {
  name: "MST Testnet",
  chainId: 91562037,
  chainIdHex: "0x5752eb5",
  rpcUrl: "https://testnetrpc.mstblockchain.com",
  symbol: "tMSTC",
  decimals: 18,
  explorerUrl: "https://testnet.mstscan.com",
};

export const CONTRACT_ADDRESSES = {
  ChitFactory: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  VouchRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  MockYieldVault: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  MockERC20: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
};

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

