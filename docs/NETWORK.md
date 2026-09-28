# NETWORK.md — MST Blockchain Configuration & BridgeKey Setup

## MST Testnet Parameters

| Parameter | Value |
|---|---|
| **Network Name** | MST Testnet |
| **RPC URL** | `https://testnetrpc.mstblockchain.com` |
| **Chain ID** | `91562037` (`0x5752eb5`) |
| **Currency Symbol** | `tMSTC` |
| **Decimals** | `18` |
| **Block Explorer** | [https://testnet.mstscan.com](https://testnet.mstscan.com) |
| **Solidity EVM Target** | `paris` |

---

## BridgeKey Wallet Setup

1. Install the BridgeKey extension in Chrome/Brave.
2. Create or import your testnet wallet.
3. Switch network to **MST Testnet** or use the one-click network addition in our frontend.
4. Claim testnet `tMSTC` tokens from the official faucet.

---

## EIP-6963 Wallet Connection Standard

The Vouch frontend implements EIP-6963 multi-injected provider discovery with standard `window.ethereum` fallback to ensure seamless BridgeKey wallet compatibility.
