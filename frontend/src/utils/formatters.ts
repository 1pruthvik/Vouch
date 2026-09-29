/**
 * Utility formatters for Indian Rupee (INR) representation & on-chain tokens
 * 1 tMSTC = ₹1,000 (standard conversion rate)
 */

export const MST_TO_INR_RATE = 1000;

export function formatINR(mstAmount: string | number): string {
  const num = typeof mstAmount === "string" ? parseFloat(mstAmount) || 0 : mstAmount;
  const inrValue = Math.round(num * MST_TO_INR_RATE);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(inrValue);
}

export function formatRawINR(amountInINR: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInINR);
}

export function inrToMST(inrAmount: number): string {
  return (inrAmount / MST_TO_INR_RATE).toFixed(4);
}

export function getFriendlyMemberName(address: string): string {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "Not Assigned";
  if (address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function getTrafficLightStatus(
  solvency: { isSolvent: boolean; totalBacking: string; requiredBacking: string } | undefined,
  isDefaulted: boolean = false
) {
  if (isDefaulted) {
    return {
      status: "red" as const,
      label: "Action Needed",
      badgeClass: "badge-status-red",
      description: "Installment overdue. Please complete deposit to remain in good standing.",
    };
  }
  if (!solvency || !solvency.isSolvent) {
    return {
      status: "yellow" as const,
      label: "Pending Deposit",
      badgeClass: "badge-status-yellow",
      description: "Collateral backing is pending or partial.",
    };
  }
  return {
    status: "green" as const,
    label: "Good Standing",
    badgeClass: "badge-status-green",
    description: "All payments and security deposit are fully confirmed on-chain.",
  };
}
