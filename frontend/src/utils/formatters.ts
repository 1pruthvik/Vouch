/**
 * Utility formatters for Indian Rupee (INR) representation & friendly names
 * Assumes 1 tMSTC ~ ₹10,000 for intuitive mental models while preserving exact on-chain math
 */

export const MST_TO_INR_RATE = 10000;

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

export function getFriendlyMemberName(address: string, index?: number): string {
  if (!address) return "Member";
  const names = ["Aarav S.", "Priya R.", "Rahul M.", "Ananya D.", "Vikram K.", "Sneha P.", "Rohan B."];
  if (index !== undefined && index < names.length) {
    return names[index];
  }
  // Deterministic name hash based on last 2 chars of address
  const charCode = address.charCodeAt(address.length - 1) + address.charCodeAt(address.length - 2);
  return names[charCode % names.length];
}

export function getTrafficLightStatus(solvency: { isSolvent: boolean; totalBacking: string; requiredBacking: string } | undefined, isDefaulted: boolean = false) {
  if (isDefaulted) {
    return {
      status: "red" as const,
      label: "Action Needed",
      badgeClass: "badge-status-red",
      description: "Deposit or installment overdue. Please complete to avoid late deductions.",
    };
  }
  if (!solvency || !solvency.isSolvent) {
    return {
      status: "yellow" as const,
      label: "Consider Adding Backup",
      badgeClass: "badge-status-yellow",
      description: "Deposit is partially complete. Adding a trusted backer ensures full coverage.",
    };
  }
  return {
    status: "green" as const,
    label: "Good Standing",
    badgeClass: "badge-status-green",
    description: "All payments and security deposit are fully up to date.",
  };
}
