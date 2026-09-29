import { MST_TO_INR_RATE } from "../utils/formatters";

export type CircleStatus =
  | "WAITING_FOR_MEMBERS"
  | "READY"
  | "COLLECTING"
  | "AUCTION_COMMIT"
  | "AUCTION_REVEAL"
  | "AUCTION_SETTLED"
  | "CLOSED";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  address: string;
  avatarBg: string;
  creditScore: number;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "user-1",
    name: "Arjun Kumar",
    email: "arjun@example.com",
    address: "0x71C8F21c83B386f786f4a3E0b90494F3c419392B",
    avatarBg: "bg-emerald-500",
    creditScore: 820,
  },
  {
    id: "user-2",
    name: "Priya Sharma",
    email: "priya@example.com",
    address: "0x39A88F110B74f5ea0ba39494ce839613fffba742",
    avatarBg: "bg-indigo-500",
    creditScore: 790,
  },
  {
    id: "user-3",
    name: "Rahul N",
    email: "rahul@example.com",
    address: "0x91F221A378D33B037A6668fOd128c4BBA28bb659",
    avatarBg: "bg-amber-500",
    creditScore: 750,
  },
  {
    id: "user-4",
    name: "Ananya Rao",
    email: "ananya@example.com",
    address: "0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
    avatarBg: "bg-rose-500",
    creditScore: 840,
  },
  {
    id: "user-5",
    name: "Vikram Patel",
    email: "vikram@example.com",
    address: "0xb794f5ea0ba39494ce839613fffba74279579268",
    avatarBg: "bg-purple-500",
    creditScore: 780,
  },
  {
    id: "user-6",
    name: "Sneha Iyer",
    email: "sneha@example.com",
    address: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
    avatarBg: "bg-teal-500",
    creditScore: 810,
  },
  {
    id: "user-7",
    name: "Karan Mehta",
    email: "karan@example.com",
    address: "0x2468135790abcdef1234567890abcdef12345678",
    avatarBg: "bg-blue-500",
    creditScore: 760,
  },
  {
    id: "user-8",
    name: "Meera Nair",
    email: "meera@example.com",
    address: "0x1357924680fedcba0987654321fedcba09876543",
    avatarBg: "bg-orange-500",
    creditScore: 830,
  },
];

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
  userId: string;
  userName: string;
  userEmail: string;
  userAddress: string;
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
  memberCount: number; // capacity (e.g. 5)
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

const STORAGE_KEY = "vouch_circles_v2";

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
        status: "AUCTION_COMMIT",
        createdAt: "Yesterday, 10:00 AM",
        currentPotINR: 25000,
        members: [
          {
            address: "0x71C8F21c83B386f786f4a3E0b90494F3c419392B",
            name: "Arjun Kumar",
            email: "arjun@example.com",
            joinedAt: "Yesterday, 10:05 AM",
            hasPaidContribution: true,
            hasCommittedBid: false,
            hasRevealedBid: false,
            hasWon: false,
            isCreator: true,
          },
          {
            address: "0x39A88F110B74f5ea0ba39494ce839613fffba742",
            name: "Priya Sharma",
            email: "priya@example.com",
            joinedAt: "Yesterday, 10:15 AM",
            hasPaidContribution: true,
            hasCommittedBid: false,
            hasRevealedBid: false,
            hasWon: false,
          },
          {
            address: "0x91F221A378D33B037A6668fOd128c4BBA28bb659",
            name: "Rahul N",
            email: "rahul@example.com",
            joinedAt: "Yesterday, 10:30 AM",
            hasPaidContribution: true,
            hasCommittedBid: false,
            hasRevealedBid: false,
            hasWon: false,
          },
          {
            address: "0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
            name: "Ananya Rao",
            email: "ananya@example.com",
            joinedAt: "Yesterday, 11:00 AM",
            hasPaidContribution: true,
            hasCommittedBid: false,
            hasRevealedBid: false,
            hasWon: false,
          },
          {
            address: "0xb794f5ea0ba39494ce839613fffba74279579268",
            name: "Vikram Patel",
            email: "vikram@example.com",
            joinedAt: "Yesterday, 11:20 AM",
            hasPaidContribution: true,
            hasCommittedBid: false,
            hasRevealedBid: false,
            hasWon: false,
          },
        ],
        invitations: [],
        auditTrail: [
          {
            id: "ev-1",
            eventName: "CircleCreated",
            actor: "0x71C8F21c83B386f786f4a3E0b90494F3c419392B",
            description: "ChitGroup deployed to MST Testnet (Chain ID 91562037)",
            timestamp: "Yesterday, 10:00 AM",
            txHash: "0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
          },
          {
            id: "ev-2",
            eventName: "AllMembersJoined",
            actor: "Community",
            description: "All 5 members joined and deposited refundable security buffers",
            timestamp: "Yesterday, 11:20 AM",
            txHash: "0x77d88c9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
          },
          {
            id: "ev-3",
            eventName: "RoundContributionsCollected",
            actor: "ChitGroup Contract",
            description: "Round 1 contributions collected. Gross pot: ₹25,000 (25.0 tMSTC)",
            timestamp: "Today, 09:00 AM",
            txHash: "0x31a04b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a",
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
        currentRound: 2,
        totalRounds: 4,
        status: "COLLECTING",
        createdAt: "3 days ago",
        currentPotINR: 40000,
        members: [
          {
            address: "0x39A88F110B74f5ea0ba39494ce839613fffba742",
            name: "Priya Sharma",
            joinedAt: "3 days ago",
            hasPaidContribution: true,
            hasCommittedBid: false,
            hasRevealedBid: false,
            hasWon: true,
            winRound: 1,
            isCreator: true,
          },
          {
            address: "0x71C8F21c83B386f786f4a3E0b90494F3c419392B",
            name: "Arjun Kumar",
            joinedAt: "3 days ago",
            hasPaidContribution: true,
            hasCommittedBid: false,
            hasRevealedBid: false,
            hasWon: false,
          },
          {
            address: "0x91F221A378D33B037A6668fOd128c4BBA28bb659",
            name: "Rahul N",
            joinedAt: "3 days ago",
            hasPaidContribution: false,
            hasCommittedBid: false,
            hasRevealedBid: false,
            hasWon: false,
          },
          {
            address: "0x58f91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
            name: "Ananya Rao",
            joinedAt: "3 days ago",
            hasPaidContribution: true,
            hasCommittedBid: false,
            hasRevealedBid: false,
            hasWon: false,
          },
        ],
        invitations: [],
        auditTrail: [
          {
            id: "ev-b1",
            eventName: "AuctionSettled",
            actor: "0x39A88F110B74f5ea0ba39494ce839613fffba742",
            description: "Round 1 pot paid to Priya Sharma at ₹34,000 (₹6,000 dividend distributed)",
            timestamp: "Yesterday, 02:45 PM",
            txHash: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
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
   * Create a new circle starting with 0 members and status WAITING_FOR_MEMBERS
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
      members: [], // Starts strictly with 0 members!
      invitations: [],
      isCustomCircle: true,
      auditTrail: [
        {
          id: `audit-${Date.now()}-1`,
          eventName: "CircleCreated",
          actor: params.creatorAddress || "Organizer",
          description: `Savings circle "${params.name}" created. Contract initialized at ${address.substring(0, 10)}... (0/${params.memberCount} members)`,
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
   * Send invitations to selected users
   */
  public static sendInvitations(
    circleAddressOrId: string,
    usersToInvite: DemoUser[]
  ): CircleData | null {
    const circles = this.getAllCircles();
    const idx = circles.findIndex(
      (c) =>
        c.id.toLowerCase() === circleAddressOrId.toLowerCase() ||
        c.address.toLowerCase() === circleAddressOrId.toLowerCase()
    );
    if (idx === -1) return null;

    const circle = { ...circles[idx] };
    const currentMemberAddresses = new Set(circle.members.map((m) => m.address.toLowerCase()));
    const alreadyInvitedIds = new Set(circle.invitations.map((i) => i.userId));

    const remainingSlots = circle.memberCount - circle.members.length;
    const validInvites = usersToInvite
      .filter((u) => !currentMemberAddresses.has(u.address.toLowerCase()) && !alreadyInvitedIds.has(u.id))
      .slice(0, remainingSlots);

    if (validInvites.length === 0) return circle;

    const newInvitations: CircleInvitation[] = validInvites.map((u) => ({
      id: `inv-${Date.now()}-${u.id}`,
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      userAddress: u.address,
      sentAt: "Just now",
      status: "PENDING",
    }));

    circle.invitations = [...circle.invitations, ...newInvitations];
    circle.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      eventName: "InvitationsSent",
      actor: "Organizer",
      description: `Sent invitations to ${validInvites.length} participants (${validInvites.map((u) => u.name).join(", ")})`,
      timestamp: "Just now",
      isSimulated: true,
    });

    circles[idx] = circle;
    this.saveCircles(circles);
    return circle;
  }

  /**
   * Accept an invitation and join as a member
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
      address: inv.userAddress,
      name: inv.userName,
      email: inv.userEmail,
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
      actor: inv.userName,
      description: `${inv.userName} (${inv.userAddress.substring(0, 8)}...) accepted invitation and deposited security buffer`,
      timestamp: "Just now",
      txHash,
      isSimulated: !txHash,
    });

    // Check if circle is now full
    if (circle.members.length >= circle.memberCount) {
      circle.status = "READY";
      circle.auditTrail.unshift({
        id: `audit-ready-${Date.now()}`,
        eventName: "CircleReady",
        actor: "Protocol",
        description: `Circle reached full capacity (${circle.memberCount}/${circle.memberCount} members). Ready for Round 1.`,
        timestamp: "Just now",
        isSimulated: true,
      });
    }

    circles[idx] = circle;
    this.saveCircles(circles);
    return circle;
  }

  /**
   * Fast-forward: Accept all pending invitations to quickly fill the circle
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
          address: inv.userAddress,
          name: inv.userName,
          email: inv.userEmail,
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
      description: `${pending.length} invited members joined the savings circle.`,
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
      description: `Round ${circle.currentRound} contribution period opened. Dues: ₹${circle.installmentAmountINR.toLocaleString("en-IN")} / member`,
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

    // Mark other demo members paid as well if they are simulating
    circle.members.forEach((m) => {
      m.hasPaidContribution = true;
    });

    circle.status = "AUCTION_COMMIT";
    circle.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      eventName: "InstallmentPaid",
      actor: member ? member.name : memberAddress.substring(0, 8),
      description: `Monthly contribution of ₹${circle.installmentAmountINR.toLocaleString("en-IN")} confirmed. Round 1 collection complete.`,
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

    // Set stage to reveal
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
    circle.winnerAddress = winner ? winner.address : "0x71C8F21c83B386f786f4a3E0b90494F3c419392B";
    circle.winnerName = winner ? winner.name : "Arjun Kumar";
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
      description: `Round ${circle.currentRound} settled: ${circle.winnerName} received ₹${payout.toLocaleString("en-IN")}. Total discount of ₹${totalDiscount.toLocaleString("en-IN")} credited as ₹${dividendPerMember.toLocaleString("en-IN")} savings dividend per member.`,
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

      // Reset round payment states
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
        description: `Advanced to Round ${circle.currentRound} of ${circle.totalRounds}. Contribution period started.`,
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
