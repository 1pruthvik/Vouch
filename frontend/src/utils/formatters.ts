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

export function parseWalletError(err: any): string {
  if (!err) return "An unknown error occurred.";

  const rawMsg = typeof err === "string" ? err : err.message || err.reason || err.shortMessage || "";

  // 1. Check for user rejection
  if (
    err.code === 4001 ||
    err.code === "ACTION_REJECTED" ||
    rawMsg.includes("user rejected") ||
    rawMsg.includes("User rejected") ||
    rawMsg.includes("User denied")
  ) {
    return "Connection request was cancelled in your wallet.";
  }

  // 2. Check for BridgeKey / Extension updated
  if (rawMsg.includes("BridgeKey was updated") || rawMsg.includes("updated. Refresh this page")) {
    return "BridgeKey extension was updated. Please refresh the page, then click Connect Wallet again.";
  }

  // 3. Not a group member revert
  if (rawMsg.includes("Not a group member")) {
    return "You have not joined this circle yet. Please click 'Join Circle with Deposit' first to deposit your security buffer.";
  }

  // 3. Extract nested message from ethers v6 "could not coalesce error"
  const messageMatch = rawMsg.match(/"message":\s*"([^"]+)"/);
  if (messageMatch && messageMatch[1]) {
    const inner = messageMatch[1];
    if (inner.includes("BridgeKey was updated")) {
      return "BridgeKey extension was updated. Please refresh the page, then click Connect Wallet again.";
    }
    if (inner.includes("User rejected") || inner.includes("user rejected") || inner.includes("User denied")) {
      return "Connection request was cancelled in your wallet.";
    }
    return inner;
  }

  // 4. Check for nested error objects
  if (err.info?.error?.message) {
    return parseWalletError(err.info.error.message);
  }
  if (err.error?.message) {
    return parseWalletError(err.error.message);
  }
  if (err.data?.message) {
    return parseWalletError(err.data.message);
  }

  // 5. Invalid private key
  if (
    rawMsg.includes("invalid private key") ||
    rawMsg.includes("invalid HexString") ||
    rawMsg.includes("expected hex string") ||
    rawMsg.includes("invalid BytesLike") ||
    rawMsg.includes("invalid key format")
  ) {
    return "Invalid private key format. Must be a valid 64-character hex string (e.g. 0x...).";
  }

  // 6. Long unparsed json / coalesce errors
  if (rawMsg.includes("could not coalesce error")) {
    return "Unable to communicate with browser extension. Please refresh the page or use Private Key.";
  }

  if (rawMsg.length > 0 && rawMsg.length < 150 && !rawMsg.includes("{")) {
    return rawMsg;
  }

  return "Failed to connect wallet. Please refresh the page or use Private Key.";
}

