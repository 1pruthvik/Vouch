import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GroupDetails, MemberDetails } from "../services/contractService";
import {
  Users,
  Coins,
  Gavel,
  CheckCircle2,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  Send,
  Zap,
  Eye,
  TrendingDown,
  Layers,
  Box,
} from "lucide-react";

export interface MemberNode3D {
  id: string;
  name: string;
  address: string;
  blockNumber: number;
  hash: string;
  stakedCollateral: string;
  monthlyDues: string;
  hasPaidThisMonth: boolean;
  paidTxHash?: string;
  paidTimestamp?: string;
  color: number;
  colorHex: string;
  isCurrentUser?: boolean;
  angle: number; // Angle around center
}

export interface BidBlock3D {
  id: string;
  roundNumber: number;
  blockNumber: number;
  bidderId: string;
  bidderName: string;
  bidderAddress: string;
  bidAmount: number;
  dividendSavings: number;
  timestamp: string;
  isCurrentBest: boolean;
  spawnTime: number; // For 3-time blink timing
}

const INITIAL_MEMBERS_3D: MemberNode3D[] = [
  {
    id: "m-1",
    name: "Alice",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    blockNumber: 10421,
    hash: "0x8fa1...9b2a",
    stakedCollateral: "1.50 tMSTC",
    monthlyDues: "1.00",
    hasPaidThisMonth: false,
    color: 0x10b981,
    colorHex: "#10b981",
    angle: (0 * 2 * Math.PI) / 5,
  },
  {
    id: "m-2",
    name: "Bob",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    blockNumber: 10422,
    hash: "0x72c4...e13d",
    stakedCollateral: "1.50 tMSTC",
    monthlyDues: "1.00",
    hasPaidThisMonth: false,
    color: 0x6366f1,
    colorHex: "#6366f1",
    angle: (1 * 2 * Math.PI) / 5,
  },
  {
    id: "m-3",
    name: "Charlie",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    blockNumber: 10423,
    hash: "0x33e8...6ca2",
    stakedCollateral: "1.50 tMSTC",
    monthlyDues: "1.00",
    hasPaidThisMonth: false,
    color: 0xec4899,
    colorHex: "#ec4899",
    angle: (2 * 2 * Math.PI) / 5,
  },
  {
    id: "m-4",
    name: "Dave",
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    blockNumber: 10424,
    hash: "0x4b91...71ef",
    stakedCollateral: "1.50 tMSTC",
    monthlyDues: "1.00",
    hasPaidThisMonth: false,
    color: 0xf59e0b,
    colorHex: "#f59e0b",
    angle: (3 * 2 * Math.PI) / 5,
  },
  {
    id: "m-5",
    name: "You (Connected)",
    address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    blockNumber: 10425,
    hash: "0x1c80...a47f",
    stakedCollateral: "1.50 tMSTC",
    monthlyDues: "1.00",
    hasPaidThisMonth: false,
    color: 0x06b6d4,
    colorHex: "#06b6d4",
    isCurrentUser: true,
    angle: (4 * 2 * Math.PI) / 5,
  },
];

export interface BlockchainNetwork3DProps {
  currentAccount?: string | null;
  groupDetails?: GroupDetails | null;
  memberDetails?: MemberDetails | null;
  onPayDues?: (amount?: string) => Promise<void>;
  onCommitBid?: (bidAmount: string, salt?: string) => Promise<void>;
  onToggleViewMode?: () => void;
}

export const BlockchainNetwork3D: React.FC<BlockchainNetwork3DProps> = ({
  currentAccount,
  groupDetails,
  memberDetails,
  onPayDues,
  onCommitBid,
  onToggleViewMode,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // React state
  const [members, setMembers] = useState<MemberNode3D[]>(INITIAL_MEMBERS_3D);
  const currentRound = groupDetails?.currentRound || 3;
  const targetPot = groupDetails
    ? Number((groupDetails.memberCount * parseFloat(groupDetails.installmentAmount || "1.0")).toFixed(2))
    : 5.0;

  const [bids, setBids] = useState<BidBlock3D[]>([]);
  const [customBidderId, setCustomBidderId] = useState<string>("m-1");
  const [customBidAmount, setCustomBidAmount] = useState<string>("4.80");
  const [isSimulatingAuction, setIsSimulatingAuction] = useState<boolean>(false);
  const [isSimulatingPayments, setIsSimulatingPayments] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const memberMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const bidMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const poolVaultMeshRef = useRef<THREE.Group | null>(null);
  const networkLinesRef = useRef<THREE.LineSegments | null>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);

  // State refs for animation loop
  const membersStateRef = useRef<MemberNode3D[]>(members);
  membersStateRef.current = members;
  const bidsStateRef = useRef<BidBlock3D[]>(bids);
  bidsStateRef.current = bids;

  const paidMembers = members.filter((m) => m.hasPaidThisMonth);
  const currentPoolAmount = groupDetails && groupDetails.currentPot && parseFloat(groupDetails.currentPot) > 0
    ? parseFloat(groupDetails.currentPot)
    : paidMembers.length * (groupDetails ? parseFloat(groupDetails.installmentAmount) : 1.0);

  // Sync on-chain groupDetails if provided
  useEffect(() => {
    if (groupDetails && groupDetails.members && groupDetails.members.length > 0) {
      const colors = [0x10b981, 0x6366f1, 0xec4899, 0xf59e0b, 0x06b6d4, 0x3b82f6, 0xa855f7];
      const colorHexes = ["#10b981", "#6366f1", "#ec4899", "#f59e0b", "#06b6d4", "#3b82f6", "#a855f7"];
      const count = groupDetails.members.length;
      const mapped: MemberNode3D[] = groupDetails.members.map((addr, idx) => {
        const isMe = Boolean(currentAccount && addr.toLowerCase() === currentAccount.toLowerCase());
        const hasPaid = memberDetails && isMe ? memberDetails.paidInstallments >= currentRound : false;
        return {
          id: `member-${idx}`,
          name: isMe ? "You (Connected)" : `Member #${idx + 1}`,
          address: addr,
          blockNumber: 10420 + idx,
          hash: addr.substring(0, 6) + "..." + addr.substring(addr.length - 4),
          stakedCollateral: `${groupDetails.installmentAmount} tMSTC`,
          monthlyDues: groupDetails.installmentAmount,
          hasPaidThisMonth: hasPaid,
          color: colors[idx % colors.length],
          colorHex: colorHexes[idx % colorHexes.length],
          isCurrentUser: isMe,
          angle: (idx * 2 * Math.PI) / count,
        };
      });
      setMembers(mapped);
      if (mapped.length > 0) {
        setCustomBidderId(mapped[0].id);
      }
    }
  }, [groupDetails, currentAccount, memberDetails, currentRound]);

  // 1. Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = 520;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x08090c, 0.022);

    // Camera
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 11, 19);

    // Renderer (Optimized for Integrated GPU)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 32;
    controls.minDistance = 6;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.8;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x10b981, 2.0);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    const vaultPointLight = new THREE.PointLight(0xf59e0b, 3.5, 18);
    vaultPointLight.position.set(0, 1.2, 0);
    scene.add(vaultPointLight);

    // Sci-Fi Floor Grid
    const gridHelper = new THREE.GridHelper(26, 26, 0x10b981, 0x1c2029);
    gridHelper.position.y = -1.5;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.28;
    scene.add(gridHelper);

    // Floor Glowing Ring
    const ringGeo = new THREE.RingGeometry(7.2, 7.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const floorRing = new THREE.Mesh(ringGeo, ringMat);
    floorRing.rotation.x = Math.PI / 2;
    floorRing.position.y = -1.48;
    scene.add(floorRing);

    // 2. Central 3D Monthly Pool Vault
    const vaultGroup = new THREE.Group();
    poolVaultMeshRef.current = vaultGroup;

    // Inner Vault Cube
    const cubeGeo = new THREE.BoxGeometry(2.3, 2.3, 2.3);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.85,
      emissive: 0x10b981,
      emissiveIntensity: 0.5,
    });
    const vaultCube = new THREE.Mesh(cubeGeo, cubeMat);
    vaultCube.name = "vaultCube";
    vaultGroup.add(vaultCube);

    // Glowing Edges
    const edgesGeo = new THREE.EdgesGeometry(cubeGeo);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
    const vaultEdges = new THREE.LineSegments(edgesGeo, edgesMat);
    vaultGroup.add(vaultEdges);

    // Orbital Energy Rings around the Vault
    ringsRef.current = [];
    for (let r = 0; r < 2; r++) {
      const torusGeo = new THREE.TorusGeometry(2.0 + r * 0.45, 0.045, 12, 48);
      const torusMat = new THREE.MeshBasicMaterial({
        color: r === 0 ? 0xf59e0b : 0x34d399,
        transparent: true,
        opacity: 0.85,
      });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.rotation.x = (r + 1) * 0.7;
      torus.rotation.y = (r + 1) * 0.4;
      vaultGroup.add(torus);
      ringsRef.current.push(torus);
    }

    vaultGroup.position.set(0, 0.5, 0);
    scene.add(vaultGroup);

    // 3. Build 3D Member Blocks
    const radius = 7.2;
    INITIAL_MEMBERS_3D.forEach((member) => {
      const memberGroup = new THREE.Group();
      const x = Math.cos(member.angle) * radius;
      const z = Math.sin(member.angle) * radius;
      memberGroup.position.set(x, 0.5, z);

      // 3D Block Mesh
      const nodeGeo = new THREE.BoxGeometry(1.6, 1.4, 1.4);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: 0x11141d,
        roughness: 0.3,
        metalness: 0.7,
        emissive: member.color,
        emissiveIntensity: 0.5,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.name = `node-${member.id}`;
      memberGroup.add(nodeMesh);

      // Block Wireframe Edge
      const nodeEdgesGeo = new THREE.EdgesGeometry(nodeGeo);
      const nodeEdgesMat = new THREE.LineBasicMaterial({
        color: member.color,
      });
      const nodeEdges = new THREE.LineSegments(nodeEdgesGeo, nodeEdgesMat);
      nodeEdges.name = "edges";
      memberGroup.add(nodeEdges);

      // Base pedestal glow
      const baseGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16);
      const baseMat = new THREE.MeshBasicMaterial({
        color: member.color,
        transparent: true,
        opacity: 0.4,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = -0.8;
      memberGroup.add(baseMesh);

      scene.add(memberGroup);
      memberMeshesRef.current.set(member.id, memberGroup);
    });

    // 4. Mesh Connection Lines
    const linePositions: number[] = [];
    const membersList = INITIAL_MEMBERS_3D;
    for (let i = 0; i < membersList.length; i++) {
      const x1 = Math.cos(membersList[i].angle) * radius;
      const z1 = Math.sin(membersList[i].angle) * radius;

      const nextIdx = (i + 1) % membersList.length;
      const x2 = Math.cos(membersList[nextIdx].angle) * radius;
      const z2 = Math.sin(membersList[nextIdx].angle) * radius;

      linePositions.push(x1, 0.5, z1, x2, 0.5, z2);
      linePositions.push(x1, 0.5, z1, 0, 0.5, 0);

      const crossIdx = (i + 2) % membersList.length;
      const x3 = Math.cos(membersList[crossIdx].angle) * radius;
      const z3 = Math.sin(membersList[crossIdx].angle) * radius;
      linePositions.push(x1, 0.5, z1, x3, 0.5, z3);
    }

    const netLineGeo = new THREE.BufferGeometry();
    netLineGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(linePositions, 3)
    );
    const netLineMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.5,
    });
    const networkLines = new THREE.LineSegments(netLineGeo, netLineMat);
    networkLinesRef.current = networkLines;
    scene.add(networkLines);

    // 5. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      controls.update();

      if (vaultGroup) {
        vaultGroup.rotation.y = elapsedTime * 0.4;
        ringsRef.current.forEach((ring, idx) => {
          ring.rotation.z = elapsedTime * (0.8 + idx * 0.3);
          ring.rotation.x = elapsedTime * (0.5 - idx * 0.2);
        });
      }

      // Floating hover for Member Blocks
      memberMeshesRef.current.forEach((group, memberId) => {
        const member = membersStateRef.current.find((m) => m.id === memberId);
        if (member) {
          const floatOffset = Math.sin(elapsedTime * 2 + member.angle) * 0.12;
          group.position.y = 0.5 + floatOffset;

          const nodeMesh = group.getObjectByName(`node-${member.id}`) as THREE.Mesh;
          if (nodeMesh && nodeMesh.material) {
            const mat = nodeMesh.material as THREE.MeshStandardMaterial;
            if (member.hasPaidThisMonth) {
              mat.emissive.setHex(0x10b981);
              mat.emissiveIntensity = 0.9 + Math.sin(elapsedTime * 4) * 0.2;
            } else {
              mat.emissive.setHex(member.color);
              mat.emissiveIntensity = 0.5;
            }
          }
        }
      });

      // Animate 3D Bid Blocks (Blinking 3 times & dynamic scaling)
      const currentBids = bidsStateRef.current;
      bidMeshesRef.current.forEach((bidGroup, bidId) => {
        const bid = currentBids.find((b) => b.id === bidId);
        if (bid) {
          const age = elapsedTime - bid.spawnTime;
          const blockMesh = bidGroup.getObjectByName("bidBox") as THREE.Mesh;

          if (blockMesh && blockMesh.material) {
            const mat = blockMesh.material as THREE.MeshStandardMaterial;

            // 3-Time Blink Logic
            if (age < 2.0) {
              const blinkVal = Math.sin(age * Math.PI * 3);
              const isBlinkOn = blinkVal > 0;
              mat.emissiveIntensity = isBlinkOn ? 1.6 : 0.1;
              mat.emissive.setHex(0xf59e0b);
            } else {
              if (bid.isCurrentBest) {
                mat.emissive.setHex(0xf59e0b);
                mat.emissiveIntensity = 0.8 + Math.sin(elapsedTime * 3) * 0.2;
              } else {
                mat.emissive.setHex(0x475569);
                mat.emissiveIntensity = 0.2;
              }
            }
          }

          // Dynamic scale interpolation
          const targetScale = bid.isCurrentBest ? 1.35 : 0.7;
          bidGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 800;
      const h = 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Update 3D Bid Blocks in Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const activeIds = new Set(bids.map((b) => b.id));

    bidMeshesRef.current.forEach((group, id) => {
      if (!activeIds.has(id)) {
        scene.remove(group);
        bidMeshesRef.current.delete(id);
      }
    });

    bids.forEach((bid, index) => {
      let bidGroup = bidMeshesRef.current.get(bid.id);

      if (!bidGroup) {
        bidGroup = new THREE.Group();

        const boxGeo = new THREE.BoxGeometry(1.8, 1.2, 1.2);
        const boxMat = new THREE.MeshStandardMaterial({
          color: 0x141824,
          roughness: 0.25,
          metalness: 0.75,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.2,
        });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.name = "bidBox";
        bidGroup.add(boxMesh);

        const edgesGeo = new THREE.EdgesGeometry(boxGeo);
        const edgesMat = new THREE.LineBasicMaterial({
          color: 0xfbbf24,
        });
        const edges = new THREE.LineSegments(edgesGeo, edgesMat);
        bidGroup.add(edges);

        const crownGeo = new THREE.OctahedronGeometry(0.35);
        const crownMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.y = 1.0;
        crown.name = "crown";
        bidGroup.add(crown);

        bidGroup.scale.set(0.1, 0.1, 0.1);
        scene.add(bidGroup);
        bidMeshesRef.current.set(bid.id, bidGroup);
      }

      if (bid.isCurrentBest) {
        bidGroup.position.set(0, 3.6, 2.8);
      } else {
        const offsetIndex = index;
        const xPos = -4.5 + (offsetIndex % 4) * 3.0;
        const zPos = 4.2 + Math.floor(offsetIndex / 4) * 2.2;
        bidGroup.position.set(xPos, 2.2, zPos);
      }

      const crown = bidGroup.getObjectByName("crown");
      if (crown) {
        crown.visible = bid.isCurrentBest;
      }
    });
  }, [bids]);

  // Actions
  const handlePayMonthlyDues = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    if (onPayDues) {
      await onPayDues(member.monthlyDues);
    }

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId && !m.hasPaidThisMonth) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const pseudoHash = "0x" + Math.random().toString(16).substring(2, 10) + "...mst";
          return {
            ...m,
            hasPaidThisMonth: true,
            paidTxHash: pseudoHash,
            paidTimestamp: timeStr,
          };
        }
        return m;
      })
    );
  };

  const handleSimulateAllPayments = async () => {
    if (isSimulatingPayments) return;
    setIsSimulatingPayments(true);

    const unpaids = members.filter((m) => !m.hasPaidThisMonth);
    for (let i = 0; i < unpaids.length; i++) {
      const targetId = unpaids[i].id;
      await new Promise((res) => setTimeout(res, 600));
      await handlePayMonthlyDues(targetId);
    }

    setIsSimulatingPayments(false);
  };

  const handleReset = () => {
    setMembers(
      INITIAL_MEMBERS_3D.map((m) => ({
        ...m,
        hasPaidThisMonth: false,
        paidTxHash: undefined,
        paidTimestamp: undefined,
      }))
    );
    setBids([]);
  };

  const submitBid = async (bidderId: string, amount: number) => {
    const bidder = members.find((m) => m.id === bidderId);
    if (!bidder) return;

    const newBidId = `bid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dividend = Number((targetPot - amount).toFixed(2));
    const nowTimeSec = performance.now() / 1000;

    if (onCommitBid) {
      const salt = "0x" + Math.random().toString(16).substring(2, 66).padEnd(64, "0");
      await onCommitBid(amount.toString(), salt);
    }

    setBids((prev) => {
      const isBetter = prev.length === 0 || amount < prev[0].bidAmount;

      const newBlock: BidBlock3D = {
        id: newBidId,
        roundNumber: currentRound,
        blockNumber: 10450 + prev.length + 1,
        bidderId: bidder.id,
        bidderName: bidder.name,
        bidderAddress: bidder.address,
        bidAmount: amount,
        dividendSavings: dividend,
        timestamp: timeStr,
        isCurrentBest: isBetter,
        spawnTime: nowTimeSec,
      };

      const updatedPrev = isBetter
        ? prev.map((b) => ({ ...b, isCurrentBest: false }))
        : prev;

      return [newBlock, ...updatedPrev];
    });
  };

  const handleManualBid = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customBidAmount);
    if (isNaN(val) || val <= 0 || val > targetPot) {
      alert(`Please enter a valid bid between 0.1 and ${targetPot} tMSTC`);
      return;
    }
    submitBid(customBidderId, val);
  };

  const handleRunBiddingWarDemo = async () => {
    if (isSimulatingAuction) return;
    setIsSimulatingAuction(true);

    if (currentPoolAmount < targetPot) {
      for (const m of members) {
        if (!m.hasPaidThisMonth) {
          await handlePayMonthlyDues(m.id);
        }
      }
    }

    const demoSequence = [
      { bidderId: members[0]?.id || "m-1", amount: Number((targetPot * 0.95).toFixed(2)), delay: 500 },
      { bidderId: members[1]?.id || "m-2", amount: Number((targetPot * 0.90).toFixed(2)), delay: 2800 },
      { bidderId: members[2]?.id || "m-3", amount: Number((targetPot * 0.84).toFixed(2)), delay: 3000 },
      { bidderId: members[members.length - 1]?.id || "m-5", amount: Number((targetPot * 0.78).toFixed(2)), delay: 3000 },
    ];

    for (const step of demoSequence) {
      await new Promise((r) => setTimeout(r, step.delay));
      submitBid(step.bidderId, step.amount);
    }

    setIsSimulatingAuction(false);
  };

  return (
    <div className="space-y-6">
      {/* 3D WebGL Canvas Viewport Card */}
      <div className="cred-card overflow-hidden relative shadow-2xl border border-emerald-500/20">
        {/* Canvas HUD Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 bg-[#0c0e14]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold text-white text-xs font-display">
              3D WebGL Blockchain ROSCA Network
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              (Drag to Orbit • Scroll to Zoom)
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => setAutoRotate((prev) => !prev)}
              className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all ${
                autoRotate
                  ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400"
                  : "bg-black/60 border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {autoRotate ? "Auto-Rotate ON" : "Auto-Rotate OFF"}
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white border border-white/10 transition-colors"
              title="Reset Scene & Bids"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3D WebGL Canvas Container with guaranteed height */}
        <div
          ref={mountRef}
          style={{ minHeight: "520px", height: "520px" }}
          className="w-full bg-gradient-to-b from-[#08090c] via-[#0c0f17] to-[#08090c] cursor-grab active:cursor-grabbing"
        />

        {/* Floating 3D Legend & Center Vault Info Overlay */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <div className="bg-[#0c0e14]/95 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/30 shadow-2xl max-w-sm pointer-events-auto space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">3D Central Vault Pot:</span>
              <span className="font-bold text-amber-400 font-display text-base">
                {currentPoolAmount.toFixed(2)} / {targetPot.toFixed(2)} tMSTC
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-amber-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (currentPoolAmount / targetPot) * 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-emerald-400 font-medium">{paidMembers.length} / {members.length} Members Paid</span>
              {groupDetails && <span className="text-amber-400">Phase: {groupDetails.currentState}</span>}
            </div>
          </div>
        </div>

        {/* Floating Best Bid Pill on Canvas */}
        {bids.length > 0 && (
          <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
            <div className="bg-[#141208]/95 backdrop-blur-md p-4 rounded-2xl border border-amber-500/50 shadow-2xl max-w-xs pointer-events-auto">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold font-display">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>3D Winning Bid (Expanding & Blinking 3x)</span>
              </div>
              <p className="text-2xl font-black text-white font-display mt-0.5">
                {bids[0].bidAmount.toFixed(2)} <span className="text-xs text-slate-300 font-normal">tMSTC</span>
              </p>
              <p className="text-[11px] text-amber-200/90 mt-0.5">
                by {bids[0].bidderName} (+{bids[0].dividendSavings.toFixed(2)} dividend discount)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ACTION CONTROLS & HUD PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Pool Box & Member Status (5 Cols) */}
        <div className="lg:col-span-5 cred-card p-6 space-y-4 border border-white/5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white font-display">
                Monthly Pool Dues & Status
              </h3>
            </div>
            <button
              onClick={handleSimulateAllPayments}
              disabled={isSimulatingPayments || paidMembers.length === members.length}
              className="btn-cred-secondary text-xs py-1.5 px-3"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {isSimulatingPayments ? "Depositing..." : "Auto-Pay All"}
            </button>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {members.map((member) => {
              const isPaid = member.hasPaidThisMonth;
              return (
                <div
                  key={member.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between text-xs ${
                    isPaid
                      ? "bg-emerald-950/20 border-emerald-500/40"
                      : "bg-white/5 border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: member.colorHex }}
                    ></span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{member.name}</span>
                        {member.isCurrentUser && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {member.address.substring(0, 6)}...{member.address.substring(member.address.length - 4)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPaid ? (
                      <span className="badge-status-green px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Paid {member.monthlyDues}
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePayMonthlyDues(member.id)}
                        className="py-1 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition-all border border-emerald-500/30"
                      >
                        Pay {member.monthlyDues}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Bidding War Stream & 3-Time Blink Controls (7 Cols) */}
        <div className="lg:col-span-7 cred-card p-6 space-y-4 border border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  3D Reverse Auction Bidding
                </h3>
                <p className="text-[11px] text-slate-400">
                  New bids blink 3 times. Outbid blocks shrink in 3D; winning bids expand!
                </p>
              </div>
            </div>

            <button
              onClick={handleRunBiddingWarDemo}
              disabled={isSimulatingAuction}
              className="btn-cred-primary text-xs py-2 px-3.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              {isSimulatingAuction ? "Bidding War Running..." : "Run Bidding War Demo"}
            </button>
          </div>

          {/* Custom Bid Submission Form */}
          <form
            onSubmit={handleManualBid}
            className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-wrap items-center gap-3 text-xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Bidder:</span>
              <select
                value={customBidderId}
                onChange={(e) => setCustomBidderId(e.target.value)}
                className="bg-[#12151c] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Payout Bid (tMSTC):</span>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max={targetPot}
                value={customBidAmount}
                onChange={(e) => setCustomBidAmount(e.target.value)}
                className="w-20 bg-[#12151c] border border-white/10 rounded-lg px-2 py-1.5 text-white font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              className="btn-cred-secondary text-xs py-1.5 px-3.5 ml-auto"
            >
              <Send className="w-3 h-3" />
              Spawn 3D Bid Block
            </button>
          </form>

          {/* Chronological Bid Blocks Stream */}
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {bids.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-white/10 rounded-xl">
                <Gavel className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                No bids submitted yet. Click <strong>"Run Bidding War Demo"</strong> to watch the 3D blocks drop in, blink 3 times, shrink, and expand!
              </div>
            ) : (
              bids.map((bid) => {
                const isBest = bid.isCurrentBest;
                return (
                  <div
                    key={bid.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                      isBest
                        ? "bg-gradient-to-r from-amber-950/40 via-[#101217] to-emerald-950/30 border-amber-500/70 shadow-lg shadow-amber-500/10 scale-[1.01]"
                        : "bg-white/5 border-white/5 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{bid.bidderName}</span>
                        {isBest ? (
                          <span className="badge-status-yellow px-2 py-0.5 rounded text-[10px] font-bold">
                            ★ WINNING POT (1.35x)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Outbid (0.7x)</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {bid.timestamp} • BLOCK #{bid.blockNumber}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-black font-display text-sm ${
                          isBest ? "text-amber-300 text-base" : "text-slate-300"
                        }`}
                      >
                        {bid.bidAmount.toFixed(2)} tMSTC
                      </span>
                      <p className="text-[10px] text-emerald-400 font-medium">
                        +{bid.dividendSavings.toFixed(2)} dividend
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default BlockchainNetwork3D;
