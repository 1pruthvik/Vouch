# NETWORK.md — MST Blockchain Configuration & BridgeKey Setup

## 1. MST Testnet Parameters

| Parameter | Value |
|---|---|
| **Network Name** | MST Testnet |
| **RPC URL** | `https://testnetrpc.mstblockchain.com` |
| **Chain ID** | `91562037` (`0x5752eb5`) |
| **Currency Symbol** | `tMSTC` |
| **Decimals** | `18` |
| **Block Explorer** | `https://testnet.mstscan.com` |
| **Solidity EVM Target** | `paris` |

---

## 2. BridgeKey Wallet Setup

1. Install the **BridgeKey** extension in Chrome or Brave.
2. Create or import your testnet wallet.
3. Switch the wallet network to **MST Testnet**.
4. Alternatively, use the one-click network addition provided by the frontend.
5. Claim testnet `tMSTC` tokens from the official faucet.
6. Verify that the wallet is connected to the correct MST Testnet network before interacting with the application.

---

## 3. EIP-6963 Wallet Connection Standard

The Vouch frontend implements **EIP-6963** for multi-injected wallet provider discovery.

This allows the frontend to:

- Discover BridgeKey and other EIP-6963-compatible wallets.
- Select the appropriate injected wallet provider.
- Connect to the user's wallet without relying exclusively on a single provider.
- Fall back to the standard `window.ethereum` provider when EIP-6963 discovery is unavailable.

The wallet connection flow is therefore:

```text
User opens Vouch
       ↓
Frontend detects EIP-6963 providers
       ↓
BridgeKey provider discovered
       ↓
User selects/connects wallet
       ↓
MST Testnet network verified
       ↓
Wallet connected
       ↓
Vouch application can interact with MST