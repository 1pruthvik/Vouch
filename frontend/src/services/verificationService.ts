import { API_URL } from "../config/network";

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
  minWalletAmt?: string;
  createdAt: number;
}

const STORAGE_CIRCLES_KEY = "vouch_registered_circles";
const STORAGE_REQUESTS_KEY = "vouch_circle_join_requests";

export class VerificationService {
  // 1. Register a new circle created by an initializer
  public static async registerCircle(entry: CircleRegistryEntry): Promise<void> {
    // 1. Local storage cache
    const circles = this.getAllCircles();
    const existingIndex = circles.findIndex(
      (c) => c.address.toLowerCase() === entry.address.toLowerCase()
    );
    if (existingIndex >= 0) {
      circles[existingIndex] = { ...circles[existingIndex], ...entry };
    } else {
      circles.unshift(entry);
    }
    try {
      localStorage.setItem(STORAGE_CIRCLES_KEY, JSON.stringify(circles));
    } catch {}

    // 2. Persist to central Backend database (shared across all browsers / devices / incognito)
    try {
      await fetch(`${API_URL}/circles/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    } catch (err) {
      console.warn("Backend circle registration sync error (offline fallback used):", err);
    }
  }

  // 2. Get all known registered circles (local cache)
  public static getAllCircles(): CircleRegistryEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_CIRCLES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // 3. Fetch all circles from backend
  public static async fetchAllCircles(): Promise<CircleRegistryEntry[]> {
    try {
      const res = await fetch(`${API_URL}/circles`);
      if (res.ok) {
        const circles: CircleRegistryEntry[] = await res.json();
        if (Array.isArray(circles) && circles.length > 0) {
          localStorage.setItem(STORAGE_CIRCLES_KEY, JSON.stringify(circles));
          return circles;
        }
      }
    } catch (err) {
      console.warn("Backend fetchAllCircles error:", err);
    }
    return this.getAllCircles();
  }

  // 4. Get circle by address / ID
  public static getCircle(address: string): CircleRegistryEntry | null {
    if (!address) return null;
    const circles = this.getAllCircles();
    return (
      circles.find((c) => c.address.toLowerCase() === address.toLowerCase()) ||
      null
    );
  }

  // 5. Fetch single circle from backend
  public static async fetchCircle(address: string): Promise<CircleRegistryEntry | null> {
    if (!address) return null;
    try {
      const res = await fetch(`${API_URL}/circles/${address.toLowerCase()}`);
      if (res.ok) {
        const circle: CircleRegistryEntry = await res.json();
        if (circle && circle.address) {
          this.registerCircle(circle).catch(() => {});
          return circle;
        }
      }
    } catch (err) {
      console.warn("Backend fetchCircle error:", err);
    }
    return this.getCircle(address);
  }

  // 6. Get circles initialized by a specific wallet
  public static getCirclesByInitializer(
    initializerAddress: string
  ): CircleRegistryEntry[] {
    if (!initializerAddress) return [];
    const circles = this.getAllCircles();
    return circles.filter(
      (c) => c.initializer.toLowerCase() === initializerAddress.toLowerCase()
    );
  }

  // 7. Fetch circles initialized by a specific wallet from backend
  public static async fetchCirclesByInitializer(
    initializerAddress: string
  ): Promise<CircleRegistryEntry[]> {
    if (!initializerAddress) return [];
    try {
      const res = await fetch(`${API_URL}/circles/initializer/${initializerAddress.toLowerCase()}`);
      if (res.ok) {
        const list: CircleRegistryEntry[] = await res.json();
        if (Array.isArray(list)) {
          return list;
        }
      }
    } catch (err) {
      console.warn("Backend fetchCirclesByInitializer error:", err);
    }
    return this.getCirclesByInitializer(initializerAddress);
  }

  // 8. Submit a join request from an applicant
  public static async submitJoinRequest(
    circleAddress: string,
    applicantAddress: string,
    applicantName?: string
  ): Promise<JoinRequest> {
    const cleanCircle = circleAddress.toLowerCase();
    const cleanApplicant = applicantAddress.toLowerCase();

    // Local cache update
    const requests = this.getAllRequests();
    const existing = requests.find(
      (r) =>
        r.circleAddress.toLowerCase() === cleanCircle &&
        r.applicantAddress.toLowerCase() === cleanApplicant
    );

    let currentReq = existing;
    if (!currentReq) {
      currentReq = {
        id: `${cleanCircle}_${cleanApplicant}`,
        circleAddress: cleanCircle,
        applicantAddress: cleanApplicant,
        applicantName: applicantName || `Member (${applicantAddress.substring(0, 6)}...)`,
        requestedAt: Date.now(),
        status: "pending",
      };
      requests.unshift(currentReq);
      try {
        localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
      } catch {}
    }

    // Persist to central Backend database
    try {
      const res = await fetch(`${API_URL}/circles/${cleanCircle}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantAddress: cleanApplicant,
          applicantName: currentReq.applicantName,
        }),
      });
      if (res.ok) {
        const backendReq = await res.json();
        if (backendReq && backendReq.status) {
          return backendReq;
        }
      }
    } catch (err) {
      console.warn("Backend submitJoinRequest error (offline fallback used):", err);
    }

    return currentReq;
  }

  // 9. Get all requests (local cache)
  public static getAllRequests(): JoinRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_REQUESTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // 10. Get requests for a specific circle (local cache)
  public static getRequestsForCircle(circleAddress: string): JoinRequest[] {
    if (!circleAddress) return [];
    const requests = this.getAllRequests();
    return requests.filter(
      (r) => r.circleAddress.toLowerCase() === circleAddress.toLowerCase()
    );
  }

  // 11. Fetch requests for a specific circle from backend
  public static async fetchRequestsForCircle(circleAddress: string): Promise<JoinRequest[]> {
    if (!circleAddress) return [];
    try {
      const res = await fetch(`${API_URL}/circles/${circleAddress.toLowerCase()}/requests`);
      if (res.ok) {
        const list: JoinRequest[] = await res.json();
        if (Array.isArray(list)) {
          // Merge into local cache
          const current = this.getAllRequests().filter(
            (r) => r.circleAddress.toLowerCase() !== circleAddress.toLowerCase()
          );
          const merged = [...list, ...current];
          try {
            localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(merged));
          } catch {}
          return list;
        }
      }
    } catch (err) {
      console.warn("Backend fetchRequestsForCircle error:", err);
    }
    return this.getRequestsForCircle(circleAddress);
  }

  // 12. Get specific applicant's status for a circle (local cache)
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

  // 13. Fetch specific applicant's status from backend
  public static async fetchApplicantStatus(
    circleAddress: string,
    applicantAddress: string
  ): Promise<"pending" | "verified" | "rejected" | "none"> {
    if (!circleAddress || !applicantAddress) return "none";
    try {
      const res = await fetch(
        `${API_URL}/circles/${circleAddress.toLowerCase()}/requests/${applicantAddress.toLowerCase()}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.status) {
          // Sync to local
          const reqs = this.getAllRequests();
          const target = reqs.find(
            (r) =>
              r.circleAddress.toLowerCase() === circleAddress.toLowerCase() &&
              r.applicantAddress.toLowerCase() === applicantAddress.toLowerCase()
          );
          if (target) {
            target.status = data.status;
          } else if (data.status !== "none") {
            reqs.unshift(data);
          }
          try {
            localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(reqs));
          } catch {}
          return data.status;
        }
      }
    } catch (err) {
      console.warn("Backend fetchApplicantStatus error:", err);
    }
    return this.getApplicantStatus(circleAddress, applicantAddress);
  }

  // 14. Initializer verifies (approves) an applicant
  public static async verifyApplicant(
    circleAddress: string,
    applicantAddress: string
  ): Promise<void> {
    const cleanCircle = circleAddress.toLowerCase();
    const cleanApplicant = applicantAddress.toLowerCase();

    // Local update
    const requests = this.getAllRequests();
    const target = requests.find(
      (r) =>
        r.circleAddress.toLowerCase() === cleanCircle &&
        r.applicantAddress.toLowerCase() === cleanApplicant
    );

    if (target) {
      target.status = "verified";
    } else {
      requests.unshift({
        id: `${cleanCircle}_${cleanApplicant}`,
        circleAddress: cleanCircle,
        applicantAddress: cleanApplicant,
        requestedAt: Date.now(),
        status: "verified",
      });
    }
    try {
      localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
    } catch {}

    // Persist to central Backend database
    try {
      await fetch(
        `${API_URL}/circles/${cleanCircle}/requests/${cleanApplicant}/verify`,
        { method: "POST" }
      );
    } catch (err) {
      console.warn("Backend verifyApplicant error:", err);
    }
  }

  // 15. Initializer rejects an applicant
  public static async rejectApplicant(
    circleAddress: string,
    applicantAddress: string
  ): Promise<void> {
    const cleanCircle = circleAddress.toLowerCase();
    const cleanApplicant = applicantAddress.toLowerCase();

    // Local update
    const requests = this.getAllRequests();
    const target = requests.find(
      (r) =>
        r.circleAddress.toLowerCase() === cleanCircle &&
        r.applicantAddress.toLowerCase() === cleanApplicant
    );

    if (target) {
      target.status = "rejected";
    } else {
      requests.unshift({
        id: `${cleanCircle}_${cleanApplicant}`,
        circleAddress: cleanCircle,
        applicantAddress: cleanApplicant,
        requestedAt: Date.now(),
        status: "rejected",
      });
    }
    try {
      localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
    } catch {}

    // Persist to central Backend database
    try {
      await fetch(
        `${API_URL}/circles/${cleanCircle}/requests/${cleanApplicant}/reject`,
        { method: "POST" }
      );
    } catch (err) {
      console.warn("Backend rejectApplicant error:", err);
    }
  }

  // 16. Check if a member is in the Allowed IDs list for this circle
  public static async fetchIsMemberAllowed(
    circleAddress: string,
    memberAddress: string
  ): Promise<boolean> {
    if (!circleAddress || !memberAddress) return false;
    const cleanCircle = circleAddress.toLowerCase();
    const cleanMember = memberAddress.toLowerCase();

    // Check local circle registry if initializer
    const circle = this.getCircle(cleanCircle);
    if (circle && circle.initializer && circle.initializer.toLowerCase() === cleanMember) {
      return true;
    }

    // Check local verified requests
    const status = this.getApplicantStatus(cleanCircle, cleanMember);
    if (status === "verified") return true;

    // Fetch from backend
    try {
      const res = await fetch(`${API_URL}/circles/${cleanCircle}/allowed/${cleanMember}`);
      if (res.ok) {
        const data = await res.json();
        return !!data.isAllowed;
      }
    } catch (err) {
      console.warn("Backend fetchIsMemberAllowed error:", err);
    }
    return false;
  }

  // 17. Fetch all allowed member IDs for a circle
  public static async fetchAllowedMembers(circleAddress: string): Promise<string[]> {
    if (!circleAddress) return [];
    const cleanCircle = circleAddress.toLowerCase();
    try {
      const res = await fetch(`${API_URL}/circles/${cleanCircle}/allowed`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.allowedMembers)) {
          return data.allowedMembers;
        }
      }
    } catch (err) {
      console.warn("Backend fetchAllowedMembers error:", err);
    }
    const circle = this.getCircle(cleanCircle);
    const verifiedReqs = this.getRequestsForCircle(cleanCircle)
      .filter((r) => r.status === "verified")
      .map((r) => r.applicantAddress.toLowerCase());
    if (circle && circle.initializer) {
      verifiedReqs.unshift(circle.initializer.toLowerCase());
    }
    return Array.from(new Set(verifiedReqs));
  }

  // 18. Initializer directly adds a member's public key to the Allowed list
  public static async addAllowedMember(
    circleAddress: string,
    memberAddress: string,
    addedBy: string = ""
  ): Promise<void> {
    if (!circleAddress || !memberAddress) return;
    const cleanCircle = circleAddress.toLowerCase();
    const cleanMember = memberAddress.toLowerCase();

    // Local update
    this.verifyApplicant(cleanCircle, cleanMember).catch(() => {});

    // Backend persist
    try {
      await fetch(`${API_URL}/circles/${cleanCircle}/allowed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberAddress: cleanMember, addedBy }),
      });
    } catch (err) {
      console.warn("Backend addAllowedMember error:", err);
    }
  }

  // 19. Initializer removes a member's public key from Allowed list
  public static async removeAllowedMember(
    circleAddress: string,
    memberAddress: string
  ): Promise<void> {
    if (!circleAddress || !memberAddress) return;
    const cleanCircle = circleAddress.toLowerCase();
    const cleanMember = memberAddress.toLowerCase();

    try {
      await fetch(`${API_URL}/circles/${cleanCircle}/allowed/${cleanMember}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Backend removeAllowedMember error:", err);
    }
  }

  // 20. Initializer deletes a circle completely
  public static async deleteCircle(circleAddress: string): Promise<void> {
    if (!circleAddress) return;
    const cleanCircle = circleAddress.toLowerCase();

    // 1. Local cache cleanup
    try {
      const circles = this.getAllCircles().filter(
        (c) => c.address.toLowerCase() !== cleanCircle
      );
      localStorage.setItem(STORAGE_CIRCLES_KEY, JSON.stringify(circles));

      const requests = this.getAllRequests().filter(
        (r) => r.circleAddress.toLowerCase() !== cleanCircle
      );
      localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));

      const custom = JSON.parse(localStorage.getItem("vouch_custom_groups") || "[]").filter(
        (g: any) => (g.address || "").toLowerCase() !== cleanCircle
      );
      localStorage.setItem("vouch_custom_groups", JSON.stringify(custom));
    } catch {}

    // 2. Backend cleanup
    try {
      await fetch(`${API_URL}/circles/${cleanCircle}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Backend deleteCircle error:", err);
    }
  }
}
