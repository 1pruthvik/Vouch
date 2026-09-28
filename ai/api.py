"""
FastAPI Service for Vouch AI Risk Advisory
Exposes endpoints:
- GET /health
- POST /predict-risk (Single member risk prediction)
- POST /batch-predict (Batch prediction for entire chit group)
- POST /simulate-cycle (Simulate risk across full ROSCA lifecycle)
- GET /model-metrics (Model performance & feature importances)
- POST /retrain (Trigger on-demand live retraining)

Hard Rule: This service is strictly ADVISORY ONLY. It returns risk guidance and suggested multipliers.
It never executes blockchain transactions or gates contract invariants.
"""

import os
import time
import pandas as pd
import numpy as np
import joblib
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from train_model import train, DEFAULT_FEATURES

START_TIME = time.time()
MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.joblib")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "rosca_dataset.csv")

# Global in-memory model cache
model_bundle: Optional[Dict[str, Any]] = None

def get_model_bundle():
    global model_bundle
    if model_bundle is None:
        load_model_safely()
    return model_bundle

def load_model_safely():
    global model_bundle
    if os.path.exists(MODEL_PATH):
        try:
            model_bundle = joblib.load(MODEL_PATH)
            print(f"[API] Loaded model bundle: {model_bundle.get('model_name', 'Unknown')}")
        except Exception as e:
            print(f"[API Warning] Failed loading model file: {e}")
            model_bundle = None
    else:
        print("[API] Model file not found. Auto-training baseline model...")
        try:
            model_bundle = train(output_model_path=MODEL_PATH, dataset_path=DATASET_PATH)
        except Exception as e:
            print(f"[API Warning] Auto-train failed: {e}. Running in heuristic fallback mode.")
            model_bundle = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model_safely()
    yield

app = FastAPI(
    title="Vouch AI Risk Scoring Engine",
    description="Machine Learning Risk Advisory & Collateral Tier Recommendation for Decentralized ROSCAs",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration for Frontend & Indexer integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request / Response Schemas ---

class RiskRequest(BaseModel):
    member: str = Field(..., json_schema_extra={"example": "0x71C...498"}, description="Member wallet address or identifier")
    term_length: int = Field(10, ge=2, le=50, description="Total members / duration in cycles")
    months_remaining: int = Field(8, ge=0, le=50, description="Installments remaining in the group")
    current_round: Optional[int] = Field(None, ge=1, le=50, description="Current active round")
    has_won: bool = Field(False, description="Whether member has already won a pot")
    win_round: int = Field(0, ge=0, le=50, description="Round index when pot was won (0 if not won)")
    payment_streak: int = Field(2, ge=0, le=50, description="Consecutive timely installment payments")
    voucher_reputation: int = Field(5000, ge=0, le=10000, description="Voucher trust reputation score (0-10,000)")
    voucher_stake_ratio: float = Field(0.5, ge=0.0, le=3.0, description="Staked voucher backing as ratio of pot")
    historical_cycles: int = Field(1, ge=0, le=50, description="Number of past ROSCAs successfully completed")
    bid_aggression: float = Field(0.2, ge=0.0, le=1.0, description="Normalized discount bid aggression (0.0 to 1.0)")

class FactorBreakdown(BaseModel):
    paymentStreakImpact: str
    postWinExposure: str
    voucherMitigation: str
    cycleHistoryScore: str

class RiskResponse(BaseModel):
    member: str
    suggestedCollateralMultiplier: float
    defaultProbability: float
    riskTier: str
    advisoryNote: str
    factorBreakdown: FactorBreakdown
    modelVersion: str
    evaluationTimestamp: str

class BatchRiskRequest(BaseModel):
    members: List[RiskRequest]

class BatchRiskResponse(BaseModel):
    predictions: List[RiskResponse]
    groupAverageMultiplier: float
    highestRiskMember: Optional[str]
    lowestRiskMember: Optional[str]

class CycleSimulationRequest(BaseModel):
    member: str = "0xDemoMember"
    term_length: int = 10
    simulated_win_round: int = 3
    initial_voucher_reputation: int = 6000
    voucher_stake_ratio: float = 0.5
    historical_cycles: int = 2

class RoundPrediction(BaseModel):
    round_number: int
    months_remaining: int
    has_won: bool
    payment_streak: int
    defaultProbability: float
    suggestedCollateralMultiplier: float
    riskTier: str

class CycleSimulationResponse(BaseModel):
    member: str
    term_length: int
    simulated_win_round: int
    round_trajectory: List[RoundPrediction]
    key_takeaway: str

# --- Core Inference Logic ---

def compute_risk(req: RiskRequest) -> RiskResponse:
    bundle = get_model_bundle()
    
    # Infer current_round if missing
    current_round = req.current_round if req.current_round is not None else max(1, req.term_length - req.months_remaining + 1)
    
    if bundle is not None and "model" in bundle:
        features = bundle.get("features", DEFAULT_FEATURES)
        input_data = {
            "term_length": req.term_length,
            "months_remaining": req.months_remaining,
            "current_round": current_round,
            "has_won": 1 if req.has_won else 0,
            "win_round": req.win_round,
            "payment_streak": req.payment_streak,
            "voucher_reputation": req.voucher_reputation,
            "voucher_stake_ratio": req.voucher_stake_ratio,
            "historical_cycles": req.historical_cycles,
            "bid_aggression": req.bid_aggression,
        }
        df_input = pd.DataFrame([input_data])[features]
        prob = float(bundle["model"].predict_proba(df_input)[0, 1])
        model_ver = bundle.get("model_name", "XGBoost v2.0")
    else:
        # Heuristic fallback if model not loaded
        base_risk = 0.30
        if req.has_won:
            base_risk += 0.22 * (req.months_remaining / max(1, req.term_length))
        base_risk -= 0.10 * (req.payment_streak / max(1, req.term_length))
        base_risk -= 0.12 * (req.voucher_reputation / 10000.0)
        base_risk -= 0.08 * min(req.voucher_stake_ratio, 1.0)
        base_risk -= 0.06 * min(req.historical_cycles / 3.0, 1.0)
        base_risk += 0.08 * req.bid_aggression
        prob = float(np.clip(base_risk, 0.03, 0.95))
        model_ver = "Heuristic Baseline Fallback"

    prob = round(prob, 4)
    # Multiplier: 1.0x baseline up to 2.0x for high default probability
    multiplier = round(1.0 + (prob * 1.0), 2)
    multiplier = max(1.0, min(multiplier, 2.0))

    # Tiers and notes
    if prob < 0.20:
        tier = "Low Risk (Tier 1)"
        note = "Excellent standing. High payment consistency and strong voucher backing. Standard buffer is adequate."
    elif prob < 0.45:
        tier = "Moderate Risk (Tier 2)"
        note = "Moderate exposure. Maintain on-time installments or secure active voucher staking to optimize collateral."
    else:
        tier = "High Risk (Tier 3)"
        note = f"High default exposure post-win. Advisory recommends {multiplier}x collateral multiplier or additional voucher stake."

    # Explainability / Factor Breakdown
    streak_impact = "Positive (-)" if req.payment_streak >= 3 else "Neutral/Negative (+)"
    post_win_impact = f"High Exposure ({req.months_remaining} rounds left)" if (req.has_won and req.months_remaining > 3) else "Controlled"
    voucher_impact = f"Strong (-{int(req.voucher_reputation/100)} pts)" if req.voucher_reputation > 5000 else "Low Staking Backing"
    cycle_history = f"Veteran ({req.historical_cycles} ROSCAs completed)" if req.historical_cycles >= 2 else "New Participant"

    return RiskResponse(
        member=req.member,
        suggestedCollateralMultiplier=multiplier,
        defaultProbability=prob,
        riskTier=tier,
        advisoryNote=note,
        factorBreakdown=FactorBreakdown(
            paymentStreakImpact=streak_impact,
            postWinExposure=post_win_impact,
            voucherMitigation=voucher_impact,
            cycleHistoryScore=cycle_history
        ),
        modelVersion=model_ver,
        evaluationTimestamp=datetime.now(timezone.utc).isoformat()
    )

# --- Endpoints ---

@app.get("/health")
def health():
    bundle = get_model_bundle()
    return {
        "status": "healthy",
        "service": "Vouch AI Risk Scoring Engine",
        "model_loaded": bundle is not None,
        "model_name": bundle.get("model_name") if bundle else "None",
        "trained_at": bundle.get("trained_at") if bundle else None,
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "advisory_rule": "Strictly advisory. Zero contract write authority."
    }

@app.post("/predict-risk", response_model=RiskResponse)
def predict_risk(req: RiskRequest):
    return compute_risk(req)

@app.post("/batch-predict", response_model=BatchRiskResponse)
def batch_predict(batch: BatchRiskRequest):
    if not batch.members:
        raise HTTPException(status_code=400, detail="Empty members list")
        
    predictions = [compute_risk(m) for m in batch.members]
    avg_mult = float(round(np.mean([p.suggestedCollateralMultiplier for p in predictions]), 2))
    
    highest_risk = max(predictions, key=lambda p: p.defaultProbability).member
    lowest_risk = min(predictions, key=lambda p: p.defaultProbability).member
    
    return BatchRiskResponse(
        predictions=predictions,
        groupAverageMultiplier=avg_mult,
        highestRiskMember=highest_risk,
        lowestRiskMember=lowest_risk
    )

@app.post("/simulate-cycle", response_model=CycleSimulationResponse)
def simulate_cycle(sim: CycleSimulationRequest):
    """
    Simulates a member's risk and suggested collateral across every round of a ROSCA.
    Highlights the post-win risk surge when the pot is collected early.
    """
    trajectory = []
    
    for round_num in range(1, sim.term_length + 1):
        months_rem = sim.term_length - round_num
        has_won = round_num >= sim.simulated_win_round
        win_rnd = sim.simulated_win_round if has_won else 0
        payment_streak = round_num - 1
        
        req = RiskRequest(
            member=sim.member,
            term_length=sim.term_length,
            months_remaining=months_rem,
            current_round=round_num,
            has_won=has_won,
            win_round=win_rnd,
            payment_streak=payment_streak,
            voucher_reputation=sim.initial_voucher_reputation,
            voucher_stake_ratio=sim.voucher_stake_ratio,
            historical_cycles=sim.historical_cycles,
            bid_aggression=0.7 if round_num == sim.simulated_win_round else 0.2
        )
        
        resp = compute_risk(req)
        trajectory.append(RoundPrediction(
            round_number=round_num,
            months_remaining=months_rem,
            has_won=has_won,
            payment_streak=payment_streak,
            defaultProbability=resp.defaultProbability,
            suggestedCollateralMultiplier=resp.suggestedCollateralMultiplier,
            riskTier=resp.riskTier
        ))
        
    takeaway = (
        f"In Round {sim.simulated_win_round}, member took payout early: "
        f"default risk jumps to {trajectory[sim.simulated_win_round - 1].defaultProbability*100:.1f}%, "
        f"raising suggested collateral to {trajectory[sim.simulated_win_round - 1].suggestedCollateralMultiplier}x. "
        f"As installments are paid, risk gradually tapers to {trajectory[-1].defaultProbability*100:.1f}% by Round {sim.term_length}."
    )
    
    return CycleSimulationResponse(
        member=sim.member,
        term_length=sim.term_length,
        simulated_win_round=sim.simulated_win_round,
        round_trajectory=trajectory,
        key_takeaway=takeaway
    )

@app.get("/model-metrics")
def get_model_metrics():
    bundle = get_model_bundle()
    if bundle is None:
        raise HTTPException(status_code=503, detail="Model bundle not loaded")
        
    return {
        "model_name": bundle.get("model_name"),
        "trained_at": bundle.get("trained_at"),
        "features": bundle.get("features"),
        "metrics": bundle.get("metrics"),
        "feature_importances": bundle.get("feature_importances")
    }

@app.post("/retrain")
def trigger_retrain(background_tasks: BackgroundTasks):
    """
    On-demand retrain endpoint for live stage demonstrations.
    Executes training and reloads model in memory.
    """
    def do_retrain():
        global model_bundle
        print("[API] Initiating background retrain...")
        model_bundle = train(output_model_path=MODEL_PATH, dataset_path=DATASET_PATH)
        print("[API] Retrain complete. New model bundle loaded.")

    background_tasks.add_task(do_retrain)
    return {
        "status": "retraining_scheduled",
        "message": "Model retraining triggered in background. In-memory bundle will hot-reload on completion."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
