import { LedgerEvent } from "../components/LedgerView";

export async function fetchLedgerEvents(
  groupId: string,
  apiBaseUrl: string = "http://localhost:3001/api"
): Promise<LedgerEvent[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/ledger/${groupId}`);
    if (res.ok) {
      const data = await res.json();
      return data.map((item: any, idx: number) => ({
        id: item.id?.toString() || idx.toString(),
        eventName: item.event_name || item.eventName || "Event",
        round: item.round || 0,
        member: item.member_address || item.member || "0x...",
        amount: item.amount ? `${item.amount} tMSTC` : "--",
        txHash: item.tx_hash || item.txHash || "0x0",
        timestamp: item.timestamp || "Just now",
      }));
    }
  } catch (err) {
    console.warn("Backend indexer offline:", err);
  }
  return [];
}

export async function fetchIndexedGroups(
  apiBaseUrl: string = "http://localhost:3001/api"
): Promise<any[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/groups`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend indexer offline:", err);
  }
  return [];
}
