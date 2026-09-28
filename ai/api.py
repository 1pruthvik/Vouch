"""
FastAPI Service for Vouch AI Risk Advisory
Exposes endpoint: POST /predict-risk
Returns: { member, suggestedCollateralMultiplier, defaultProbability, riskTier, advisoryNote }
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os
import pandas as pd

app = FastAPI(title="Vouch AI Risk Scoring API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RiskRequest(BaseModel):
    member: str
    term_length: int = 10
    months_remaining: int = 8
    has_won: bool = False
    win_round: int = 0
    payment_streak: int = 2
    voucher_reputation: int = 1000
    voucher_stake_ratio: float = 0.5
    historical_cycles: int = 1
    bid_aggression: float = 0.2

class RiskResponse(BaseModel):
    member: str
    suggestedCollateralMultiplier: float
    defaultProbability: float
    riskTier: str
    advisoryNote: str

# Lazy load model
model_data = None

def get_model():
    global model_data
    if model_data is None:
        model_file = os.path.join(os.path.dirname(__file__), "risk_model.joblib")
        if os.path.exists(model_file):
            model_data = joblib.load(model_file)
    return model_data

@app.get("/health")
def health():
    return {"status": "ok", "service": "Vouch AI Risk Advisor"}

@app.post("/predict-risk", response_model=RiskResponse)
def predict_risk(req: RiskRequest):
    model_obj = get_model()
    
    if model_obj is not None:
        model = model_obj["model"]
        features = model_obj["features"]
        df_input = pd.DataFrame([{
            "term_length": req.term_length,
            "months_remaining": req.months_remaining,
            "has_won": 1 if req.has_won else 0,
            "win_round": req.win_round,
            "payment_streak": req.payment_streak,
            "voucher_reputation": req.voucher_reputation,
            "voucher_stake_ratio": req.voucher_stake_ratio,
            "historical_cycles": req.historical_cycles,
            "bid_aggression": req.bid_aggression,
        }])[features]
        
        prob = float(model.predict_proba(df_input)[0, 1])
    else:
        # Fallback baseline heuristic if model not trained yet
        prob = 0.25
        if req.has_won:
            prob += 0.20
        if req.months_remaining > 5:
            prob += 0.10

    prob = round(prob, 4)
    multiplier = round(1.0 + (prob * 0.8), 2)

    if prob < 0.20:
        tier = "Low Risk (Tier 1)"
        note = "Excellent standing. Standard buffer collateral is sufficient."
    elif prob < 0.45:
        tier = "Moderate Risk (Tier 2)"
        note = "Moderate exposure. Consider securing an active voucher or small additional buffer."
    else:
        tier = "High Risk (Tier 3)"
        note = "High default exposure post-win. Recommended collateral multiplier: " + str(multiplier) + "x."

    return RiskResponse(
        member=req.member,
        suggestedCollateralMultiplier=multiplier,
        defaultProbability=prob,
        riskTier=tier,
        advisoryNote=note
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
