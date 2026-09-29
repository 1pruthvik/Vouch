export interface JoinRequest {
  id: string;
  circleAddress: string;
  applicantAddress: string;
  applicantName?: string;
  requestedAt: number;
  status: "pending" | "verified" | "rejected";
}

export interface CircleRegistryEntry {
  address: string;
  name: string;
  memberCount: number;
  installmentAmount: string;
  cycleDuration?: number;
  initializer: string;
  createdAt: number;
}

const STORAGE_CIRCLES_KEY = "vouch_registered_circles";
const STORAGE_REQUESTS_KEY = "vouch_circle_join_requests";

export class VerificationService {
  // 1. Register a new circle created by an initializer
  public static registerCircle(entry: CircleRegistryEntry) {
    const circles = this.getAllCircles();
    const existingIndex = circles.findIndex(
      (c) => c.address.toLowerCase() === entry.address.toLowerCase()
    );
    if (existingIndex >= 0) {
      circles[existingIndex] = { ...circles[existingIndex], ...entry };
    } else {
      circles.unshift(entry);
    }
    localStorage.setItem(STORAGE_CIRCLES_KEY, JSON.stringify(circles));
  }

  // 2. Get all known registered circles
  public static getAllCircles(): CircleRegistryEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_CIRCLES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // 3. Get circle by address / ID
  public static getCircle(address: string): CircleRegistryEntry | null {
    if (!address) return null;
    const circles = this.getAllCircles();
    return (
      circles.find((c) => c.address.toLowerCase() === address.toLowerCase()) ||
      null
    );
  }

  // 4. Get circles initialized by a specific wallet
  public static getCirclesByInitializer(
    initializerAddress: string
  ): CircleRegistryEntry[] {
    if (!initializerAddress) return [];
    const circles = this.getAllCircles();
    return circles.filter(
      (c) => c.initializer.toLowerCase() === initializerAddress.toLowerCase()
    );
  }

  // 5. Submit a join request from an applicant
  public static submitJoinRequest(
    circleAddress: string,
    applicantAddress: string,
    applicantName?: string
  ): JoinRequest {
    const requests = this.getAllRequests();
    const cleanCircle = circleAddress.toLowerCase();
    const cleanApplicant = applicantAddress.toLowerCase();

    // Check if already exists
    const existing = requests.find(
      (r) =>
        r.circleAddress.toLowerCase() === cleanCircle &&
        r.applicantAddress.toLowerCase() === cleanApplicant
    );

    if (existing) {
      return existing;
    }

    const newRequest: JoinRequest = {
      id: `${cleanCircle}_${cleanApplicant}_${Date.now()}`,
      circleAddress,
      applicantAddress,
      applicantName: applicantName || `Member (${applicantAddress.substring(0, 6)}...)`,
      requestedAt: Date.now(),
      status: "pending",
    };

    requests.unshift(newRequest);
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
    return newRequest;
  }

  // 6. Get all requests
  public static getAllRequests(): JoinRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_REQUESTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // 7. Get requests for a specific circle
  public static getRequestsForCircle(circleAddress: string): JoinRequest[] {
    if (!circleAddress) return [];
    const requests = this.getAllRequests();
    return requests.filter(
      (r) => r.circleAddress.toLowerCase() === circleAddress.toLowerCase()
    );
  }

  // 8. Get specific applicant's status for a circle
  public static getApplicantStatus(
    circleAddress: string,
    applicantAddress: string
  ): "pending" | "verified" | "rejected" | "none" {
    if (!circleAddress || !applicantAddress) return "none";
    const requests = this.getAllRequests();
    const req = requests.find(
      (r) =>
        r.circleAddress.toLowerCase() === circleAddress.toLowerCase() &&
        r.applicantAddress.toLowerCase() === applicantAddress.toLowerCase()
    );
    return req ? req.status : "none";
  }

  // 9. Initializer verifies (approves) or rejects a join request
  public static setRequestStatus(
    requestId: string,
    status: "verified" | "rejected"
  ) {
    const requests = this.getAllRequests();
    const target = requests.find((r) => r.id === requestId);
    if (target) {
      target.status = status;
      localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
    }
  }

  // 10. Initializer verifies an applicant directly by address
  public static verifyApplicant(
    circleAddress: string,
    applicantAddress: string
  ) {
    const requests = this.getAllRequests();
    const cleanCircle = circleAddress.toLowerCase();
    const cleanApplicant = applicantAddress.toLowerCase();

    const target = requests.find(
      (r) =>
        r.circleAddress.toLowerCase() === cleanCircle &&
        r.applicantAddress.toLowerCase() === cleanApplicant
    );

    if (target) {
      target.status = "verified";
    } else {
      requests.unshift({
        id: `${cleanCircle}_${cleanApplicant}_${Date.now()}`,
        circleAddress,
        applicantAddress,
        requestedAt: Date.now(),
        status: "verified",
      });
    }
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
  }

  // 11. Initializer rejects an applicant
  public static rejectApplicant(
    circleAddress: string,
    applicantAddress: string
  ) {
    const requests = this.getAllRequests();
    const cleanCircle = circleAddress.toLowerCase();
    const cleanApplicant = applicantAddress.toLowerCase();

    const target = requests.find(
      (r) =>
        r.circleAddress.toLowerCase() === cleanCircle &&
        r.applicantAddress.toLowerCase() === cleanApplicant
    );

    if (target) {
      target.status = "rejected";
    } else {
      requests.unshift({
        id: `${cleanCircle}_${cleanApplicant}_${Date.now()}`,
        circleAddress,
        applicantAddress,
        requestedAt: Date.now(),
        status: "rejected",
      });
    }
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
  }
}
