# 🛡️ Vouch

> **Decentralized, Autonomous ROSCA & Chit Fund Protocol on MST Blockchain**  
> Backed by Multi-Tier Solvency Safeguards, Social Staked Vouching, Dual-Stream Yield, and AI-Powered Risk Advisory.

---

## 👥 Team & Responsibilities

| Person | Role | Scope | Branch |
|---|---|---|---|
| **Pranav** | Smart Contract Lead + Integration | Core Solvency Engine, Factory, ChitGroup, VouchRegistry, Waterfall, Yield Vault | `pranav` |
| **Nivish** | AI/ML Lead (RTX 4050) | Synthetic ROSCA Dataset, XGBoost Risk Engine, Advisory Collateral API | `nivish` |
| **Ujwal** | Frontend + Wallet Lead | React UI, BridgeKey Wallet Connect (EIP-6963), Auction Bidding, Dashboard, Audit Ledger | `ujwal` |
| **Pruthvik** | Backend + Keeper + Indexer Lead | SQLite Indexer, MST RPC Event Listener, Autonomous Keeper Bot, REST API | `pruthvik` |

---

## 🏗️ Repository Structure

```
Vouch/
├── contracts/          # Hardhat + Solidity Smart Contracts (MST Testnet)
│   ├── contracts/      # ChitFactory, ChitGroup, VouchRegistry, MockYieldVault, interfaces
│   ├── scripts/        # Deployment & verification scripts
│   ├── test/           # Unit & integration tests
│   └── hardhat.config.ts
├── frontend/           # React + Vite + TypeScript Web Application
│   ├── src/
│   │   ├── components/ # UI components (BridgeKey Connect, Bidding, Dashboard, Ledger)
│   │   ├── config/     # MST Testnet network parameters & contract ABIs
│   │   └── hooks/      # Contract and wallet hooks
├── backend/            # Node.js + TypeScript Keeper & SQLite Indexer
│   ├── src/
│   │   ├── indexer/    # MST RPC event poller / listener
│   │   ├── keeper/     # Autonomous cycle automation bot
│   │   └── api/        # REST endpoints feeding the frontend
├── ai/                 # Python XGBoost & FastAPI Risk Advisory Engine
│   ├── generate_dataset.py # Synthetic ROSCA profile & default generator
│   ├── train_model.py      # Training pipeline
│   └── api.py              # FastAPI advisory service (/predict-risk)
├── docs/               # Architecture, PRD, Network specs, and Phase roadmap
│   ├── PHASES.md
│   ├── ARCHITECTURE.md
│   ├── PRD.md
│   └── NETWORK.md
└── deployments/        # Deployed contract addresses & ABIs (shared across dev)
```

---

## 🌐 MST Testnet Configuration

- **Network Name:** MST Testnet
- **Chain ID:** `91562037`
- **RPC URL:** `https://testnetrpc.mstblockchain.com`
- **Currency Symbol:** `tMSTC`
- **Block Explorer:** [https://testnet.mstscan.com](https://testnet.mstscan.com)
- **Solidity Target:** EVM `paris`

---

## 🚀 Getting Started

### 1. Smart Contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend Keeper & Indexer
```bash
cd backend
npm install
npm run dev
```

### 4. AI Advisory Service
```bash
cd ai
pip install -r requirements.txt
python train_model.py
python api.py
```

---

## 📜 Documentation
See the [`docs/`](./docs) folder for in-depth specifications:
- [PHASES.md](./docs/PHASES.md) — 24-hour build timeline and team handoffs
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Solvency formulas, 5-step waterfall, state machine
- [PRD.md](./docs/PRD.md) — Product requirements and chit-fund economics
- [NETWORK.md](./docs/NETWORK.md) — MST network facts and BridgeKey wallet integration
