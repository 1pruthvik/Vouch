"""
Synthetic ROSCA / Chit Fund Member Dataset Generator
Simulates member profiles with behavioral features and real-world default groundings:
- Overall default probability: ~35%
- Post-win default surge: ~24%
- Features: months_remaining, payment_streak, voucher_reputation, bid_timing, historical_cycles_completed
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

def generate_rosca_dataset(num_samples=5000, output_path="rosca_dataset.csv"):
    data = []
    
    for _ in range(num_samples):
        # 1. Total months / term of chit fund (e.g. 5 to 20 members)
        term_length = np.random.choice([5, 10, 12, 15, 20])
        # 2. Months remaining in the group
        months_remaining = np.random.randint(1, term_length + 1)
        # 3. Winning round (1 if won early, 0 if hasn't won yet)
        has_won = np.random.choice([0, 1], p=[0.6, 0.4])
        win_round = np.random.randint(1, term_length - months_remaining + 2) if has_won else 0
        # 4. Payment streak (consecutive timely payments)
        payment_streak = np.random.randint(0, term_length - months_remaining + 1)
        # 5. Voucher reputation score (0 to 10000, e.g. 1000 = base)
        voucher_reputation = np.random.randint(0, 10001)
        # 6. Voucher stake backing (in normalized units)
        voucher_stake_ratio = np.random.uniform(0.0, 1.5)
        # 7. Member historical completed ROSCA cycles
        historical_cycles = np.random.poisson(lam=1.5)
        # 8. Bid aggression (0.0 to 1.0, where 1.0 = bidded maximum discount early)
        bid_aggression = np.random.uniform(0.1, 1.0) if has_won else np.random.uniform(0.0, 0.5)

        # Base default risk formula grounded in empirical chit-fund dynamics
        risk_score = 0.20
        # Post-win default surge (+24%)
        if has_won:
            risk_score += 0.24 * (months_remaining / term_length)
        # More remaining months = more opportunity to default
        risk_score += 0.15 * (months_remaining / term_length)
        # Low payment streak increases risk
        if payment_streak < 3:
            risk_score += 0.10
        # High voucher reputation & stake decreases risk
        risk_score -= 0.15 * (voucher_reputation / 10000.0)
        risk_score -= 0.10 * min(voucher_stake_ratio, 1.0)
        # Prior experience reduces risk
        risk_score -= 0.08 * min(historical_cycles / 3.0, 1.0)
        # High bid aggression increases risk
        risk_score += 0.08 * bid_aggression

        # Clip probability to [0.02, 0.95]
        prob_default = np.clip(risk_score, 0.02, 0.95)
        default_label = 1 if np.random.rand() < prob_default else 0

        # Suggested collateral multiplier (e.g. 1.0x baseline to 1.8x high risk)
        suggested_multiplier = round(1.0 + (prob_default * 0.8), 2)

        data.append({
            "term_length": term_length,
            "months_remaining": months_remaining,
            "has_won": has_won,
            "win_round": win_round,
            "payment_streak": payment_streak,
            "voucher_reputation": voucher_reputation,
            "voucher_stake_ratio": voucher_stake_ratio,
            "historical_cycles": historical_cycles,
            "bid_aggression": bid_aggression,
            "default_label": default_label,
            "suggested_multiplier": suggested_multiplier,
            "true_prob_default": round(prob_default, 4)
        })

    df = pd.DataFrame(data)
    df.to_csv(output_path, index=False)
    print(f"[OK] Generated synthetic ROSCA dataset with {len(df)} samples saved to {output_path}")
    print(f"[Stats] Dataset Default Rate: {df['default_label'].mean() * 100:.2f}%")
    return df

if __name__ == "__main__":
    generate_rosca_dataset()
