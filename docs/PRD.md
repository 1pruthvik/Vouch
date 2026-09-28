# PRD.md — Vouch Product Requirements Document

## 1. Problem Statement
Rotating Savings and Credit Associations (ROSCAs / Chit Funds) serve over 1 billion people worldwide as community banking and credit mechanisms. However, traditional chit funds suffer from:
1. **Operator Fraud & Embezzlement**: Central foreman runs away with the pool.
2. **Defaulter Risk**: Early winners stop paying future installments (up to 35% global default rate, 24% post-win).
3. **No Social/Reputational Backing on Web3**: Traditional DeFi requires 150%+ hard overcollateralization, excluding the underbanked.

## 2. Vouch Solution
Vouch transforms ROSCAs into a trustless, smart-contract protocol on MST Blockchain featuring:
- **Autonomous Lifecycle**: Automated collection, commit-reveal auctions, and settlement without a central foreman.
- **Social Staked Vouching**: Vouchers stake capital to back friends/peers, reducing individual collateral requirements.
- **5-Step Default Waterfall**: Multi-layered protection guaranteeing the pot is paid even if members default.
- **Discount Floor Mechanic**: Protects payout predictability by placing a hard ceiling on discounts.
- **Dual-Stream Yield**: Puts idle pool funds into yield vaults while waiting for auctions and settlements.
- **AI-Assisted Risk Scoring**: Off-chain ML engine offering data-driven collateral advice.

---

## 3. Core Economics & Mechanics

### Chit Group Parameters:
- `memberCount`: Total number of participants (e.g. 5 members).
- `installmentAmount`: Amount each member pays per cycle (e.g. 100 tMSTC).
- `cycleDuration`: Time per round (e.g. 1 month in production, compressed to 5 minutes in demo).
- `discountCapBps`: Maximum discount allowed (e.g. 3000 bps = 30%).
- `reserveFeeBps`: Slice of discount routed to the Protocol Reserve Fund (e.g. 500 bps = 5%).

### Example Round Flow:
- 5 members pay 100 tMSTC $\to$ Pot = 500 tMSTC.
- Reverse Auction: Members bid lowest payout they will accept.
- Winning Bid: 400 tMSTC (100 tMSTC discount).
- Winning Member receives 400 tMSTC.
- Discount Distribution:
  - 95 tMSTC distributed equally as dividends to all 5 members (19 tMSTC discount dividend each, reducing next installment).
  - 5 tMSTC added to Group Reserve Fund.
- Idle funds in Pot earn yield via `MockYieldVault`.
