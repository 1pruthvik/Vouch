"""
Model Training Pipeline for Vouch AI Risk Engine
Trains an XGBoost / GradientBoosting classifier for default risk & collateral multiplier advisory.
"""

import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report, roc_auc_score
from generate_dataset import generate_rosca_dataset

def train():
    dataset_path = os.path.join(os.path.dirname(__file__), "rosca_dataset.csv")
    if not os.path.exists(dataset_path):
        df = generate_rosca_dataset(output_path=dataset_path)
    else:
        df = pd.read_csv(dataset_path)

    features = [
        "term_length",
        "months_remaining",
        "has_won",
        "win_round",
        "payment_streak",
        "voucher_reputation",
        "voucher_stake_ratio",
        "historical_cycles",
        "bid_aggression"
    ]

    X = df[features]
    y = df["default_label"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    try:
        from xgboost import XGBClassifier
        model = XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            random_state=42
        )
        model_name = "XGBoost"
    except ImportError:
        model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            random_state=42
        )
        model_name = "GradientBoosting"

    model.fit(X_train, y_train)

    y_pred_proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_pred_proba)
    print(f"[OK] {model_name} Model Trained Successfully! Test AUC: {auc:.4f}")

    model_file = os.path.join(os.path.dirname(__file__), "risk_model.joblib")
    joblib.dump({"model": model, "features": features}, model_file)
    print(f"[Saved] Model saved to {model_file}")

if __name__ == "__main__":
    train()
