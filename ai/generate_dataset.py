"""
Synthetic ROSCA / Chit Fund Member Dataset Generator
Simulates realistic member profiles with behavioral features and real-world empirical groundings:
- Global ROSCA default rate baseline: ~35%
- Post-win default surge: ~24% (moral hazard post payout)
- Protective factors: Payment streak, voucher reputation, voucher stake backing, prior ROSCA experience
- Risk factors: Months remaining, early bid aggression, high discount bidding
"""

import numpy as np
import pandas as pd
import os
import argparse

np.random.seed(42)

def generate_rosca_dataset(num_samples: int = 10000, output_path: str = "rosca_dataset.csv") -> pd.DataFrame:
    """
    Generates a synthetic dataset of ROSCA participants with behavioral and risk features.
    """
    data = []
    
    for _ in range(num_samples):
        # 1. Total months / term of chit fund (e.g. 5, 10, 12, 15, 20 members)
        term_length = int(np.random.choice([5, 10, 12, 15, 20], p=[0.2, 0.35, 0.25, 0.1, 0.1]))
        
        # 2. Months remaining in the group (1 to term_length)
        months_remaining = int(np.random.randint(1, term_length + 1))
        current_round = term_length - months_remaining + 1
        
        # 3. Winning status: has the member already won a pot in previous or current round?
        # Early rounds have fewer winners; probability increases as rounds progress
        win_prob = min(0.9, (current_round - 1) / max(1, term_length))
        has_won = 1 if np.random.rand() < win_prob else 0
        
        # Win round: which round did they take the pot
        win_round = int(np.random.randint(1, current_round + 1)) if has_won else 0
        
        # 4. Payment streak: consecutive timely payments without delay
        max_possible_streak = current_round - 1
        payment_streak = int(np.random.randint(0, max_possible_streak + 1)) if max_possible_streak > 0 else 0
        
        # 5. Voucher reputation score (0 to 10,000; standard trusted voucher ~5,000 - 8,000)
        voucher_reputation = int(np.random.beta(a=3, b=2) * 10000)
        
        # 6. Voucher stake ratio (ratio of collateral backed by external voucher, 0.0 to 1.5)
        voucher_stake_ratio = float(np.round(np.random.exponential(scale=0.4), 3))
        voucher_stake_ratio = min(voucher_stake_ratio, 1.5)
        
        # 7. Member historical completed ROSCA cycles in past groups
        historical_cycles = int(np.random.poisson(lam=1.8))
        
        # 8. Bid aggression (0.0 to 1.0; 1.0 = bidded maximum allowable discount)
        if has_won:
            # Early winners typically had higher bid aggression (willing to discount more)
            bid_aggression = float(np.round(np.clip(np.random.normal(loc=0.65, scale=0.2), 0.1, 1.0), 3))
        else:
            bid_aggression = float(np.round(np.clip(np.random.normal(loc=0.30, scale=0.15), 0.0, 0.8), 3))

        # --- Empirical Risk Model Formulation ---
        # Base baseline default risk: ~32%
        risk_score = 0.32
        
        # Post-win moral hazard: if won early with many remaining installments (+24% surge)
        if has_won:
            risk_score += 0.24 * (months_remaining / float(term_length))
            # Winning very early in round 1 or 2 with high discount adds extra moral hazard
            if win_round <= 2:
                risk_score += 0.08
        
        # Remaining exposure duration: more remaining months = greater cumulative hazard
        risk_score += 0.14 * (months_remaining / float(term_length))
        
        # Behavioral payment discipline: strong streak significantly drops risk
        if payment_streak >= 4:
            risk_score -= 0.12
        elif payment_streak >= 2:
            risk_score -= 0.05
        else:
            risk_score += 0.08  # 0 or 1 payment streak is risky
            
        # Social Staked Vouching mitigation
        risk_score -= 0.12 * (voucher_reputation / 10000.0)
        risk_score -= 0.10 * min(voucher_stake_ratio, 1.0)
        
        # Proven track record / web3 history
        risk_score -= 0.08 * min(historical_cycles / 3.0, 1.0)
        
        # Discount bid aggression indicates liquidity desperation
        risk_score += 0.10 * bid_aggression
        
        # Random noise to account for unobserved real-world variance
        noise = np.random.normal(loc=0.0, scale=0.03)
        risk_score += noise

        # Clip probability to realistic bounds [0.03, 0.95]
        prob_default = float(np.clip(risk_score, 0.03, 0.95))
        default_label = 1 if np.random.rand() < prob_default else 0

        # Suggested collateral multiplier (1.0x baseline up to 2.0x high risk)
        suggested_multiplier = float(np.round(1.0 + (prob_default * 1.0), 2))

        data.append({
            "term_length": term_length,
            "months_remaining": months_remaining,
            "current_round": current_round,
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
    
    # Ensure directory exists
    dir_name = os.path.dirname(output_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
        
    df.to_csv(output_path, index=False)
    
    overall_default_rate = df['default_label'].mean() * 100
    post_win_default_rate = df[df['has_won'] == 1]['default_label'].mean() * 100
    pre_win_default_rate = df[df['has_won'] == 0]['default_label'].mean() * 100
    
    print(f"[OK] Generated {len(df)} synthetic ROSCA records saved to {output_path}")
    print(f"[Stats] Overall Default Rate: {overall_default_rate:.2f}% (Target: ~35%)")
    print(f"[Stats] Post-Win Default Rate: {post_win_default_rate:.2f}% (Target: ~40-45% due to moral hazard)")
    print(f"[Stats] Pre-Win Default Rate: {pre_win_default_rate:.2f}%")
    print(f"[Stats] Suggested Multiplier Range: {df['suggested_multiplier'].min():.2f}x - {df['suggested_multiplier'].max():.2f}x (Mean: {df['suggested_multiplier'].mean():.2f}x)")
    
    return df

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic ROSCA dataset")
    parser.add_argument("--samples", type=int, default=10000, help="Number of samples to generate")
    parser.add_argument("--output", type=str, default="rosca_dataset.csv", help="Output CSV path")
    args = parser.parse_args()
    
    generate_rosca_dataset(num_samples=args.samples, output_path=args.output)
