"""
Vouch AI Risk Engine — Live Retrain on Stage Script
Demonstrates continuous online learning for pitch presentations & live hackathon demos.
Simulates ingesting new on-chain ROSCA events and retraining the XGBoost model in real-time.
"""

import os
import sys
import time
import numpy as np
import pandas as pd
import joblib

from generate_dataset import generate_rosca_dataset
from train_model import train, DEFAULT_FEATURES

MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.joblib")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "rosca_dataset.csv")

def live_retrain_demo(num_new_events: int = 500):
    print("\n" + "=" * 60)
    print("      VOUCH AI RISK ENGINE: LIVE ON-STAGE RETRAINING")
    print("=" * 60)
    print(f"[*] Ingesting {num_new_events} simulated recent on-chain events from MST Blockchain...")
    
    # 1. Load baseline
    if not os.path.exists(DATASET_PATH):
        df_base = generate_rosca_dataset(num_samples=5000, output_path=DATASET_PATH)
    else:
        df_base = pd.read_csv(DATASET_PATH)

    # 2. Simulate new on-chain events (e.g., from Indexer SQLite DB)
    print(f"[*] Parsing DefaultAbsorbed, AuctionSettled, and Autopay events...")
    df_new = generate_rosca_dataset(num_samples=num_new_events, output_path="temp_recent_events.csv")
    
    # Combine datasets
    df_combined = pd.concat([df_base, df_new], ignore_index=True)
    df_combined.to_csv(DATASET_PATH, index=False)
    
    if os.path.exists("temp_recent_events.csv"):
        os.remove("temp_recent_events.csv")

    print(f"[+] Total training records now available: {len(df_combined):,}")
    
    # 3. Retrain model with timer
    print("[*] Initiating real-time XGBoost fine-tuning...")
    t0 = time.time()
    model_bundle = train(output_model_path=MODEL_PATH, dataset_path=DATASET_PATH)
    elapsed = time.time() - t0
    
    print("\n" + "-" * 60)
    print(f"[SUCCESS] Retraining completed in {elapsed:.3f} seconds!")
    print(f"[Stats] New Model Test ROC-AUC: {model_bundle['metrics']['roc_auc']:.4f}")
    print(f"[Stats] Cross-Validation Mean AUC: {model_bundle['metrics']['cv_mean_auc']:.4f}")
    print(f"[Live] Model bundle updated at {model_bundle['trained_at']}")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    n_events = 500
    if len(sys.argv) > 1:
        try:
            n_events = int(sys.argv[1])
        except ValueError:
            pass
    live_retrain_demo(num_new_events=n_events)
