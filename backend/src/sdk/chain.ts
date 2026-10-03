import { defineChain } from "viem";

export const mstTestnet = defineChain({
  id: 91562037,
  name: "MST Testnet",
  nativeCurrency: {
    name: "MST Token",
    symbol: "tMSTC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnetrpc.mstblockchain.com"],
    },
    public: {
      http: ["https://testnetrpc.mstblockchain.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "MSTScan",
      url: "https://testnet.mstscan.com",
    },
  },
  testnet: true,
});

export const DEFAULT_RPC_URL = "https://testnetrpc.mstblockchain.com";
export const MST_CHAIN_ID = 91562037;
export const MST_CHAIN_ID_HEX = "0x5752eb5";
