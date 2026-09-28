# ARCHITECTURE.md — Vouch System Architecture

## 1. System Overview & MST Network Target

Vouch is an autonomous, decentralized ROSCA (Rotating Savings and Credit Association / Chit Fund) protocol designed to eliminate counterparty risk and operator fraud.

- **Blockchain Target:** MST Blockchain Testnet
- **Chain ID:** `91562037`
- **RPC URL:** `https://testnetrpc.mstblockchain.com`
- **Currency:** `tMSTC` / ERC-20 (`mUSDC`)
- **EVM Target:** `paris` (Ensure `evmVersion: "paris"` in Solidity compiler settings)
- **Explorer:** `https://testnet.mstscan.com`

---

## 2. Core Architecture Diagram

```
                       +-------------------------+
                       |    BridgeKey Wallet     |
                       +------------+------------+
                                    |
                                    v
+------------------+   +------------+------------+   +-------------------+
|  AI Risk Engine  |<--|   React + Vite Frontend |-->| Backend Indexer   |
| (FastAPI/XGBoost)|   +------------+------------+   | (Express + SQLite)|
+------------------+                |                +---------+---------+
                                    |                          ^
                                    v                          | (RPC Events)
                       +------------+------------+             |
                       | MST Blockchain Testnet  |-------------+
                       | - ChitFactory           |
                       | - ChitGroup             |
                       | - VouchRegistry         |
                       | - MockYieldVault        |
                       +-------------------------+
```

---

## 3. Smart Contract State Machine (`ChitGroup.sol`)

A Chit Group progresses through explicit cyclic phases:

```
[Forming] -> [Collect] -> [Commit] -> [Reveal] -> [Settle] -> [Collect (Next Round)] ... -> [Closed]
```

### State Enum:
1. `Forming`: Members join, deposit initial collateral buffer, voucher stakes are registered.
2. `Collect`: Autopay/pull-payment collects the monthly installment from all active members.
3. `Commit`: Eligible members commit hash `keccak256(abi.encodePacked(bidAmount, salt, msg.sender))`.
4. `Reveal`: Members reveal `(bidAmount, salt)`. The lowest bid wins (or highest discount offered).
5. `Settle`: Winning pot is calculated, discount dividend is distributed, yield is rolled, collateral status updated.
6. `Closed`: Final round completed, all remaining collateral buffers and dividends returned to non-defaulted members.

---

## 4. Solvency & Collateral Formula (§6)

A winning member receives liquidity today and incurs an obligation to pay future installments.

**Invariant:**
$$\text{Collateral} \times 10000 \ge \text{RemainingInstallments} \times \text{SafetyFactorBps}$$

- **SafetyFactorBps:** e.g., 12,000 (120% coverage) or 10,000 (100% baseline).
- **Collateral Sources:**
  1. Direct member collateral buffer
  2. Locked accumulated dividends
  3. Staked voucher balance in `VouchRegistry`

---

## 5. 5-Step Default Waterfall (§7)

When a member fails to pay an installment during the `Collect` phase:

1. **Layer 1: Member Buffer** — Defaulter's deposited collateral buffer is debited.
2. **Layer 2: Locked Dividends** — Defaulter's accumulated yield/dividends are seized.
3. **Layer 3: Voucher Stake** — Slashed from the voucher's staked balance in `VouchRegistry`.
4. **Layer 4: Protocol Reserve Fund** — Paid out from accumulated discount floor splits.
5. **Layer 5: Pro-Rata Haircut** — Socialized deduction across solvent members if all buffers are exhausted.

---

## 6. AI Risk Advisory Engine (Advisory Only)

- Built by Nivish (branch `nivish`)
- Runs off-chain via FastAPI (`/predict-risk`)
- Takes features: `monthsRemaining`, `paymentStreak`, `voucherReputationScore`, `bidTiming`
- Returns: `{ member, suggestedCollateralMultiplier, defaultProbability }`
- **Hard Rule:** Advisory only. Smart contract invariants always enforce on-chain solvency deterministically.
