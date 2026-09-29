# Vouch AI Risk Scoring Engine
**Lead:** Nivish (AI/ML Lead — RTX 4050)  
**Target:** Off-chain Advisory Machine Learning Engine for Decentralized ROSCAs (Chit Funds)

---

## 1. Overview & Problem Formulation

Rotating Savings and Credit Associations (ROSCAs / Chit Funds) serve >1 billion participants globally. However, traditional chit funds face a severe **moral hazard**:
- Participants who win the reverse auction pot early in the cycle receive lump-sum liquidity upfront but carry the highest post-payout default rate (~24% default surge).
- DeFi protocols traditionally counter this with **150%+ hard overcollateralization**, which defeats the financial inclusion purpose of a savings circle.

**Vouch AI solves this by introducing dynamic, risk-adjusted advisory scoring**:
1. It analyzes member payment discipline, social vouching stake, cycle stage, and bid aggression.
2. It outputs a recommended **collateral multiplier** ($1.0\times$ to $2.0\times$) and **default probability**.
3. **Hard Architectural Invariant**: The AI engine is strictly **ADVISORY ONLY**. The on-chain solvency invariant in `ChitGroup.sol` ($\text{Collateral} \times 10000 \ge \text{RemainingInstallments} \times \text{SafetyFactorBps}$) deterministically enforces solvency. The AI provides intelligence and transparency without creating a smart-contract oracle vulnerability.

---

## 2. Architecture & Tech Stack

```
   +--------------------------------------------------------+
   |                  Frontend Dashboard                    |
   +---------------------------+----------------------------+
                               | (HTTP POST /predict-risk)
                               v
   +--------------------------------------------------------+
   |                FastAPI Advisory Service                |
   |  - Uvicorn Asynchronous Server (Port 8000)             |
   |  - Pydantic v2 Schema Validation                       |
   |  - Model Hot-Reloading & In-Memory Cache               |
   +---------------------------+----------------------------+
                               |
                               v
   +--------------------------------------------------------+
   |             XGBoost Risk Inference Pipeline            |
   |  - Extreme Gradient Boosting (XGBClassifier)           |
   |  - Calibrated Probability Output                       |
   |  - Explainable Factor Breakdown (Streaks, Vouching)    |
   +--------------------------------------------------------+
```

- **Framework**: Python 3.12, FastAPI, Uvicorn, Pydantic v2
- **ML / Data**: XGBoost, Scikit-Learn, Pandas, NumPy, Joblib
- **Visualization**: Matplotlib (High-DPI pitch charts)
- **Testing**: Pytest, FastAPI TestClient

---

## 3. Feature Schema & Importance Rankings

| Feature | Type | Range | Impact on Default Risk | Top Feature Importance |
|---|---|---|---|---|
| `payment_streak` | Integer | $0 \to N$ | Consecutive timely payments **decrease** default probability | **25.8%** |
| `has_won` | Binary | $0 / 1$ | Winning early increases moral hazard exposure | **18.9%** |
| `win_round` | Integer | $0 \to N$ | Early winning rounds (R1-R2) carry highest risk | **8.7%** |
| `current_round` | Integer | $1 \to N$ | Progression through chit cycle | **8.3%** |
| `months_remaining` | Integer | $0 \to N$ | Long repayment horizons increase cumulative exposure | **7.6%** |
| `bid_aggression` | Float | $0.0 \to 1.0$ | Desperate discount bidding signals liquidity stress | **7.1%** |
| `voucher_stake_ratio` | Float | $0.0 \to 1.5$ | External staked capital in `VouchRegistry` reduces risk | **6.5%** |
| `historical_cycles` | Integer | $0 \to N$ | Proven Web3 ROSCA track record reduces risk | **6.4%** |
| `voucher_reputation` | Integer | $0 \to 10000$ | Vouching network trust score reduces risk | **5.9%** |
| `term_length` | Integer | $5 \to 20$ | Total circle size / duration | **4.8%** |

---

## 4. API Endpoints Reference

### Base URL: `http://localhost:8000`

### 1. Health Check — `GET /health`
```json
{
  "status": "healthy",
  "service": "Vouch AI Risk Scoring Engine",
  "model_loaded": true,
  "model_name": "XGBoost (Extreme Gradient Boosting)",
  "trained_at": "2026-09-28T22:10:13.193855+00:00",
  "uptime_seconds": 124.5,
  "advisory_rule": "Strictly advisory. Zero contract write authority."
}
```

### 2. Single Member Risk Prediction — `POST /predict-risk`
**Request Body**:
```json
{
  "member": "0x71C2a8D87B45eD49842F54B1A45a8F231495A2B3",
  "term_length": 10,
  "months_remaining": 9,
  "current_round": 2,
  "has_won": true,
  "win_round": 1,
  "payment_streak": 0,
  "voucher_reputation": 2000,
  "voucher_stake_ratio": 0.2,
  "historical_cycles": 1,
  "bid_aggression": 0.85
}
```

**Response**:
```json
{
  "member": "0x71C2a8D87B45eD49842F54B1A45a8F231495A2B3",
  "suggestedCollateralMultiplier": 1.66,
  "defaultProbability": 0.6601,
  "riskTier": "High Risk (Tier 3)",
  "advisoryNote": "High default exposure post-win. Advisory recommends 1.66x collateral multiplier or additional voucher stake.",
  "factorBreakdown": {
    "paymentStreakImpact": "Neutral/Negative (+)",
    "postWinExposure": "High Exposure (9 rounds left)",
    "voucherMitigation": "Low Staking Backing",
    "cycleHistoryScore": "New Participant"
  },
  "modelVersion": "XGBoost (Extreme Gradient Boosting)",
  "evaluationTimestamp": "2026-09-28T22:12:00.000Z"
}
```

### 3. Batch Group Prediction — `POST /batch-predict`
Evaluates all participants in a ROSCA circle in a single call, returning group averages and identifying outlier risk profiles.

### 4. Full Cycle Simulation — `POST /simulate-cycle`
Simulates a member's risk progression across every single round of a ROSCA to illustrate how risk surges post-win and decays as installments are fulfilled.

### 5. Model Metrics — `GET /model-metrics`
Returns test ROC-AUC, 5-fold cross validation scores, confusion matrix, and ranked feature importances.

### 6. On-Demand Retrain — `POST /retrain`
Asynchronously triggers real-time model retraining in a background thread with zero API downtime.

---

## 5. Running & Pitch Scripts

### 1. Start the API Service
```powershell
uvicorn ai.api:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Generate Pitch Visuals & Stress Test Charts
```powershell
python ai/simulate_stress_test.py
```
Output charts generated in `ai/assets/`:
- `ai/assets/early_vs_late_bidder.png`: Collateral requirements across rounds.
- `ai/assets/voucher_collateral_reduction.png`: Collateral discounts unlocked by staked vouchers.

### 3. "Live Retrain on Stage" Demo Script
Run this live during the hackathon pitch to show the judges continuous on-chain event ingestion and real-time model updating in $<3$ seconds:
```powershell
python ai/live_retrain.py 500
```

### 4. Run the Full Test Suite
```powershell
pytest ai/test_ai_engine.py -v
```

---

## 6. RTX 4050 GPU Acceleration Note
The XGBoost pipeline supports GPU acceleration (`tree_method="hist"`, `device="cuda"`). On the RTX 4050 GPU, 100,000+ member simulations train in $<0.8$ seconds.
