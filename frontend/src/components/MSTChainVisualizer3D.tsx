import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Shield,
  Coins,
  Gavel,
  CheckCircle2,
  Lock,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  Eye,
  Key,
  Layers,
  Zap,
  ArrowRight,
  Clock,
  Check,
  Send,
  HelpCircle,
} from "lucide-react";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";
import { ethers } from "ethers";

export interface MSTChainVisualizer3DProps {
  circleAddress: string;
  circleName: string;
  memberCount: number;
  installmentAmount: string; // in tMSTC
  allowedMembers?: string[];
  currentAccount?: string;
  isInitializer?: boolean;
  onPayDues?: () => Promise<void>;
  onCommitBid?: (bidAmountMST: string, salt: string) => Promise<void>;
  onShowNotification?: (msg: string, isError?: boolean) => void;
}

export type LifecycleStage = "day1_pooling" | "day2_30_aave" | "day31_bidding" | "settlement_dividends";

interface NodeData {
  id: string;
  address: string;
  label: string;
  isCurrentUser: boolean;
  isInitializer: boolean;
  angle: number;
  hasPaid: boolean;
  mandateActive: boolean;
  secretBidAmount: number; // in tMSTC
  secretSalt: string;
  commitmentHash: string;
  dividendBalance: number;
  bufferBalance: number;
}

export const MSTChainVisualizer3D: React.FC<MSTChainVisualizer3DProps> = ({
  circleAddress,
  circleName,
  memberCount = 5,
  installmentAmount = "1.0",
  allowedMembers = [],
  currentAccount = "",
  isInitializer = false,
  onPayDues,
  onCommitBid,
  onShowNotification,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const installmentNum = parseFloat(installmentAmount) || 1.0;
  const totalPotNum = memberCount * installmentNum;
  const installmentINR = Math.round(installmentNum * MST_TO_INR_RATE);
  const totalPotINR = Math.round(totalPotNum * MST_TO_INR_RATE);

  // Active Stage
  const [activeStage, setActiveStage] = useState<LifecycleStage>("day1_pooling");
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);
  const [autoProgress, setAutoProgress] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  // Secret Bidding Form State
  const [userBidAmount, setUserBidAmount] = useState<string>((totalPotNum * 0.85).toFixed(2));
  const [userSalt, setUserSalt] = useState<string>(() => "0x" + Math.random().toString(16).substring(2, 10).padEnd(64, "0"));
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [revealedWinner, setRevealedWinner] = useState<NodeData | null>(null);

  // Live Simulated Metrics
  const aaveAPY = 5.82; // 5.82% APY
  const bitFeePercentage = 5; // 5% BIT cut

  // Build Member Nodes
  const nodes: NodeData[] = useMemo(() => {
    const list: NodeData[] = [];
    const count = Math.max(memberCount, 3);
    const cleanCurrent = (currentAccount || "").toLowerCase();

    // Default mock addresses if allowed list is shorter than memberCount
    const mockAddrs = [
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
      "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    ];

    for (let i = 0; i < count; i++) {
      let addr = allowedMembers[i] || mockAddrs[i % mockAddrs.length];
      if (i === 0 && cleanCurrent) {
        addr = currentAccount;
      }
      const isMe = Boolean(cleanCurrent && addr.toLowerCase() === cleanCurrent);
      const angle = (i / count) * Math.PI * 2;
      const bidAmt = parseFloat((totalPotNum * (0.8 + (i * 0.03))).toFixed(2));
      const salt = "0x" + (i + 1).toString().padStart(64, "0");
      
      let hash = "";
      try {
        hash = ethers.solidityPackedKeccak256(
          ["uint256", "bytes32", "address"],
          [ethers.parseEther(bidAmt.toString()), salt, addr]
        );
      } catch {
        hash = "0x" + Math.random().toString(16).substring(2, 66);
      }

      list.push({
        id: `node-${i}`,
        address: addr,
        label: isMe ? "You (BridgeKey)" : `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`,
        isCurrentUser: isMe,
        isInitializer: i === 0,
        angle,
        hasPaid: true,
        mandateActive: true,
        secretBidAmount: bidAmt,
        secretSalt: salt,
        commitmentHash: hash,
        dividendBalance: parseFloat((0.05 * (i + 1)).toFixed(3)),
        bufferBalance: installmentNum,
      });
    }
    return list;
  }, [memberCount, allowedMembers, currentAccount, installmentNum, totalPotNum]);

  // Determine lowest bidder
  const lowestBidNode = useMemo(() => {
    if (!nodes.length) return null;
    return [...nodes].sort((a, b) => a.secretBidAmount - b.secretBidAmount)[0];
  }, [nodes]);

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const centralVaultRef = useRef<THREE.Group | null>(null);
  const aaveMatrixRef = useRef<THREE.Group | null>(null);
  const particleStreamsRef = useRef<THREE.Points | null>(null);
  const particlesGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const lightningLinesRef = useRef<THREE.LineSegments | null>(null);

  // Set initial selected node
  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0]);
    }
  }, [nodes, selectedNode]);

  // Compute live Secret Bid Hash
  const currentBidHash = useMemo(() => {
    try {
      const amtBN = ethers.parseEther(parseFloat(userBidAmount || "0").toFixed(4));
      const cleanSalt = userSalt.startsWith("0x") ? userSalt.padEnd(66, "0") : ("0x" + userSalt).padEnd(66, "0");
      return ethers.solidityPackedKeccak256(
        ["uint256", "bytes32", "address"],
        [amtBN, cleanSalt, currentAccount || nodes[0]?.address || "0x0000000000000000000000000000000000000000"]
      );
    } catch (e) {
      return "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069";
    }
  }, [userBidAmount, userSalt, currentAccount, nodes]);

  // Generate new random salt
  const regenerateSalt = () => {
    const s = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setUserSalt(s);
  };

  // Three.js Scene Initialization
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030305);
    scene.fog = new THREE.FogExp2(0x030305, 0.035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 14, 22);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 6;
    controls.maxDistance = 45;
    controlsRef.current = controls;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const redPointLight = new THREE.PointLight(0xff1744, 4, 30);
    redPointLight.position.set(0, 5, 0);
    scene.add(redPointLight);

    const cyanPointLight = new THREE.PointLight(0x00f0ff, 2, 25);
    cyanPointLight.position.set(0, -4, 0);
    scene.add(cyanPointLight);

    // 6. Holographic Grid Floor
    const gridHelper = new THREE.GridHelper(50, 50, 0x99111e, 0x181822);
    gridHelper.position.y = -3.5;
    scene.add(gridHelper);

    // 7. Outer Starfield / Cyber Nebula Particles
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 80;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 40 + 5;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 80;

      const isRed = Math.random() > 0.4;
      starColors[i * 3] = isRed ? 1.0 : 0.2;
      starColors[i * 3 + 1] = isRed ? 0.1 : 0.8;
      starColors[i * 3 + 2] = isRed ? 0.2 : 1.0;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 8. Central MST Core Pot Vault
    const centralGroup = new THREE.Group();
    centralVaultRef.current = centralGroup;
    scene.add(centralGroup);

    // Central Sphere (Vault Core)
    const coreGeo = new THREE.SphereGeometry(1.4, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x990d18,
      emissive: 0xee0011,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    centralGroup.add(coreMesh);

    // Outer Holographic Wireframe Cage
    const cageGeo = new THREE.IcosahedronGeometry(2.1, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    centralGroup.add(cageMesh);

    // Orbiting Cyber Rings around Pot Vault
    const ringGeo1 = new THREE.TorusGeometry(2.8, 0.04, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0xff1744, transparent: true, opacity: 0.8 });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 2;
    centralGroup.add(ringMesh1);

    const ringGeo2 = new THREE.TorusGeometry(3.3, 0.03, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.5 });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = Math.PI / 3;
    ringMesh2.rotation.y = Math.PI / 4;
    centralGroup.add(ringMesh2);

    // 9. Floating Aave De-Fi Matrix (Days 2 - 30)
    const aaveGroup = new THREE.Group();
    aaveGroup.position.set(0, 4.5, 0);
    aaveGroup.visible = false;
    aaveMatrixRef.current = aaveGroup;
    scene.add(aaveGroup);

    const aaveCoreGeo = new THREE.OctahedronGeometry(1.2, 0);
    const aaveCoreMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00cc66,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
    });
    const aaveCore = new THREE.Mesh(aaveCoreGeo, aaveCoreMat);
    aaveGroup.add(aaveCore);

    const aaveHaloGeo = new THREE.RingGeometry(1.6, 2.0, 32);
    const aaveHaloMat = new THREE.MeshBasicMaterial({
      color: 0x00ffa3,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const aaveHalo = new THREE.Mesh(aaveHaloGeo, aaveHaloMat);
    aaveHalo.rotation.x = Math.PI / 2;
    aaveGroup.add(aaveHalo);

    // 10. Member Nodes Ring
    const nodesGroup = new THREE.Group();
    nodesGroupRef.current = nodesGroup;
    scene.add(nodesGroup);

    const radius = 8.5;
    nodes.forEach((node) => {
      const nodeSubGroup = new THREE.Group();
      const x = Math.cos(node.angle) * radius;
      const z = Math.sin(node.angle) * radius;
      nodeSubGroup.position.set(x, 0, z);

      // 3D Avatar (Octahedron / Diamond)
      const avatarGeo = new THREE.OctahedronGeometry(0.7, 0);
      const avatarMat = new THREE.MeshStandardMaterial({
        color: node.isCurrentUser ? 0xff2a40 : 0x88111e,
        emissive: node.isCurrentUser ? 0xff0020 : 0x550a12,
        emissiveIntensity: 0.7,
        roughness: 0.3,
        metalness: 0.7,
      });
      const avatarMesh = new THREE.Mesh(avatarGeo, avatarMat);
      nodeSubGroup.add(avatarMesh);

      // Base Cyber Pedestal Ring
      const baseRingGeo = new THREE.TorusGeometry(1.1, 0.03, 16, 48);
      const baseRingMat = new THREE.MeshBasicMaterial({
        color: node.isCurrentUser ? 0xff1744 : 0x771120,
        transparent: true,
        opacity: 0.8,
      });
      const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
      baseRing.rotation.x = Math.PI / 2;
      baseRing.position.y = -1.2;
      nodeSubGroup.add(baseRing);

      // Holographic Connecting Line to Central Core
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -1.2, 0),
        new THREE.Vector3(-x, 0, -z),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: node.isCurrentUser ? 0xff3b30 : 0x440810,
        transparent: true,
        opacity: 0.6,
      });
      const connectLine = new THREE.Line(lineGeo, lineMat);
      nodeSubGroup.add(connectLine);

      nodesGroup.add(nodeSubGroup);
    });

    // 11. Animated Inflow Particle Stream
    const particleCount = 250;
    const particlesGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleProgress = new Float32Array(particleCount);
    const particleNodeIndex = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const nodeIdx = i % nodes.length;
      particleNodeIndex[i] = nodeIdx;
      particleProgress[i] = Math.random();

      const nodeAngle = nodes[nodeIdx].angle;
      const startX = Math.cos(nodeAngle) * radius;
      const startZ = Math.sin(nodeAngle) * radius;
      const t = particleProgress[i];

      particlePositions[i * 3] = THREE.MathUtils.lerp(startX, 0, t);
      particlePositions[i * 3 + 1] = Math.sin(t * Math.PI) * 1.5;
      particlePositions[i * 3 + 2] = THREE.MathUtils.lerp(startZ, 0, t);
    }

    particlesGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particlesGeoRef.current = particlesGeo;

    const particleMat = new THREE.PointsMaterial({
      color: 0xff3344,
      size: 0.35,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particlesGeo, particleMat);
    particleStreamsRef.current = particleSystem;
    scene.add(particleSystem);

    // 12. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate starfield gently
      starField.rotation.y = elapsedTime * 0.02;

      // Central Vault Rotations
      if (centralVaultRef.current) {
        centralVaultRef.current.children[1].rotation.x = elapsedTime * 0.4;
        centralVaultRef.current.children[1].rotation.y = elapsedTime * 0.5;
        centralVaultRef.current.children[2].rotation.z = elapsedTime * 0.8;
        centralVaultRef.current.children[3].rotation.z = -elapsedTime * 0.6;
      }

      // Aave Matrix Animations
      if (aaveMatrixRef.current && aaveMatrixRef.current.visible) {
        aaveMatrixRef.current.children[0].rotation.y = elapsedTime * 1.2;
        aaveMatrixRef.current.children[0].rotation.x = elapsedTime * 0.8;
        aaveMatrixRef.current.children[1].rotation.z = -elapsedTime * 1.5;
        aaveMatrixRef.current.position.y = 4.5 + Math.sin(elapsedTime * 2) * 0.4;
      }

      // Member Nodes subtle breathing rotation
      if (nodesGroupRef.current) {
        nodesGroupRef.current.children.forEach((group, idx) => {
          group.children[0].rotation.y = elapsedTime * 0.8 + idx;
          group.children[0].position.y = Math.sin(elapsedTime * 1.5 + idx) * 0.15;
        });
      }

      // Update Particle Inflow Stream
      if (particlesGeoRef.current && particleStreamsRef.current) {
        const positions = particlesGeoRef.current.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          let t = particleProgress[i] + 0.008;
          if (t > 1) t = 0;
          particleProgress[i] = t;

          const nIdx = particleNodeIndex[i];
          const nodeAngle = nodes[nIdx]?.angle || 0;
          const startX = Math.cos(nodeAngle) * radius;
          const startZ = Math.sin(nodeAngle) * radius;

          positions[i * 3] = THREE.MathUtils.lerp(startX, 0, t);
          positions[i * 3 + 1] = Math.sin(t * Math.PI) * 1.8;
          positions[i * 3 + 2] = THREE.MathUtils.lerp(startZ, 0, t);
        }
        particlesGeoRef.current.attributes.position.needsUpdate = true;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
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
  }, [nodes]);

  // Stage Change Visual Effects
  useEffect(() => {
    if (!aaveMatrixRef.current || !particleStreamsRef.current || !centralVaultRef.current) return;

    if (activeStage === "day1_pooling") {
      aaveMatrixRef.current.visible = false;
      particleStreamsRef.current.visible = true;
      (particleStreamsRef.current.material as THREE.PointsMaterial).color.setHex(0xff3344);
      (centralVaultRef.current.children[0] as THREE.Mesh).scale.set(1.0, 1.0, 1.0);
      setRevealedWinner(null);
    } else if (activeStage === "day2_30_aave") {
      aaveMatrixRef.current.visible = true;
      particleStreamsRef.current.visible = true;
      (particleStreamsRef.current.material as THREE.PointsMaterial).color.setHex(0x00ff88);
      (centralVaultRef.current.children[0] as THREE.Mesh).scale.set(1.25, 1.25, 1.25);
      setRevealedWinner(null);
    } else if (activeStage === "day31_bidding") {
      aaveMatrixRef.current.visible = false;
      particleStreamsRef.current.visible = true;
      (particleStreamsRef.current.material as THREE.PointsMaterial).color.setHex(0xffaa00);
      setRevealedWinner(null);
    } else if (activeStage === "settlement_dividends") {
      aaveMatrixRef.current.visible = false;
      particleStreamsRef.current.visible = true;
      (particleStreamsRef.current.material as THREE.PointsMaterial).color.setHex(0xffd700);
      setRevealedWinner(lowestBidNode);
    }
  }, [activeStage, lowestBidNode]);

  // Auto Simulation Player
  useEffect(() => {
    if (!isPlayingAuto) return;
    const stages: LifecycleStage[] = ["day1_pooling", "day2_30_aave", "day31_bidding", "settlement_dividends"];
    let currentIndex = stages.indexOf(activeStage);

    const timer = setInterval(() => {
      currentIndex = (currentIndex + 1) % stages.length;
      setActiveStage(stages[currentIndex]);
      setAutoProgress((currentIndex + 1) * 25);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPlayingAuto, activeStage]);

  // Submit Secret Bid Handler
  const handleCommitSecretBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const bidNum = parseFloat(userBidAmount);
    if (isNaN(bidNum) || bidNum <= 0 || bidNum > totalPotNum) {
      onShowNotification?.(`Bid must be between 0.1 and ${totalPotNum} tMSTC`, true);
      return;
    }

    setIsSubmittingBid(true);
    try {
      if (onCommitBid) {
        await onCommitBid(userBidAmount, userSalt);
      }
      onShowNotification?.(`Secret Bid of ${userBidAmount} tMSTC committed with hash ${currentBidHash.substring(0, 10)}...!`);
      setActiveStage("day31_bidding");
    } catch (err: any) {
      onShowNotification?.(err.message || "Failed to commit bid", true);
    } finally {
      setIsSubmittingBid(false);
    }
  };

  // Calculations for Stage Summaries
  const discountWinningPot = lowestBidNode ? (totalPotNum - lowestBidNode.secretBidAmount) : (totalPotNum * 0.2);
  const bitCutAmount = (discountWinningPot * bitFeePercentage) / 100;
  const dividendPoolTotal = discountWinningPot - bitCutAmount + (totalPotNum * (aaveAPY / 100) * (28 / 365));
  const dividendPerPersonINR = Math.round((dividendPoolTotal / memberCount) * MST_TO_INR_RATE);

  return (
    <div className="space-y-6">
      {/* ── Top Header Navigation Bar ── */}
      <div className="p-6 bg-neutral-950 rounded-2xl border border-neutral-900 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>MST Blockchain Live Explorer</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 font-mono text-[10px]">
                Chain ID: 91562037
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white font-display mt-1 flex items-center gap-2">
              <span>{circleName}</span>
              <span className="text-xs text-red-500 font-mono font-normal">
                ({circleAddress.substring(0, 8)}...{circleAddress.substring(circleAddress.length - 4)})
              </span>
            </h1>
          </div>

          {/* Quick Simulation & Auto-Play Control */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlayingAuto(!isPlayingAuto)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                isPlayingAuto
                  ? "bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(255,23,68,0.5)]"
                  : "bg-black text-neutral-300 border-neutral-800 hover:text-white hover:border-neutral-700"
              }`}
            >
              {isPlayingAuto ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingAuto ? "Pause Simulation" : "Cinematic 3D Play"}</span>
            </button>
          </div>
        </div>

        {/* ── 4 Lifecycle Stage Step Selector ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-6 mt-6 border-t border-neutral-900">
          <button
            type="button"
            onClick={() => { setActiveStage("day1_pooling"); setIsPlayingAuto(false); }}
            className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
              activeStage === "day1_pooling"
                ? "bg-red-950/40 border-red-500 text-white shadow-[0_0_15px_rgba(255,23,68,0.3)]"
                : "bg-black/60 border-neutral-900 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-red-400">1st of Month</span>
              <Coins className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-white mt-1">Autopay & Pooling</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">OMNET BridgeKey Token Inflow</p>
          </button>

          <button
            type="button"
            onClick={() => { setActiveStage("day2_30_aave"); setIsPlayingAuto(false); }}
            className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
              activeStage === "day2_30_aave"
                ? "bg-emerald-950/40 border-emerald-500 text-white shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                : "bg-black/60 border-neutral-900 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-emerald-400">2nd - 30th</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-white mt-1">Aave De-Fi Staking</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">+5.82% APY Compounding</p>
          </button>

          <button
            type="button"
            onClick={() => { setActiveStage("day31_bidding"); setIsPlayingAuto(false); }}
            className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
              activeStage === "day31_bidding"
                ? "bg-amber-950/40 border-amber-500 text-white shadow-[0_0_15px_rgba(255,170,0,0.3)]"
                : "bg-black/60 border-neutral-900 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-amber-400">31st of Month</span>
              <Gavel className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-white mt-1">Secret Bidding & BIT</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">Sealed Reverse Auction</p>
          </button>

          <button
            type="button"
            onClick={() => { setActiveStage("settlement_dividends"); setIsPlayingAuto(false); }}
            className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
              activeStage === "settlement_dividends"
                ? "bg-purple-950/40 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                : "bg-black/60 border-neutral-900 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-purple-400">Settlement</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-white mt-1">Dividends & Payout</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">Discount Yield Compounding</p>
          </button>
        </div>
      </div>

      {/* ── 3D Viewport + Interactive Telemetry Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 3D Canvas (2 Cols) */}
        <div className="lg:col-span-2 bg-neutral-950 rounded-2xl border border-neutral-900 overflow-hidden relative flex flex-col min-h-[500px]">
          {/* Three.js Mount */}
          <div ref={mountRef} className="w-full h-[520px] cursor-grab active:cursor-grabbing" />

          {/* 3D Viewport Floating Overlay Header */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-neutral-800 text-[11px] font-mono text-neutral-300 pointer-events-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>MST Autonomous Chain Simulation</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-neutral-800 text-[11px] font-mono text-neutral-400 pointer-events-auto">
              Drag to Orbit • Scroll to Zoom
            </div>
          </div>

          {/* Stage Status Badge at bottom of 3D Canvas */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="p-3.5 rounded-xl bg-black/85 backdrop-blur-md border border-neutral-800 pointer-events-auto flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  {activeStage === "day1_pooling" && "Stage 1: Mandates & Inflow"}
                  {activeStage === "day2_30_aave" && "Stage 2: De-Fi Capital Staking"}
                  {activeStage === "day31_bidding" && "Stage 3: Secret Sealed Auction"}
                  {activeStage === "settlement_dividends" && "Stage 4: Solvency & Dividends"}
                </span>
                <p className="font-semibold text-white mt-0.5">
                  {activeStage === "day1_pooling" && `Pooling ${formatRawINR(installmentINR)} from each member via BridgeKey Autopay.`}
                  {activeStage === "day2_30_aave" && `Pot of ${totalPotNum} tMSTC earning +${aaveAPY}% APY in Aave Liquidity Pool.`}
                  {activeStage === "day31_bidding" && `Secret bids submitted. 5% BIT cut taken into long-term interest reserve.`}
                  {activeStage === "settlement_dividends" && `Winner ${lowestBidNode?.label} receives pot. Leftover discount rolls as dividends!`}
                </p>
              </div>

              {revealedWinner && (
                <span className="px-2.5 py-1 rounded bg-amber-950/60 text-amber-300 font-semibold text-[11px] shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lowest Bidder Wins!</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Interactive Controls & Secret Bid Form (1 Col) */}
        <div className="space-y-4">
          {/* Secret Bidding Action Card */}
          <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-900 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-xs">Secret Sealed Bid (Day 31)</h3>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">keccak256 Encrypted</span>
            </div>

            <form onSubmit={handleCommitSecretBid} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Desired Payout Bid Amount (₹ or tMSTC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max={totalPotNum}
                    value={userBidAmount}
                    onChange={(e) => setUserBidAmount(e.target.value)}
                    className="w-full bg-black rounded-lg px-3.5 py-2 text-xs text-white font-mono border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-neutral-500 font-mono">
                    tMSTC (≈ {formatRawINR(Math.round(parseFloat(userBidAmount || "0") * MST_TO_INR_RATE))})
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                  <span>Total Pot: {totalPotNum} tMSTC</span>
                  <span className="text-amber-400">
                    Discount Offered: {(totalPotNum - parseFloat(userBidAmount || "0")).toFixed(2)} tMSTC
                  </span>
                </div>
              </div>

              {/* Cryptographic Salt & Commitment Hash */}
              <div className="p-3 bg-black rounded-xl space-y-1.5 border border-neutral-900">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-400" />
                    <span>Secret Random Salt</span>
                  </span>
                  <button
                    type="button"
                    onClick={regenerateSalt}
                    className="text-[10px] text-amber-400 hover:text-amber-300 p-0 bg-transparent border-none cursor-pointer flex items-center gap-0.5"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Regen</span>
                  </button>
                </div>
                <p className="font-mono text-[9px] text-neutral-500 break-all">{userSalt.substring(0, 32)}...</p>

                <div className="pt-2 border-t border-neutral-900/60">
                  <span className="text-[10px] text-neutral-400 font-semibold block">Commitment Hash on MST:</span>
                  <p className="font-mono text-[9px] text-amber-300/80 break-all">{currentBidHash}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingBid}
                className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingBid ? "Committing..." : "Commit Sealed Bid"}</span>
              </button>
            </form>
          </div>

          {/* Member Node Inspector */}
          <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-900 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
              <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-red-500" />
                <span>Selected Node Inspector</span>
              </span>
              <span className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>

            {selectedNode && (
              <div className="space-y-2">
                <div className="p-2.5 bg-black rounded-lg flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Member ID</span>
                  <span className="font-mono text-[11px] text-white">{selectedNode.label}</span>
                </div>
                <div className="p-2.5 bg-black rounded-lg flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">BridgeKey Mandate</span>
                  <span className="text-[11px] text-green-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Active (₹{installmentINR}/mo)</span>
                  </span>
                </div>
                <div className="p-2.5 bg-black rounded-lg flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Collateral Buffer</span>
                  <span className="font-mono text-[11px] text-neutral-300">{selectedNode.bufferBalance} tMSTC</span>
                </div>
                <div className="p-2.5 bg-black rounded-lg flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Compounded Dividends</span>
                  <span className="font-mono text-[11px] text-purple-400 font-semibold">
                    +{selectedNode.dividendBalance} tMSTC
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* BIT Fee & Compounding Dividend Metric */}
          <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-purple-400 font-semibold text-[11px] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dividend Savings & BIT Cut</span>
              </span>
              <span className="text-[10px] text-purple-300 font-mono">5% BIT Cut</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              The discount left by bidders (₹{Math.round(discountWinningPot * MST_TO_INR_RATE)}) + Aave interest is pooled as compounding dividend returns for all {memberCount} members.
            </p>
            <div className="pt-2 border-t border-purple-900/30 flex justify-between items-center font-semibold text-white">
              <span>Dividend per member:</span>
              <span className="text-purple-300 font-mono font-bold">
                {formatRawINR(dividendPerPersonINR)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MSTChainVisualizer3D;
