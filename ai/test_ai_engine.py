"""
Comprehensive Test Suite for Vouch AI Risk Scoring Engine
Tests:
1. Synthetic dataset generator schema, bounds, and empirical default rate grounding.
2. XGBoost / GradientBoosting model training and domain sanity invariants.
3. FastAPI endpoint status, request validation, batch prediction, and cycle simulation.
4. Pitch simulation scripts and live retraining tool.
"""

import os
import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient

from generate_dataset import generate_rosca_dataset
from train_model import train, run_sanity_checks, DEFAULT_FEATURES
from api import app, RiskRequest, compute_risk

client = TestClient(app)

class TestDatasetGenerator:
    def test_dataset_generation_and_schema(self, tmp_path):
        temp_csv = str(tmp_path / "test_rosca.csv")
        df = generate_rosca_dataset(num_samples=500, output_path=temp_csv)
        
        assert os.path.exists(temp_csv)
        assert len(df) == 500
        
        # Verify required columns exist
        for col in DEFAULT_FEATURES + ["default_label", "suggested_multiplier"]:
            assert col in df.columns, f"Missing expected column: {col}"
            
        # Verify bounds
        assert (df["suggested_multiplier"] >= 1.0).all()
        assert (df["suggested_multiplier"] <= 2.0).all()
        assert (df["payment_streak"] >= 0).all()
        assert (df["voucher_reputation"] >= 0).all()
        assert (df["voucher_reputation"] <= 10000).all()

    def test_default_rate_empirical_grounding(self):
        df = generate_rosca_dataset(num_samples=1000, output_path="temp_test_grounding.csv")
        default_rate = df["default_label"].mean()
        
        if os.path.exists("temp_test_grounding.csv"):
            os.remove("temp_test_grounding.csv")
            
        # Should be grounded around ~30-40%
        assert 0.25 <= default_rate <= 0.45, f"Default rate {default_rate} is out of expected empirical bounds"

class TestModelTraining:
    def test_training_pipeline_and_sanity_invariants(self, tmp_path):
        temp_model = str(tmp_path / "test_model.joblib")
        temp_csv = str(tmp_path / "temp_train_data.csv")
        
        # Train model
        bundle = train(output_model_path=temp_model, dataset_path=temp_csv)
        
        assert os.path.exists(temp_model)
        assert "model" in bundle
        assert "metrics" in bundle
        assert bundle["metrics"]["roc_auc"] > 0.55
        assert bundle["metrics"]["accuracy"] > 0.55
        assert len(bundle["feature_importances"]) == len(DEFAULT_FEATURES)
        
        # Domain sanity checks
        assert run_sanity_checks(bundle["model"], bundle["features"]) is True

class TestFastAPIService:
    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        assert "uptime_seconds" in data

    def test_predict_risk_low_risk_member(self):
        payload = {
            "member": "0xLowRiskMember",
            "term_length": 10,
            "months_remaining": 1,
            "current_round": 10,
            "has_won": False,
            "win_round": 0,
            "payment_streak": 9,
            "voucher_reputation": 8500,
            "voucher_stake_ratio": 1.0,
            "historical_cycles": 3,
            "bid_aggression": 0.1
        }
        response = client.post("/predict-risk", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["member"] == "0xLowRiskMember"
        assert data["defaultProbability"] < 0.30
        assert data["suggestedCollateralMultiplier"] <= 1.30
        assert "factorBreakdown" in data

    def test_predict_risk_high_risk_early_winner(self):
        payload = {
            "member": "0xHighRiskWinner",
            "term_length": 10,
            "months_remaining": 9,
            "current_round": 2,
            "has_won": True,
            "win_round": 1,
            "payment_streak": 0,
            "voucher_reputation": 1000,
            "voucher_stake_ratio": 0.0,
            "historical_cycles": 0,
            "bid_aggression": 0.85
        }
        response = client.post("/predict-risk", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["member"] == "0xHighRiskWinner"
        assert data["defaultProbability"] > 0.40
        assert data["suggestedCollateralMultiplier"] >= 1.40
        assert "Tier 3" in data["riskTier"] or "Tier 2" in data["riskTier"]

    def test_batch_predict_endpoint(self):
        batch_payload = {
            "members": [
                {
                    "member": "0xMemberA",
                    "term_length": 10,
                    "months_remaining": 8,
                    "payment_streak": 1,
                    "voucher_reputation": 3000,
                    "voucher_stake_ratio": 0.2
                },
                {
                    "member": "0xMemberB",
                    "term_length": 10,
                    "months_remaining": 2,
                    "payment_streak": 7,
                    "voucher_reputation": 9000,
                    "voucher_stake_ratio": 1.2
                }
            ]
        }
        response = client.post("/batch-predict", json=batch_payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data["predictions"]) == 2
        assert "groupAverageMultiplier" in data
        assert data["highestRiskMember"] == "0xMemberA"
        assert data["lowestRiskMember"] == "0xMemberB"

    def test_simulate_cycle_endpoint(self):
        sim_payload = {
            "member": "0xSimulatedMember",
            "term_length": 6,
            "simulated_win_round": 2,
            "initial_voucher_reputation": 5000,
            "voucher_stake_ratio": 0.5,
            "historical_cycles": 1
        }
        response = client.post("/simulate-cycle", json=sim_payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data["round_trajectory"]) == 6
        assert "key_takeaway" in data
        assert data["round_trajectory"][1]["has_won"] is True

    def test_model_metrics_endpoint(self):
        response = client.get("/model-metrics")
        assert response.status_code == 200
        data = response.json()
        assert "metrics" in data
        assert "feature_importances" in data
