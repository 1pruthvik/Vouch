import { isAddress } from "viem";
import { MST_TO_INR_RATE } from "../utils/formatters";

export type CircleStatus =
  | "WAITING_FOR_MEMBERS"
  | "READY"
  | "COLLECTING"
  | "AUCTION_COMMIT"
  | "AUCTION_REVEAL"
  | "AUCTION_SETTLED"
  | "CLOSED";

export interface ParticipantInput {
  name: string;
  email: string;
  walletAddress: string;
}

export interface CircleMember {
  address: string;
  name: string;
  email?: string;
  joinedAt: string;
  hasPaidContribution: boolean;
  hasCommittedBid: boolean;
  hasRevealedBid: boolean;
  revealedBidINR?: number;
  hasWon: boolean;
  winRound?: number;
  isCreator?: boolean;
}

export interface CircleInvitation {
  id: string;
  circleId: string;
  participantName: string;
  participantEmail: string;
  walletAddress: string;
  sentAt: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
}

export interface CircleAuditRecord {
  id: string;
  eventName: string;
  actor: string;
  description: string;
  timestamp: string;
  txHash?: string;
  isSimulated?: boolean;
}

export interface CircleData {
  id: string;
  address: string;
  name: string;
  creatorAddress: string;
  memberCount: number; // configured capacity (e.g. 5)
  installmentAmount: string; // e.g. "5.0" tMSTC
  installmentAmountINR: number; // e.g. 5000
  cycleDurationSeconds: number;
  discountCapBps: number;
  reserveFeeBps: number;
  currentRound: number;
  totalRounds: number;
  status: CircleStatus;
  createdAt: string;
  members: CircleMember[];
  invitations: CircleInvitation[];
  auditTrail: CircleAuditRecord[];
  currentPotINR: number;
  winningBidINR?: number;
  winnerAddress?: string;
  winnerName?: string;
  discountSavingsPerMemberINR?: number;
  settlementTxHash?: string;
  isCustomCircle?: boolean;
}

const STORAGE_KEY = "vouch_circles_v3";

export class CircleLifecycleService {
  private static getInitialCircles(): CircleData[] {
    return [
      {
        id: "alpha-savings-circle",
        address: "0xAf378D33B037A6668fOd128c4BBA28bb65974D9b",
        name: "Alpha Savings Circle",
        creatorAddress: "0x71C8F21c83B386f786f4a3E0b90494F3c419392B",
        memberCount: 5,
        installmentAmount: "5.0",
        installmentAmountINR: 5000,
        cycleDurationSeconds: 30 * 24 * 3600,
        discountCapBps: 3000,
        reserveFeeBps: 250,
        currentRound: 1,
        totalRounds: 5,
        status: "WAITING_FOR_MEMBERS",
        createdAt: "Today, 09:00 AM",
        currentPotINR: 25000,
        members: [], // Starts with 0 members!
        invitations: [],
        auditTrail: [
          {
            id: "ev-alpha-1",
            eventName: "CircleCreated",
            actor: "0x71C8F21c83B386f786f4a3E0b90494F3c419392B",
            description: "ChitGroup smart contract initialized on MST Testnet (Chain ID 91562037). Awaiting member invitations.",
            timestamp: "Today, 09:00 AM",
            txHash: "0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
          },
        ],
      },
      {
        id: "bangalore-techies-chit",
        address: "0xb794f5ea0ba39494ce839613fffba74279579268",
        name: "Bangalore Techies Chit",
        creatorAddress: "0x39A88F110B74f5ea0ba39494ce839613fffba742",
        memberCount: 4,
        installmentAmount: "10.0",
        installmentAmountINR: 10000,
        cycleDurationSeconds: 30 * 24 * 3600,
        discountCapBps: 2500,
        reserveFeeBps: 200,
        currentRound: 1,
        totalRounds: 4,
        status: "WAITING_FOR_MEMBERS",
        createdAt: "Yesterday, 04:30 PM",
        currentPotINR: 40000,
        members: [],
        invitations: [],
        auditTrail: [
          {
            id: "ev-b1",
            eventName: "CircleCreated",
            actor: "0x39A88F110B74f5ea0ba39494ce839613fffba742",
            description: "Circle created. 0/4 members joined. Ready for participant invitations.",
            timestamp: "Yesterday, 04:30 PM",
            txHash: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
          },
        ],
      },
      {
        id: "family-emergency-pool",
        address: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
        name: "Family Emergency Pool",
        creatorAddress: "0x91F221A378D33B037A6668fOd128c4BBA28bb659",
        memberCount: 5,
        installmentAmount: "2.0",
        installmentAmountINR: 2000,
        cycleDurationSeconds: 30 * 24 * 3600,
        discountCapBps: 3000,
        reserveFeeBps: 150,
        currentRound: 1,
        totalRounds: 5,
        status: "WAITING_FOR_MEMBERS",
        createdAt: "2 days ago",
        currentPotINR: 10000,
        members: [],
        invitations: [],
        auditTrail: [
          {
            id: "ev-f1",
            eventName: "CircleCreated",
            actor: "0x91F221A378D33B037A6668fOd128c4BBA28bb659",
            description: "Circle created with ₹2,000 monthly contribution.",
            timestamp: "2 days ago",
            txHash: "0x77d88c9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
          },
        ],
      },
    ];
  }

  public static getAllCircles(): CircleData[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    const initial = this.getInitialCircles();
    this.saveCircles(initial);
    return initial;
  }

  public static getCircleByIdOrAddress(identifier: string): CircleData | null {
    const circles = this.getAllCircles();
    const cleanId = identifier.toLowerCase().trim();
    return (
      circles.find(
        (c) =>
          c.id.toLowerCase() === cleanId ||
          c.address.toLowerCase() === cleanId
      ) || null
    );
  }

  public static saveCircles(circles: CircleData[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(circles));
    } catch (e) {
      console.warn("Could not save circles to localStorage:", e);
    }
  }

  /**
   * Create a new savings circle starting with 0 members and status WAITING_FOR_MEMBERS
   */
  public static createNewCircle(params: {
    name: string;
    memberCount: number;
    installmentAmount: string;
    cycleDurationSeconds?: number;
    discountCapBps?: number;
    reserveFeeBps?: number;
    creatorAddress?: string;
    deployedContractAddress?: string;
    txHash?: string;
  }): CircleData {
    const circles = this.getAllCircles();
    const slug = params.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const address =
      params.deployedContractAddress ||
      `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    const numInstallment = parseFloat(params.installmentAmount) || 5.0;
    const installmentINR = Math.round(numInstallment * MST_TO_INR_RATE);
    const totalPotINR = params.memberCount * installmentINR;

    const newCircle: CircleData = {
      id: slug || `circle-${Date.now()}`,
      address,
      name: params.name,
      creatorAddress: params.creatorAddress || "0x71C8F21c83B386f786f4a3E0b90494F3c419392B",
      memberCount: params.memberCount,
      installmentAmount: params.installmentAmount,
      installmentAmountINR: installmentINR,
      cycleDurationSeconds: params.cycleDurationSeconds || 30 * 24 * 3600,
      discountCapBps: params.discountCapBps || 3000,
      reserveFeeBps: params.reserveFeeBps || 250,
      currentRound: 1,
      totalRounds: params.memberCount,
      status: "WAITING_FOR_MEMBERS",
      createdAt: "Just now",
      currentPotINR: totalPotINR,
      members: [], // Strictly 0 members!
      invitations: [],
      isCustomCircle: true,
      auditTrail: [
        {
          id: `audit-${Date.now()}-1`,
          eventName: "CircleCreated",
          actor: params.creatorAddress || "Organizer",
          description: `Savings circle "${params.name}" deployed. Contract initialized at ${address.substring(0, 10)}... (0/${params.memberCount} members).`,
          timestamp: "Just now",
          txHash: params.txHash,
          isSimulated: !params.txHash,
        },
      ],
    };

    circles.unshift(newCircle);
    this.saveCircles(circles);
    return newCircle;
  }

  /**
   * Validate and manually send invitations to participants
   */
  public static sendManualInvitations(
    circleAddressOrId: string,
    participants: ParticipantInput[]
  ): { success: boolean; circle?: CircleData; error?: string } {
    const circles = this.getAllCircles();
    const idx = circles.findIndex(
      (c) =>
        c.id.toLowerCase() === circleAddressOrId.toLowerCase() ||
        c.address.toLowerCase() === circleAddressOrId.toLowerCase()
    );
    if (idx === -1) {
      return { success: false, error: "Circle not found." };
    }

    const circle = { ...circles[idx] };
    const currentMemberAddresses = new Set(circle.members.map((m) => m.address.toLowerCase()));
    const currentMemberEmails = new Set(circle.members.map((m) => m.email?.toLowerCase()).filter(Boolean));
    const activeInvitedAddresses = new Set(
      circle.invitations.filter((i) => i.status === "PENDING").map((i) => i.walletAddress.toLowerCase())
    );
    const activeInvitedEmails = new Set(
      circle.invitations.filter((i) => i.status === "PENDING").map((i) => i.participantEmail.toLowerCase())
    );

    const remainingSlots = circle.memberCount - (circle.members.length + circle.invitations.filter((i) => i.status === "PENDING").length);

    if (participants.length > remainingSlots) {
      return {
        success: false,
        error: `Cannot invite ${participants.length} participants. Only ${remainingSlots} open slot${remainingSlots === 1 ? "" : "s"} remaining in this circle.`,
      };
    }

    // Validate each participant
    const batchEmails = new Set<string>();
    const batchAddresses = new Set<string>();
    const newInvitations: CircleInvitation[] = [];

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const cleanName = p.name.trim();
      const cleanEmail = p.email.trim().toLowerCase();
      const cleanAddress = p.walletAddress.trim();

      if (!cleanName) {
        return { success: false, error: `Participant #${i + 1}: Name is required.` };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return { success: false, error: `Participant "${cleanName}": Invalid email format (${cleanEmail}).` };
      }
      if (!isAddress(cleanAddress)) {
        return {
          success: false,
          error: `Participant "${cleanName}": Invalid EVM blockchain wallet address (${cleanAddress}). Must be a 0x-prefixed 40-hex-character address.`,
        };
      }

      // Check duplicates within batch
      if (batchEmails.has(cleanEmail)) {
        return { success: false, error: `Duplicate email "${cleanEmail}" in your invitation batch.` };
      }
      if (batchAddresses.has(cleanAddress.toLowerCase())) {
        return { success: false, error: `Duplicate wallet address "${cleanAddress}" in your invitation batch.` };
      }
      batchEmails.add(cleanEmail);
      batchAddresses.add(cleanAddress.toLowerCase());

      // Check duplicates against circle
      if (currentMemberAddresses.has(cleanAddress.toLowerCase()) || currentMemberEmails.has(cleanEmail)) {
        return { success: false, error: `"${cleanName}" (${cleanAddress.substring(0, 8)}...) is already an active member of this circle.` };
      }
      if (activeInvitedAddresses.has(cleanAddress.toLowerCase()) || activeInvitedEmails.has(cleanEmail)) {
        return { success: false, error: `"${cleanName}" (${cleanEmail}) already has a pending invitation for this circle.` };
      }

      const invId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      newInvitations.push({
        id: invId,
        circleId: circle.id,
        participantName: cleanName,
        participantEmail: cleanEmail,
        walletAddress: cleanAddress,
        sentAt: "Just now",
        status: "PENDING",
      });

      // Synchronize with backend indexer REST API if available
      try {
        fetch(`http://localhost:4000/api/groups/${circle.address}/invitations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            wallet_address: cleanAddress,
            status: "PENDING",
          }),
        }).catch(() => {});
      } catch {}
    }

    circle.invitations = [...circle.invitations, ...newInvitations];
    circle.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      eventName: "InvitationsSent",
      actor: circle.creatorAddress ? `${circle.creatorAddress.substring(0, 8)}... (Owner)` : "Owner",
      description: `Sent invitations to ${newInvitations.length} participant${newInvitations.length === 1 ? "" : "s"}: ${newInvitations.map((i) => `${i.participantName} (${i.walletAddress.substring(0, 8)}...)`).join(", ")}`,
      timestamp: "Just now",
      isSimulated: true,
    });

    circles[idx] = circle;
    this.saveCircles(circles);
    return { success: true, circle };
  }

  /**
   * Cancel / Remove an invitation
   */
  public static cancelInvitation(circleAddressOrId: string, invitationId: string): CircleData | null {
    const circles = this.getAllCircles();
    const idx = circles.findIndex(
      (c) =>
        c.id.toLowerCase() === circleAddressOrId.toLowerCase() ||
        c.address.toLowerCase() === circleAddressOrId.toLowerCase()
    );
    if (idx === -1) return null;

    const circle = { ...circles[idx] };
    const inv = circle.invitations.find((i) => i.id === invitationId);
    circle.invitations = circle.invitations.filter((i) => i.id !== invitationId);

    if (inv) {
      circle.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        eventName: "InvitationCancelled",
        actor: "Owner",
        description: `Invitation for ${inv.participantName} (${inv.participantEmail}) was cancelled.`,
        timestamp: "Just now",
      });
    }

    // Backend sync
    try {
      fetch(`http://localhost:4000/api/invitations/${invitationId}`, { method: "DELETE" }).catch(() => {});
    } catch {}

    circles[idx] = circle;
    this.saveCircles(circles);
    return circle;
  }

  /**
   * Accept an invitation and join as a confirmed on-chain member
   */
  public static acceptInvitation(
    circleAddressOrId: string,
    invitationId: string,
    txHash?: string
  ): CircleData | null {
    const circles = this.getAllCircles();
    const idx = circles.findIndex(
      (c) =>
        c.id.toLowerCase() === circleAddressOrId.toLowerCase() ||
        c.address.toLowerCase() === circleAddressOrId.toLowerCase()
    );
    if (idx === -1) return null;

    const circle = { ...circles[idx] };
    const invIdx = circle.invitations.findIndex((i) => i.id === invitationId);
    if (invIdx === -1) return circle;

    const inv = circle.invitations[invIdx];
    inv.status = "ACCEPTED";

    const newMember: CircleMember = {
      address: inv.walletAddress,
      name: inv.participantName,
      email: inv.participantEmail,
      joinedAt: "Just now",
      hasPaidContribution: false,
      hasCommittedBid: false,
      hasRevealedBid: false,
      hasWon: false,
    };

    circle.members = [...circle.members, newMember];
    circle.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      eventName: "MemberJoined",
      actor: inv.participantName,
      description: `${inv.participantName} (${inv.walletAddress.substring(0, 8)}...) accepted invitation, deposited refundable security buffer, and joined as active member.`,
      timestamp: "Just now",
      txHash,
      isSimulated: !txHash,
    });

    // Check if circle has reached capacity
    if (circle.members.length >= circle.memberCount) {
      circle.status = "READY";
      circle.auditTrail.unshift({
        id: `audit-ready-${Date.now()}`,
        eventName: "CircleReady",
        actor: "Protocol",
        description: `All ${circle.memberCount} participant slots filled. Savings circle is active and ready for Round 1!`,
        timestamp: "Just now",
        isSimulated: true,
      });
    }

    // Backend sync
    try {
      fetch(`http://localhost:4000/api/invitations/${invitationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      }).catch(() => {});
    } catch {}

    circles[idx] = circle;
    this.saveCircles(circles);
    return circle;
  }

  /**
   * Accept all pending invitations
   */
  public static acceptAllInvitations(circleAddressOrId: string): CircleData | null {
    const circles = this.getAllCircles();
    const idx = circles.findIndex(
      (c) =>
        c.id.toLowerCase() === circleAddressOrId.toLowerCase() ||
        c.address.toLowerCase() === circleAddressOrId.toLowerCase()
    );
    if (idx === -1) return null;

    const circle = { ...circles[idx] };
    const pending = circle.invitations.filter((i) => i.status === "PENDING");
    if (pending.length === 0) return circle;

    pending.forEach((inv) => {
      inv.status = "ACCEPTED";
      if (circle.members.length < circle.memberCount) {
        circle.members.push({
          address: inv.walletAddress,
          name: inv.participantName,
          email: inv.participantEmail,
          joinedAt: "Just now",
          hasPaidContribution: false,
          hasCommittedBid: false,
          hasRevealedBid: false,
          hasWon: false,
        });
      }
    });

    circle.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      eventName: "BatchMembersJoined",
      actor: "Community",
      description: `${pending.length} invited participant${pending.length === 1 ? "" : "s"} accepted invitations and joined on-chain.`,
      timestamp: "Just now",
      isSimulated: true,
    });

    if (circle.members.length >= circle.memberCount) {
      circle.status = "READY";
    }

    circles[idx] = circle;
    this.saveCircles(circles);
    return circle;
  }

  /**
   * Start the contribution round
   */
  public static startContributionRound(circleAddressOrId: string): CircleData | null {
    const circles = this.getAllCircles();
    const idx = circles.findIndex(
      (c) =>
        c.id.toLowerCase() === circleAddressOrId.toLowerCase() ||
        c.address.toLowerCase() === circleAddressOrId.toLowerCase()
    );
    if (idx === -1) return null;

    const circle = { ...circles[idx] };
    circle.status = "COLLECTING";
    circle.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      eventName: "RoundStarted",
      actor: "Contract State Machine",
      description: `Round ${circle.currentRound} contribution period opened. Dues: ₹${circle.installmentAmountINR.toLocaleString("en-IN")} / member.`,
      timestamp: "Just now",
      isSimulated: true,
    });

    circles[idx] = circle;
    this.saveCircles(circles);
    return circle;
  }

  /**
   * Record a member contribution
   */
  public static payContribution(
    circleAddressOrId: string,
    memberAddress: string,
    txHash?: string
  ): CircleData | null {
    const circles = this.getAllCircles();
    const idx = circles.findIndex(
      (c) =>
        c.id.toLowerCase() === circleAddressOrId.toLowerCase() ||
        c.address.toLowerCase() === circleAddressOrId.toLowerCase()
    );
    if (idx === -1) return null;

    const circle = { ...circles[idx] };
    const member = circle.members.find(
      (m) => m.address.toLowerCase() === memberAddress.toLowerCase()
    );
    if (member) {
      member.hasPaidContribution = true;
    }

    // Mark other members as paid
    circle.members.forEach((m) => {
      m.hasPaidContribution = true;
    });

    circle.status = "AUCTION_COMMIT";
    circle.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      eventName: "InstallmentPaid",
      actor: member ? member.name : memberAddress.substring(0, 8),
      description: `Monthly contribution of ₹${circle.installmentAmountINR.toLocaleString("en-IN")} confirmed on MST Testnet. Round ${circle.currentRound} collection complete.`,
      timestamp: "Just now",
      txHash,
      isSimulated: !txHash,
    });

    circle.auditTrail.unshift({
      id: `audit-auc-${Date.now()}`,
      eventName: "AuctionOpened",
      actor: "Protocol",
      description: `Secret commit-reveal reverse auction opened for Round ${circle.currentRound} pot payout.`,
      timestamp: "Just now",
      isSimulated: true,
    });

    circles[idx] = circle;
    this.saveCircles(circles);
    return circle;
  }

  /**
   * Commit a secret bid
   */
  public static commitBid(
    circleAddressOrId: string,
    memberAddress: string,
    requestedPayoutINR: number,
    txHash?: string
  ): CircleData | null {
    const circles = this.getAllCircles();
    const idx = circles.findIndex(
      (c) =>
        c.id.toLowerCase() === circleAddressOrId.toLowerCase() ||
        c.address.toLowerCase() === circleAddressOrId.toLowerCase()
    );
    if (idx === -1) return null;

    const circle = { ...circles[idx] };
    const member = circle.members.find(
      (m) => m.address.toLowerCase() === memberAddress.toLowerCase()
    );
    if (member) {
      member.hasCommittedBid = true;
      member.revealedBidINR = requestedPayoutINR;
    }

    circle.status = "AUCTION_REVEAL";
    circle.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      eventName: "BidCommitted",
      actor: member ? member.name : "Member",
      description: `Encrypted bid commitment hash keccak256(bid, salt, sender) anchored on MST Blockchain.`,
      timestamp: "Just now",
      txHash,
      isSimulated: !txHash,
    });

    circles[idx] = circle;
    this.saveCircles(circles);
    return circle;
  }

  /**
   * Reveal bid and settle auction
   */
  public static revealAndSettleAuction(
    circleAddressOrId: string,
    winningMemberAddress?: string,
    winningPayoutINR?: number,
    txHash?: string
  ): CircleData | null {
    const circles = this.getAllCircles();
    const idx = circles.findIndex(
      (c) =>
        c.id.toLowerCase() === circleAddressOrId.toLowerCase() ||
        c.address.toLowerCase() === circleAddressOrId.toLowerCase()
    );
    if (idx === -1) return null;

    const circle = { ...circles[idx] };
    const grossPot = circle.currentPotINR || circle.memberCount * circle.installmentAmountINR;
    const payout = winningPayoutINR || Math.round(grossPot * 0.85); // 15% discount default
    const totalDiscount = grossPot - payout;
    const dividendPerMember = circle.memberCount > 0 ? Math.round(totalDiscount / circle.memberCount) : 0;

    const winner = circle.members.find(
      (m) =>
        winningMemberAddress &&
        m.address.toLowerCase() === winningMemberAddress.toLowerCase()
    ) || circle.members[0];

    if (winner) {
      winner.hasWon = true;
      winner.winRound = circle.currentRound;
      winner.hasRevealedBid = true;
    }

    circle.status = "AUCTION_SETTLED";
    circle.winningBidINR = payout;
    circle.winnerAddress = winner ? winner.address : circle.creatorAddress;
    circle.winnerName = winner ? winner.name : "Winner";
    circle.discountSavingsPerMemberINR = dividendPerMember;
    circle.settlementTxHash = txHash || "0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f";

    circle.auditTrail.unshift({
      id: `audit-reveal-${Date.now()}`,
      eventName: "BidRevealed",
      actor: circle.winnerName,
      description: `Plaintext bid verified against on-chain commitment hash. Payout requested: ₹${payout.toLocaleString("en-IN")}.`,
      timestamp: "Just now",
      isSimulated: true,
    });

    circle.auditTrail.unshift({
      id: `audit-settle-${Date.now()}`,
      eventName: "AuctionSettled",
      actor: "Contract Settlement Engine",
      description: `Round ${circle.currentRound} settled: ${circle.winnerName} received ₹${payout.toLocaleString("en-IN")}. Total discount of ₹${totalDiscount.toLocaleString("en-IN")} distributed as ₹${dividendPerMember.toLocaleString("en-IN")} savings dividend per member.`,
      timestamp: "Just now",
      txHash: circle.settlementTxHash,
      isSimulated: !txHash,
    });

    circles[idx] = circle;
    this.saveCircles(circles);
    return circle;
  }

  /**
   * Advance to next round
   */
  public static advanceToNextRound(circleAddressOrId: string): CircleData | null {
    const circles = this.getAllCircles();
    const idx = circles.findIndex(
      (c) =>
        c.id.toLowerCase() === circleAddressOrId.toLowerCase() ||
        c.address.toLowerCase() === circleAddressOrId.toLowerCase()
    );
    if (idx === -1) return null;

    const circle = { ...circles[idx] };
    if (circle.currentRound < circle.totalRounds) {
      circle.currentRound += 1;
      circle.status = "COLLECTING";

      circle.members.forEach((m) => {
        m.hasPaidContribution = false;
        m.hasCommittedBid = false;
        m.hasRevealedBid = false;
        m.revealedBidINR = undefined;
      });

      circle.winningBidINR = undefined;
      circle.winnerAddress = undefined;
      circle.winnerName = undefined;

      circle.auditTrail.unshift({
        id: `audit-round-${Date.now()}`,
        eventName: "RoundAdvanced",
        actor: "Contract State Machine",
        description: `Advanced to Round ${circle.currentRound} of ${circle.totalRounds}. Monthly contribution dues open.`,
        timestamp: "Just now",
        isSimulated: true,
      });
    } else {
      circle.status = "CLOSED";
      circle.auditTrail.unshift({
        id: `audit-closed-${Date.now()}`,
        eventName: "CircleCompleted",
        actor: "Protocol",
        description: `Circle completed all ${circle.totalRounds} rounds! Full security deposits refunded to all participants.`,
        timestamp: "Just now",
        isSimulated: true,
      });
    }

    circles[idx] = circle;
    this.saveCircles(circles);
    return circle;
  }
}
