"""
Vouch AI Risk Engine — Stress Test & Simulation Visualizer
Runs simulation scenarios across synthetic ROSCA participants to generate pitch & demo assets:
1. Early Bidder vs. Late Bidder Risk & Collateral Trajectory
2. Social Staked Voucher Impact on Collateral Requirements
3. Payment Streak vs. Default Probability Decay
4. Generates visual charts (PNG) and summary tables for the pitch deck
"""

import os
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg") # Non-interactive backend
import matplotlib.pyplot as plt

from api import compute_risk, RiskRequest

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

def simulate_early_vs_late_bidder(term_length: int = 10):
    """
    Compares two members in the same 10-month Chit Fund:
    - Member A (Early Bidder): Wins Round 1, takes payout, must repay remaining 9 months.
    - Member B (Late Bidder): Never bids until Round 10, perfect payment streak.
    """
    print(f"\n================ Scenario 1: Early vs. Late Bidder Dynamics ================")
    print(f"Chit Group: {term_length} Members | Installment: 100 tMSTC/mo | Pot: {term_length * 100} tMSTC")
    print(f"{'Round':<6} | {'Early Bidder Mult':<18} | {'Early Prob':<12} | {'Late Bidder Mult':<18} | {'Late Prob':<12}")
    print("-" * 75)

    early_data = []
    late_data = []
    rounds = list(range(1, term_length + 1))

    for r in rounds:
        months_rem = term_length - r
        # Early bidder won in round 1
        req_early = RiskRequest(
            member="0xEarlyWinner",
            term_length=term_length,
            months_remaining=months_rem,
            current_round=r,
            has_won=True,
            win_round=1,
            payment_streak=r - 1,
            voucher_reputation=4000,
            voucher_stake_ratio=0.2,
            historical_cycles=1,
            bid_aggression=0.75 if r == 1 else 0.2
        )
        resp_early = compute_risk(req_early)
        early_data.append(resp_early)

        # Late bidder has not won yet
        req_late = RiskRequest(
            member="0xLateBidder",
            term_length=term_length,
            months_remaining=months_rem,
            current_round=r,
            has_won=False,
            win_round=0,
            payment_streak=r - 1,
            voucher_reputation=6000,
            voucher_stake_ratio=0.5,
            historical_cycles=2,
            bid_aggression=0.1
        )
        resp_late = compute_risk(req_late)
        late_data.append(resp_late)

        print(f"R{r:<5} | {resp_early.suggestedCollateralMultiplier:>6.2f}x {'':<11} | {resp_early.defaultProbability*100:>6.1f}% {'':<5} | {resp_late.suggestedCollateralMultiplier:>6.2f}x {'':<11} | {resp_late.defaultProbability*100:>6.1f}%")

    # Plot Visual Chart
    plt.figure(figsize=(10, 5), dpi=300)
    plt.style.use("dark_background") if "dark_background" in plt.style.available else None
    
    early_mults = [d.suggestedCollateralMultiplier for d in early_data]
    late_mults = [d.suggestedCollateralMultiplier for d in late_data]

    plt.plot(rounds, early_mults, marker="o", color="#ef4444", linewidth=2.5, label="Early Bidder (Won R1 — High Moral Hazard)")
    plt.plot(rounds, late_mults, marker="s", color="#3b82f6", linewidth=2.5, label="Late Bidder (Disciplined Saver)")

    plt.axhline(y=1.0, color="#64748b", linestyle="--", alpha=0.7, label="Base Protocol Solvency (1.0x)")
    plt.title("Vouch AI: Suggested Collateral Trajectory (Early vs Late Bidder)", fontsize=13, pad=15, color="white", weight="bold")
    plt.xlabel("Chit Fund Round", fontsize=11, color="#cbd5e1")
    plt.ylabel("Suggested Collateral Multiplier", fontsize=11, color="#cbd5e1")
    plt.xticks(rounds)
    plt.grid(True, linestyle=":", alpha=0.4)
    plt.legend(frameon=True, facecolor="#1e293b", edgecolor="#475569")
    plt.tight_layout()

    out_file = os.path.join(ASSETS_DIR, "early_vs_late_bidder.png")
    plt.savefig(out_file, dpi=300)
    plt.close()
    print(f"[Chart Saved] -> {out_file}")

def simulate_voucher_impact():
    """
    Demonstrates how staking social reputation & capital in VouchRegistry
    systematically reduces collateral multipliers for members.
    """
    print(f"\n================ Scenario 2: Staked Voucher Collateral Reduction ================")
    stakes = [0.0, 0.25, 0.50, 0.75, 1.0, 1.25, 1.50]
    results = []

    print(f"{'Voucher Stake Ratio':<20} | {'Reputation Score':<18} | {'Collateral Mult':<18} | {'Default Prob':<12}")
    print("-" * 75)

    for s in stakes:
        rep = int(s * 6000)
        req = RiskRequest(
            member="0xStakedMember",
            term_length=10,
            months_remaining=7,
            current_round=3,
            has_won=True,
            win_round=2,
            payment_streak=2,
            voucher_reputation=rep,
            voucher_stake_ratio=s,
            historical_cycles=1,
            bid_aggression=0.4
        )
        resp = compute_risk(req)
        results.append((s, rep, resp.suggestedCollateralMultiplier, resp.defaultProbability))
        print(f"{s:>6.2f}x pot {'':<11} | {rep:>6d} pts {'':<9} | {resp.suggestedCollateralMultiplier:>6.2f}x {'':<11} | {resp.defaultProbability*100:>6.1f}%")

    # Plot
    plt.figure(figsize=(9, 4.5), dpi=300)
    stk_vals = [r[0] for r in results]
    mult_vals = [r[2] for r in results]

    plt.bar([f"{s*100:.0f}% Pot" for s in stk_vals], mult_vals, color="#6366f1", width=0.5, edgecolor="#a5b4fc")
    plt.axhline(y=1.0, color="#10b981", linestyle="--", label="Ideal 1.0x Base Minimum")
    plt.title("Impact of Staked Voucher Backing on Collateral Multiplier", fontsize=13, pad=15, weight="bold")
    plt.xlabel("External Voucher Stake Ratio", fontsize=11)
    plt.ylabel("Suggested Collateral Multiplier", fontsize=11)
    plt.grid(True, axis="y", linestyle=":", alpha=0.4)
    plt.legend()
    plt.tight_layout()

    out_file = os.path.join(ASSETS_DIR, "voucher_collateral_reduction.png")
    plt.savefig(out_file, dpi=300)
    plt.close()
    print(f"[Chart Saved] -> {out_file}")

def main():
    print("[*] Running Vouch AI Stress-Test & Pitch Visualization Generator...")
    simulate_early_vs_late_bidder(term_length=10)
    simulate_voucher_impact()
    print("\n[OK] All pitch simulation charts generated in ai/assets/ folder!")

if __name__ == "__main__":
    main()
