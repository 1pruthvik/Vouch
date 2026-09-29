export interface RiskPredictionRequest {
  member: string;
  term_length?: number;
  months_remaining?: number;
  has_won?: boolean;
  win_round?: number;
  payment_streak?: number;
  voucher_reputation?: number;
  voucher_stake_ratio?: number;
  historical_cycles?: number;
  bid_aggression?: number;
}

export interface RiskPredictionResponse {
  member: string;
  suggestedCollateralMultiplier: number;
  defaultProbability: number;
  riskTier: string;
  advisoryNote: string;
}

export async function fetchRiskAdvisory(
  req: RiskPredictionRequest,
  apiBaseUrl: string = "http://localhost:8000"
): Promise<RiskPredictionResponse> {
  try {
    const res = await fetch(`${apiBaseUrl}/predict-risk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        member: req.member,
        term_length: req.term_length ?? 10,
        months_remaining: req.months_remaining ?? 5,
        has_won: req.has_won ?? false,
        win_round: req.win_round ?? 0,
        payment_streak: req.payment_streak ?? 1,
        voucher_reputation: req.voucher_reputation ?? 1000,
        voucher_stake_ratio: req.voucher_stake_ratio ?? 0.5,
        historical_cycles: req.historical_cycles ?? 1,
        bid_aggression: req.bid_aggression ?? 0.2,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn("AI Risk service offline, using deterministic baseline heuristic:", err);
  }

  // Fallback heuristic model
  let prob = 0.22;
  if (req.has_won) prob += 0.18;
  if ((req.months_remaining ?? 5) > 4) prob += 0.08;
  if ((req.payment_streak ?? 1) >= 3) prob -= 0.06;

  prob = Math.max(0.05, Math.min(0.95, prob));
  const mult = parseFloat((1.0 + prob * 0.8).toFixed(2));

  let tier = "Low Risk (Tier 1)";
  let note = "Standard buffer collateral is sufficient.";
  if (prob >= 0.45) {
    tier = "High Risk (Tier 3)";
    note = `High default exposure post-win. Advisory multiplier: ${mult}x.`;
  } else if (prob >= 0.20) {
    tier = "Moderate Risk (Tier 2)";
    note = "Moderate exposure. Maintain active voucher or additional buffer.";
  }

  return {
    member: req.member,
    suggestedCollateralMultiplier: mult,
    defaultProbability: prob,
    riskTier: tier,
    advisoryNote: note,
  };
}
