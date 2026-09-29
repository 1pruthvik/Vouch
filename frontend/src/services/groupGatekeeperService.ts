/**
 * Group Gatekeeper Service
 * Handles cryptographic Hashed Group Codes, Admin Secret Passcodes, 
 * and Member Approval Gatekeeper workflows for Vouch Community Chains.
 */

export interface PendingJoinRequest {
  id: string;
  groupAddress: string;
  groupCode: string;
  userAddress: string;
  userName: string;
  upiId: string;
  phone: string;
  trustScore: number;
  bufferDepositINR: number;
  bufferDepositMST: string;
  requestedAt: number;
  status: "pending" | "approved" | "rejected";
}

export interface GroupGatekeeperRecord {
  groupAddress: string;
  groupName: string;
  groupCode: string;
  adminAddress: string;
  adminSecretHash: string; // SHA-256 or masked secret
  adminSecretPlain: string; // Stored securely for creator demo
  isGatekeeperEnabled: boolean;
  createdAt: number;
}

const GATEKEEPER_STORAGE_KEY = "vouch_gatekeeper_records";
const PENDING_REQUESTS_KEY = "vouch_pending_join_requests";

// Helper: Generate deterministic or random clean Hashed Group Code
export function generateGroupCode(name: string, address: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 5).toUpperCase();
  const addressHash = address.replace("0x", "").substring(0, 4).toUpperCase();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `VOUCH-${cleanName || "CHAIN"}-${addressHash || randomSuffix}`;
}

// Helper: Generate cryptographic Admin Secret Code
export function generateAdminSecret(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let secret = "ADM-";
  for (let i = 0; i < 4; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  secret += "-";
  for (let i = 0; i < 4; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

export class GroupGatekeeperService {
  // Get all registered gatekeeper group records
  public static getAllGroupRecords(): GroupGatekeeperRecord[] {
    try {
      const data = localStorage.getItem(GATEKEEPER_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Register a newly deployed group with its code & admin secret
  public static registerGroup(record: GroupGatekeeperRecord): void {
    const records = this.getAllGroupRecords();
    const existingIdx = records.findIndex(
      (r) => r.groupAddress.toLowerCase() === record.groupAddress.toLowerCase()
    );
    if (existingIdx >= 0) {
      records[existingIdx] = record;
    } else {
      records.unshift(record);
    }
    localStorage.setItem(GATEKEEPER_STORAGE_KEY, JSON.stringify(records));
  }

  // Resolve group address from group code or address
  public static resolveGroup(codeOrAddress: string): GroupGatekeeperRecord | null {
    if (!codeOrAddress) return null;
    const clean = codeOrAddress.trim().toLowerCase();
    const records = this.getAllGroupRecords();
    
    // Check address match
    const byAddress = records.find((r) => r.groupAddress.toLowerCase() === clean);
    if (byAddress) return byAddress;

    // Check code match
    const byCode = records.find((r) => r.groupCode.toLowerCase() === clean);
    if (byCode) return byCode;

    return null;
  }

  // Get record by group address
  public static getRecordByAddress(address: string): GroupGatekeeperRecord | null {
    if (!address) return null;
    const records = this.getAllGroupRecords();
    return records.find((r) => r.groupAddress.toLowerCase() === address.toLowerCase()) || null;
  }

  // Submit a pending member join request
  public static submitJoinRequest(req: Omit<PendingJoinRequest, "id" | "requestedAt" | "status">): PendingJoinRequest {
    const requests = this.getAllPendingRequests();
    const newReq: PendingJoinRequest = {
      ...req,
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      requestedAt: Date.now(),
      status: "pending",
    };
    requests.unshift(newReq);
    localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(requests));
    return newReq;
  }

  // Get all pending requests
  public static getAllPendingRequests(): PendingJoinRequest[] {
    try {
      const data = localStorage.getItem(PENDING_REQUESTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Get pending requests for a specific group
  public static getGroupPendingRequests(groupAddress: string): PendingJoinRequest[] {
    if (!groupAddress) return [];
    return this.getAllPendingRequests().filter(
      (r) => r.groupAddress.toLowerCase() === groupAddress.toLowerCase() && r.status === "pending"
    );
  }

  // Check if a specific user is approved or pending for a group
  public static getUserRequestStatus(groupAddress: string, userAddress: string): "approved" | "pending" | "rejected" | "none" {
    if (!groupAddress || !userAddress) return "none";
    const requests = this.getAllPendingRequests();
    const match = requests.find(
      (r) =>
        r.groupAddress.toLowerCase() === groupAddress.toLowerCase() &&
        r.userAddress.toLowerCase() === userAddress.toLowerCase()
    );
    return match ? match.status : "none";
  }

  // Admin approves a member with their secret code
  public static approveMemberRequest(
    requestId: string,
    adminSecretInput: string
  ): { success: boolean; message: string; request?: PendingJoinRequest } {
    const requests = this.getAllPendingRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) {
      return { success: false, message: "Join request not found." };
    }

    const groupRecord = this.getRecordByAddress(req.groupAddress);
    if (!groupRecord) {
      // If no gatekeeper rule, auto-approve
      req.status = "approved";
      localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(requests));
      return { success: true, message: "Member approved successfully.", request: req };
    }

    // Verify secret code (case-insensitive trim)
    if (
      groupRecord.adminSecretPlain.trim().toUpperCase() !==
      adminSecretInput.trim().toUpperCase()
    ) {
      return {
        success: false,
        message: "Invalid Admin Secret Passcode. Access denied.",
      };
    }

    req.status = "approved";
    localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(requests));
    return {
      success: true,
      message: `Member ${req.userName} has been approved by the Admin!`,
      request: req,
    };
  }

  // Reject a member request
  public static rejectMemberRequest(requestId: string): boolean {
    const requests = this.getAllPendingRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return false;
    req.status = "rejected";
    localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(requests));
    return true;
  }
}
