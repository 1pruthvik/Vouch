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
  ChitFactory: "",
  VouchRegistry: "",
  MockYieldVault: "",
  MockERC20: "",
};
