"""
Model Training and Evaluation Pipeline for Vouch AI Risk Engine
Trains an XGBoost / GradientBoosting classifier for default risk & collateral multiplier advisory.
Includes cross-validation, feature importance attribution, sanity check suites, and model serialization.
"""

import os
import sys
import argparse
import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timezone

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, brier_score_loss, log_loss, classification_report
)
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier

# Local import
from generate_dataset import generate_rosca_dataset

DEFAULT_FEATURES = [
    "term_length",
    "months_remaining",
    "current_round",
    "has_won",
    "win_round",
    "payment_streak",
    "voucher_reputation",
    "voucher_stake_ratio",
    "historical_cycles",
    "bid_aggression"
]

def load_or_generate_data(dataset_path: str = None) -> pd.DataFrame:
    if dataset_path is None:
        dataset_path = os.path.join(os.path.dirname(__file__), "rosca_dataset.csv")
    
    if not os.path.exists(dataset_path):
        print(f"[*] Dataset not found at {dataset_path}, generating 10,000 samples...")
        df = generate_rosca_dataset(num_samples=10000, output_path=dataset_path)
    else:
        df = pd.read_csv(dataset_path)
        # Ensure current_round exists if older CSV
        if "current_round" not in df.columns:
            df["current_round"] = df["term_length"] - df["months_remaining"] + 1
            
    print(f"[*] Loaded dataset with {len(df)} samples. Default rate: {df['default_label'].mean()*100:.2f}%")
    return df

def run_sanity_checks(model, features: list) -> bool:
    """
    Validates model against fundamental domain invariants:
    1. Early Winner with 0 streak and many remaining months MUST have higher risk than Late Participant.
    2. Higher Voucher Staking MUST reduce default risk, all else equal.
    3. Higher Payment Streak MUST reduce default risk, all else equal.
    """
    print("\n--- Running AI Domain Sanity Checks ---")
    
    # Invariant 1: Early winner vs Late participant
    early_winner_df = pd.DataFrame([{
        "term_length": 10,
        "months_remaining": 9,
        "current_round": 2,
        "has_won": 1,
        "win_round": 1,
        "payment_streak": 0,
        "voucher_reputation": 2000,
        "voucher_stake_ratio": 0.1,
        "historical_cycles": 0,
        "bid_aggression": 0.8
    }])[features]
    
    late_participant_df = pd.DataFrame([{
        "term_length": 10,
        "months_remaining": 1,
        "current_round": 10,
        "has_won": 0,
        "win_round": 0,
        "payment_streak": 9,
        "voucher_reputation": 8000,
        "voucher_stake_ratio": 1.0,
        "historical_cycles": 3,
        "bid_aggression": 0.1
    }])[features]
    
    p_early = float(model.predict_proba(early_winner_df)[0, 1])
    p_late = float(model.predict_proba(late_participant_df)[0, 1])
    
    print(f"  [1] Early Winner Risk: {p_early*100:.1f}% vs Late Participant Risk: {p_late*100:.1f}%")
    assert p_early > p_late, f"Sanity Failure: Early winner risk ({p_early}) should be > late participant ({p_late})"
    print("      -> Invariant PASS: Early winners incur higher risk and collateral advice.")

    # Invariant 2: Voucher backing effect
    no_voucher_df = early_winner_df.copy()
    no_voucher_df["voucher_reputation"] = 0
    no_voucher_df["voucher_stake_ratio"] = 0.0
    
    high_voucher_df = early_winner_df.copy()
    high_voucher_df["voucher_reputation"] = 10000
    high_voucher_df["voucher_stake_ratio"] = 1.5
    
    p_no_vouch = float(model.predict_proba(no_voucher_df)[0, 1])
    p_high_vouch = float(model.predict_proba(high_voucher_df)[0, 1])
    
    print(f"  [2] Unvouched Risk: {p_no_vouch*100:.1f}% vs Staked Vouched Risk: {p_high_vouch*100:.1f}%")
    assert p_no_vouch >= p_high_vouch, f"Sanity Failure: Unvouched ({p_no_vouch}) should be >= Vouched ({p_high_vouch})"
    print("      -> Invariant PASS: Staked vouchers demonstrably reduce risk exposure.")

    # Invariant 3: Payment streak effect
    zero_streak_df = late_participant_df.copy()
    zero_streak_df["payment_streak"] = 0
    
    high_streak_df = late_participant_df.copy()
    high_streak_df["payment_streak"] = 8
    
    p_zero_streak = float(model.predict_proba(zero_streak_df)[0, 1])
    p_high_streak = float(model.predict_proba(high_streak_df)[0, 1])
    
    print(f"  [3] Broken Streak Risk: {p_zero_streak*100:.1f}% vs 8-Month Streak Risk: {p_high_streak*100:.1f}%")
    assert p_zero_streak >= p_high_streak, "Sanity Failure: Broken streak should have higher risk"
    print("      -> Invariant PASS: Payment discipline rewarded with lower risk tiers.")

    print("[OK] All domain sanity invariants passed successfully!\n")
    return True

def train(output_model_path: str = None, dataset_path: str = None) -> dict:
    if output_model_path is None:
        output_model_path = os.path.join(os.path.dirname(__file__), "risk_model.joblib")

    df = load_or_generate_data(dataset_path)
    features = DEFAULT_FEATURES
    
    X = df[features]
    y = df["default_label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Initialize model with XGBoost or GradientBoosting fallback
    try:
        from xgboost import XGBClassifier
        model = XGBClassifier(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.06,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42,
            eval_metric="logloss"
        )
        model_name = "XGBoost (Extreme Gradient Boosting)"
    except ImportError:
        model = GradientBoostingClassifier(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.06,
            subsample=0.85,
            random_state=42
        )
        model_name = "Scikit-Learn GradientBoosting"

    print(f"[*] Training {model_name} on {len(X_train)} samples...")
    model.fit(X_train, y_train)

    # Evaluation on Test Set
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]

    auc = float(roc_auc_score(y_test, y_pred_proba))
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    brier = float(brier_score_loss(y_test, y_pred_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()

    # 5-Fold Stratified Cross Validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_auc_scores = cross_val_score(model, X, y, cv=cv, scoring="roc_auc")
    mean_cv_auc = float(np.mean(cv_auc_scores))

    # Feature Importance
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        feature_importance_map = {f: float(round(imp, 4)) for f, imp in zip(features, importances)}
        sorted_importance = sorted(feature_importance_map.items(), key=lambda x: x[1], reverse=True)
    else:
        sorted_importance = []
        feature_importance_map = {}

    print(f"\n================ Model Performance ================")
    print(f" Model Type          : {model_name}")
    print(f" Test ROC-AUC        : {auc:.4f}")
    print(f" 5-Fold CV Mean AUC  : {mean_cv_auc:.4f} (+/- {np.std(cv_auc_scores):.4f})")
    print(f" Accuracy            : {acc*100:.2f}%")
    print(f" Precision           : {prec:.4f}")
    print(f" Recall              : {rec:.4f}")
    print(f" F1-Score            : {f1:.4f}")
    print(f" Brier Score Loss    : {brier:.4f}")
    print(f" Confusion Matrix    : TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")
    print(f"---------------------------------------------------")
    print(" Top Predictive Risk Features:")
    for feat, imp in sorted_importance:
        bar = "#" * int(imp * 40)
        print(f"   {feat:22s} : {imp:.4f} {bar}")
    print(f"===================================================\n")

    # Domain Sanity Validation
    run_sanity_checks(model, features)

    # Package model metadata
    model_bundle = {
        "model": model,
        "features": features,
        "model_name": model_name,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "roc_auc": auc,
            "cv_mean_auc": mean_cv_auc,
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "brier_score": brier,
            "confusion_matrix": cm
        },
        "feature_importances": feature_importance_map
    }

    joblib.dump(model_bundle, output_model_path)
    print(f"[Saved] Trained model bundle saved to {output_model_path}")
    return model_bundle

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Vouch AI Risk Scoring Model")
    parser.add_argument("--dataset", type=str, default=None, help="Path to input dataset CSV")
    parser.add_argument("--output", type=str, default=None, help="Path to save output joblib model")
    args = parser.parse_args()

    train(output_model_path=args.output, dataset_path=args.dataset)
