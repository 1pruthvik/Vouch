# PHASES.md — Vouch: Build Plan & Work Division

**Repo:** `Vouch`  
**Branches:** `main`, `dev`, `pranav`, `nivish`, `ujwal`, `pruthvik`  
**Coding agent:** Antigravity (used by each person on their own branch)  
**Team:**

| Person | Role | Why |
|---|---|---|
| **Pranav** | Smart Contract Lead + Project Integration | You own the domain logic end-to-end from our design sessions — you should own the contract that encodes it |
| **Nivish** | AI/ML Lead (RTX 4050) | Only GPU in the team — owns the risk-scoring/advisory model |
| **Ujwal** | Frontend + Wallet Integration Lead | Owns everything the user/judge sees and clicks |
| **Pruthvik** | Backend + Keeper + Indexer Lead | Owns automation (autopay triggers) and the data layer feeding the frontend |

---

## 0. Git Workflow (agree on this before writing any code)

1. `main` = always demo-ready. Nobody pushes to `main` directly.
2. `dev` = integration branch. All feature branches merge here first.
3. Each person works on their **own named branch** (`pranav`, `nivish`, `ujwal`, `pruthvik`), commits early and often, and opens a PR into `dev` at the end of each phase (not at the end of the whole project).
4. **Merge into `dev` at the end of every phase, not just at the end of the hackathon.** This is the single biggest failure point in 4-person hackathon teams — integration debt compounds if you all merge on the last night.
5. Rebase your branch on `dev` at the start of each new phase (`git pull origin dev`, `git rebase dev`) so you're never resolving a huge conflict.
6. `main` only gets updated from `dev` after a full local test pass (see each phase's "Definition of Done").
7. Contract addresses, ABIs, and RPC config go in a shared `deployments/` folder in `dev` the moment they exist — Frontend and Backend are both blocked without this, so Pranav pushes it the second the contract compiles, even before it's finished.

---

## Phase 0 — Setup & Verification (Hour 0–1, all 4 together)

**Goal:** everyone has a working environment and the MST network facts are confirmed, not assumed.

| Task | Owner |
|---|---|
| Watch all 5 provided videos as a group (Wallet install, Private key option, SDK install, VibeKit install, Deployment+Frontend) | All 4 |
| Install BridgeKey Wallet, claim testnet tMSTC from faucet, confirm balance | All 4 |
| Confirm MST network facts against your own faucet/RPC connection (Chain ID `91562037`, RPC `https://testnetrpc.mstblockchain.com`, explorer `https://testnet.mstscan.com`) — do not trust third-party repos blindly | Pranav |
| Set up repo structure: `contracts/`, `frontend/`, `backend/`, `ai/`, `docs/` (drop PRD.md, ARCHITECTURE.md, PHASES.md here) | Pranav |
| Install Antigravity for all 4, confirm each can point it at the repo | All 4 |
| Agree on the stablecoin/token model for the demo (real tMSTC vs. a mock ERC-20 "mUSDC" test token you deploy yourselves for realism) | Pranav + Nivish |

**Definition of Done:** everyone has claimed testnet funds, can see the repo, has Antigravity working, and Pranav has pushed confirmed network config to `dev`.

---

## Phase 1 — Skeletons in Parallel (Hour 1–5)

Everyone can start immediately and in parallel — no one is blocked yet.

### Pranav (Smart Contract) — branch `pranav`
- Scaffold Hardhat project, configure for MST Testnet (remember: compile with `paris` EVM target, see ARCHITECTURE.md §1).
- Write `ChitFactory.sol` and the `ChitGroup.sol` skeleton: state enum (`Forming, Collect, Commit, Reveal, Settle, Closed`), `Member` struct, immutable group params including `discountCapBps` (the floor mechanism we defined — pot minus max discount = minimum winning payout).
- Stub every function signature from ARCHITECTURE.md §3.2 even before implementing logic, so Ujwal and Pruthvik can start wiring against a real ABI.

### Nivish (AI/ML) — branch `nivish`
- Build the **synthetic dataset generator**: member profiles with features (months remaining, payment streak, voucher reputation, bid timing), labeled with default outcomes based on the real-world rates we grounded this in (35% overall default rate, 24% post-win default rate).
- Set up local training environment on the RTX 4050 (CUDA, PyTorch or XGBoost-GPU).
- Define the API contract early (`{ member, suggestedCollateralMultiplier, defaultProbability }`) and share it with Ujwal so the frontend can build against a mock response immediately.

### Ujwal (Frontend) — branch `ujwal`
- Scaffold React app, wire up BridgeKey wallet connect (EIP-6963 with EIP-1193 fallback, per the Wallet Installation video).
- Build "Add/Switch to MST Testnet" one-click flow using the confirmed network config.
- Build static screens first with placeholder data: Create Group, Join Group, Member Dashboard, Bid screen, Ledger/History — no real contract calls yet.

### Pruthvik (Backend/Keeper) — branch `pruthvik`
- Scaffold Node.js keeper project + a simple indexer DB schema (SQLite is fine) for events: `Collected`, `BidCommitted`, `BidRevealed`, `AuctionSettled`, `DefaultAbsorbed`, `DividendRolled`.
- Write the event-listener skeleton pointed at MST Testnet RPC (won't receive real events yet, but connection + parsing logic can be tested against a locally deployed dummy contract).
- Draft the REST API endpoints the frontend ledger view will need.

**End of Phase 1 — merge to `dev`:** each branch PRs into `dev`. Resolve any naming/schema mismatches (e.g., event names, ABI field names) as a group before Phase 2 starts.

**Definition of Done:** contract skeleton compiles and deploys locally (even if functions revert), frontend renders all screens with dummy data, keeper connects to a local chain, AI dataset generator produces a CSV.

---

## Phase 2 — Core Logic (Hour 5–10)

### Pranav — branch `pranav`
- Implement `collect()` (pull-payment autopay), `commitBid()`/`revealBid()` (commit-reveal auction), and the solvency check from PRD §6:
  `collateral × 10000 ≥ remainingInstallments × safetyFactorBps`
- Implement the discount-floor mechanic: `require(bidAmount >= pot - (pot * discountCapBps / 10000))`.
- Write unit tests for every function above (Hardhat test suite).

### Nivish — branch `nivish`
- Train baseline XGBoost model on the synthetic dataset, validate it produces sane outputs.
- Wrap the model in a small local FastAPI service matching the API contract from Phase 1.
- **Hard rule:** this service must never call a contract function. It only returns advisory numbers.

### Ujwal — branch `ujwal`
- Wire Create Group and Join Group screens to real contract calls against Pranav's latest `dev` branch deployment.
- Build the buffer-deposit and voucher-stake UI flows.
- Start the Member Dashboard: buffer balance, locked dividends, current phase countdown, solvency status.

### Pruthvik — branch `pruthvik`
- Get the event listener receiving real events from Pranav's locally deployed contract.
- Build the REST API fully against real event data.
- Start the keeper automation: a script that calls `collect()` when the Collect phase begins.

---

## Phase 3 — Waterfall, Vouching, Yield, Automation (Hour 10–15)

### Pranav — branch `pranav`
- Implement `VouchRegistry.sol`: stake locking, max-vouchee cap, `slashVoucher()` callable only by `ChitGroup`.
- Implement the 5-step default waterfall from PRD §7 (buffer → locked dividends → voucher stake → reserve fund → pro-rata haircut), fully event-logged.
- Wire the discount-floor split into the waterfall's reserve fund (protocol fee / reserve / dividend split).
- Implement `IYieldStrategy.sol` interface and `MockYieldVault.sol` with clearly labeled simulated APR.

### Nivish — branch `nivish`
- Add default-probability output alongside the collateral multiplier.
- Build a simulation script showing suggested collateral dynamics over time.

### Ujwal — branch `ujwal`
- Build the Bid screen (commit then reveal).
- Build the Ledger/History view pulling from Pruthvik's REST API, with `testnet.mstscan.com` links.
- Integrate Nivish's AI service advisory widget.

### Pruthvik — branch `pruthvik`
- Finish keeper automation: fully autonomous cycle triggering on compressed timer for demo.
- Add admin fast-forward cycle control for demo.
- Index `DefaultAbsorbed` events to show exact waterfall resolution in UI.

---

## Phase 4 — Deploy to MST Testnet & Integrate for Real (Hour 15–19)

| Task | Owner |
|---|---|
| Deploy `ChitFactory`, `ChitGroup`, `VouchRegistry`, `MockYieldVault` to MST Testnet, verify on `testnet.mstscan.com`, push addresses+ABIs to `dev` | Pranav |
| Run Slither / static analyzers on final contracts | Pranav |
| Point frontend at the live testnet deployment, test every screen against real transactions | Ujwal |
| Point keeper/indexer at the live testnet deployment | Pruthvik |
| Confirm AI service integration still works end-to-end | Nivish |
| **All 4:** run one full group cycle together, live, on testnet, with a real default triggered | All 4 |

---

## Phase 5 — Polish, Rehearsal, Backup Plan (Hour 19–23)

- UI polish, responsive check, error states
- Record full backup demo video
- Submission README and documentation
- Full team dry-run of demo script
