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
  Award,
  CircleDollarSign,
  Flame,
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

  // Build Member Nodes corresponding accurately to memberCount
  const nodes: NodeData[] = useMemo(() => {
    const list: NodeData[] = [];
    const count = Math.max(memberCount, 3);
    const cleanCurrent = (currentAccount || "").toLowerCase();

    const mockAddrs = [
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
      "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
      "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
      "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    ];

    for (let i = 0; i < count; i++) {
      let addr = allowedMembers[i] || mockAddrs[i % mockAddrs.length];
      if (i === 0 && cleanCurrent) {
        addr = currentAccount;
      }
      const isMe = Boolean(cleanCurrent && addr.toLowerCase() === cleanCurrent);
      const angle = (i / count) * Math.PI * 2;
      const bidAmt = parseFloat((totalPotNum * (0.8 + ((i % 5) * 0.03))).toFixed(2));
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
  const chainLoopRef = useRef<THREE.Group | null>(null);
  const winnerLightningRef = useRef<THREE.Group | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);

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

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020204);
    scene.fog = new THREE.FogExp2(0x020204, 0.028);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 16, 25);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.08;
    controls.minDistance = 6;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dynamicPointLight = new THREE.PointLight(0xff1744, 5, 35);
    dynamicPointLight.position.set(0, 6, 0);
    pointLightRef.current = dynamicPointLight;
    scene.add(dynamicPointLight);

    const cyanRimLight = new THREE.PointLight(0x00f0ff, 3, 30);
    cyanRimLight.position.set(0, -5, 0);
    scene.add(cyanRimLight);

    // 6. Holographic Grid Floor & Concentric Energy Rings
    const gridHelper = new THREE.GridHelper(60, 60, 0xb91c1c, 0x181822);
    gridHelper.position.y = -3.8;
    scene.add(gridHelper);

    // Neon Floor Rings
    [8, 12, 18].forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r - 0.05, r + 0.05, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xff2244 : 0x440810,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const floorRing = new THREE.Mesh(ringGeo, ringMat);
      floorRing.rotation.x = Math.PI / 2;
      floorRing.position.y = -3.75;
      scene.add(floorRing);
    });

    // 7. Outer Starfield / Cyber Nebula Particles (1,200 particles)
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 100;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 50 + 5;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 100;

      const rand = Math.random();
      if (rand < 0.5) {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.15;
        starColors[i * 3 + 2] = 0.25;
      } else if (rand < 0.8) {
        starColors[i * 3] = 0.1;
        starColors[i * 3 + 1] = 0.9;
        starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 0.2;
      }
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 8. Central MST Core Pot Vault (High-Tech Holographic Reactor)
    const centralGroup = new THREE.Group();
    centralVaultRef.current = centralGroup;
    scene.add(centralGroup);

    // Central Glowing Plasma Sphere
    const coreGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x990d18,
      emissive: 0xff1744,
      emissiveIntensity: 1.2,
      roughness: 0.15,
      metalness: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    centralGroup.add(coreMesh);

    // Inner Metallic Dodecahedron Shield
    const innerCageGeo = new THREE.DodecahedronGeometry(2.1, 0);
    const innerCageMat = new THREE.MeshStandardMaterial({
      color: 0xff3b30,
      emissive: 0x990d18,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const innerCageMesh = new THREE.Mesh(innerCageGeo, innerCageMat);
    centralGroup.add(innerCageMesh);

    // Outer Holographic Wireframe Icosahedron
    const outerCageGeo = new THREE.IcosahedronGeometry(2.6, 1);
    const outerCageMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const outerCageMesh = new THREE.Mesh(outerCageGeo, outerCageMat);
    centralGroup.add(outerCageMesh);

    // Triple Gyro-Orbiting Cyber Rings
    const ringMatRed = new THREE.MeshBasicMaterial({ color: 0xff1744, transparent: true, opacity: 0.85 });
    const ringMatCyan = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.7 });
    const ringMatGold = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.6 });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.04, 16, 100), ringMatRed);
    ring1.rotation.x = Math.PI / 2;
    centralGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.03, 16, 100), ringMatCyan);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 4;
    centralGroup.add(ring2);

    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.025, 16, 100), ringMatGold);
    ring3.rotation.z = Math.PI / 4;
    centralGroup.add(ring3);

    // 9. Floating Aave De-Fi Staking Matrix (Days 2 - 30)
    const aaveGroup = new THREE.Group();
    aaveGroup.position.set(0, 5.5, 0);
    aaveGroup.visible = false;
    aaveMatrixRef.current = aaveGroup;
    scene.add(aaveGroup);

    // Floating Aave Octahedron Crystal
    const aaveCoreGeo = new THREE.OctahedronGeometry(1.5, 0);
    const aaveCoreMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00dd66,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.95,
    });
    const aaveCore = new THREE.Mesh(aaveCoreGeo, aaveCoreMat);
    aaveGroup.add(aaveCore);

    // Aave Holographic Energy Disks
    const aaveHaloGeo = new THREE.RingGeometry(2.0, 2.5, 48);
    const aaveHaloMat = new THREE.MeshBasicMaterial({
      color: 0x00ffa3,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const aaveHalo = new THREE.Mesh(aaveHaloGeo, aaveHaloMat);
    aaveHalo.rotation.x = Math.PI / 2;
    aaveGroup.add(aaveHalo);

    // 10. Member Nodes Ring & Authentic 3D Inter-Node Chain Links
    const nodesGroup = new THREE.Group();
    nodesGroupRef.current = nodesGroup;
    scene.add(nodesGroup);

    const chainLoopGroup = new THREE.Group();
    chainLoopRef.current = chainLoopGroup;
    scene.add(chainLoopGroup);

    const radius = 9.5;
    const nodeCount = nodes.length;

    nodes.forEach((node, idx) => {
      const nodeSubGroup = new THREE.Group();
      const x = Math.cos(node.angle) * radius;
      const z = Math.sin(node.angle) * radius;
      nodeSubGroup.position.set(x, 0, z);

      // Metallic Faceted Crystal Avatar
      const avatarGeo = new THREE.OctahedronGeometry(0.85, 0);
      const avatarMat = new THREE.MeshStandardMaterial({
        color: node.isCurrentUser ? 0xff2a40 : (node.isInitializer ? 0xe50914 : 0x88111e),
        emissive: node.isCurrentUser ? 0xff0020 : (node.isInitializer ? 0xcc0015 : 0x550a12),
        emissiveIntensity: 0.85,
        roughness: 0.25,
        metalness: 0.85,
      });
      const avatarMesh = new THREE.Mesh(avatarGeo, avatarMat);
      nodeSubGroup.add(avatarMesh);

      // Base Cyber Pedestal Ring
      const baseRingGeo = new THREE.TorusGeometry(1.2, 0.04, 16, 48);
      const baseRingMat = new THREE.MeshBasicMaterial({
        color: node.isCurrentUser ? 0xff1744 : 0x771120,
        transparent: true,
        opacity: 0.85,
      });
      const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
      baseRing.rotation.x = Math.PI / 2;
      baseRing.position.y = -1.4;
      nodeSubGroup.add(baseRing);

      // Inward Laser Beam connecting Member to Central Core
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -1.4, 0),
        new THREE.Vector3(-x, 0, -z),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: node.isCurrentUser ? 0xff3b30 : 0x550812,
        transparent: true,
        opacity: 0.65,
      });
      const connectLine = new THREE.Line(lineGeo, lineMat);
      nodeSubGroup.add(connectLine);

      // 3D Inter-Connecting Blockchain Chain Link (between node i and node i+1)
      const nextNode = nodes[(idx + 1) % nodeCount];
      const nextX = Math.cos(nextNode.angle) * radius;
      const nextZ = Math.sin(nextNode.angle) * radius;

      const chainCurve = new THREE.LineCurve3(
        new THREE.Vector3(x, -1.4, z),
        new THREE.Vector3(nextX, -1.4, nextZ)
      );
      const chainTubeGeo = new THREE.TubeGeometry(chainCurve, 20, 0.06, 8, false);
      const chainTubeMat = new THREE.MeshStandardMaterial({
        color: 0xff1744,
        emissive: 0x990d18,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.8,
        wireframe: false,
      });
      const chainTube = new THREE.Mesh(chainTubeGeo, chainTubeMat);
      chainLoopGroup.add(chainTube);

      nodesGroup.add(nodeSubGroup);
    });

    // 11. Winner Golden Lightning Aura
    const winnerGroup = new THREE.Group();
    winnerLightningRef.current = winnerGroup;
    winnerGroup.visible = false;
    scene.add(winnerGroup);

    if (lowestBidNode) {
      const winX = Math.cos(lowestBidNode.angle) * radius;
      const winZ = Math.sin(lowestBidNode.angle) * radius;

      // Golden Vertical Light Column
      const winCylinderGeo = new THREE.CylinderGeometry(1.2, 1.2, 12, 32, 1, true);
      const winCylinderMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const winCylinder = new THREE.Mesh(winCylinderGeo, winCylinderMat);
      winCylinder.position.set(winX, 4, winZ);
      winnerGroup.add(winCylinder);

      // Golden Lightning Beam from Core to Winner
      const beamGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(winX, 0, winZ),
      ]);
      const beamMat = new THREE.LineBasicMaterial({
        color: 0xffd700,
        linewidth: 3,
      });
      const lightningBeam = new THREE.Line(beamGeo, beamMat);
      winnerGroup.add(lightningBeam);
    }

    // 12. Animated Particle Stream
    const particleCount = 350;
    const particlesGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleProgress = new Float32Array(particleCount);
    const particleNodeIndex = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const nodeIdx = i % nodeCount;
      particleNodeIndex[i] = nodeIdx;
      particleProgress[i] = Math.random();

      const nodeAngle = nodes[nodeIdx].angle;
      const startX = Math.cos(nodeAngle) * radius;
      const startZ = Math.sin(nodeAngle) * radius;
      const t = particleProgress[i];

      particlePositions[i * 3] = THREE.MathUtils.lerp(startX, 0, t);
      particlePositions[i * 3 + 1] = Math.sin(t * Math.PI) * 1.8;
      particlePositions[i * 3 + 2] = THREE.MathUtils.lerp(startZ, 0, t);
    }

    particlesGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particlesGeoRef.current = particlesGeo;

    const particleMat = new THREE.PointsMaterial({
      color: 0xff3344,
      size: 0.38,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particlesGeo, particleMat);
    particleStreamsRef.current = particleSystem;
    scene.add(particleSystem);

    // 13. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate starfield
      starField.rotation.y = elapsedTime * 0.02;

      // Central Vault Dynamic Rotations
      if (centralVaultRef.current) {
        centralVaultRef.current.children[1].rotation.x = elapsedTime * 0.45;
        centralVaultRef.current.children[1].rotation.y = elapsedTime * 0.55;
        centralVaultRef.current.children[2].rotation.x = -elapsedTime * 0.35;
        centralVaultRef.current.children[2].rotation.z = elapsedTime * 0.65;
        centralVaultRef.current.children[3].rotation.z = elapsedTime * 0.9;
        centralVaultRef.current.children[4].rotation.z = -elapsedTime * 0.7;
        centralVaultRef.current.children[5].rotation.x = elapsedTime * 0.8;
      }

      // Aave Matrix Animations
      if (aaveMatrixRef.current && aaveMatrixRef.current.visible) {
        aaveMatrixRef.current.children[0].rotation.y = elapsedTime * 1.3;
        aaveMatrixRef.current.children[0].rotation.x = elapsedTime * 0.9;
        aaveMatrixRef.current.children[1].rotation.z = -elapsedTime * 1.6;
        aaveMatrixRef.current.position.y = 5.5 + Math.sin(elapsedTime * 2.2) * 0.45;
      }

      // Member Nodes Breathing Animation
      if (nodesGroupRef.current) {
        nodesGroupRef.current.children.forEach((group, idx) => {
          group.children[0].rotation.y = elapsedTime * 0.9 + idx;
          group.children[0].position.y = Math.sin(elapsedTime * 1.8 + idx) * 0.2;
        });
      }

      // Update Particle Inflow Stream
      if (particlesGeoRef.current && particleStreamsRef.current) {
        const positions = particlesGeoRef.current.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          let t = particleProgress[i] + 0.009;
          if (t > 1) t = 0;
          particleProgress[i] = t;

          const nIdx = particleNodeIndex[i];
          const nodeAngle = nodes[nIdx]?.angle || 0;
          const startX = Math.cos(nodeAngle) * radius;
          const startZ = Math.sin(nodeAngle) * radius;

          positions[i * 3] = THREE.MathUtils.lerp(startX, 0, t);
          positions[i * 3 + 1] = Math.sin(t * Math.PI) * 2.2;
          positions[i * 3 + 2] = THREE.MathUtils.lerp(startZ, 0, t);
        }
        particlesGeoRef.current.attributes.position.needsUpdate = true;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

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
    if (!aaveMatrixRef.current || !particleStreamsRef.current || !centralVaultRef.current || !pointLightRef.current) return;

    if (activeStage === "day1_pooling") {
      aaveMatrixRef.current.visible = false;
      particleStreamsRef.current.visible = true;
      pointLightRef.current.color.setHex(0xff1744);
      (particleStreamsRef.current.material as THREE.PointsMaterial).color.setHex(0xff2244);
      (centralVaultRef.current.children[0] as THREE.Mesh).scale.set(1.0, 1.0, 1.0);
      if (winnerLightningRef.current) winnerLightningRef.current.visible = false;
      setRevealedWinner(null);
    } else if (activeStage === "day2_30_aave") {
      aaveMatrixRef.current.visible = true;
      particleStreamsRef.current.visible = true;
      pointLightRef.current.color.setHex(0x00ff88);
      (particleStreamsRef.current.material as THREE.PointsMaterial).color.setHex(0x00ff88);
      (centralVaultRef.current.children[0] as THREE.Mesh).scale.set(1.25, 1.25, 1.25);
      if (winnerLightningRef.current) winnerLightningRef.current.visible = false;
      setRevealedWinner(null);
    } else if (activeStage === "day31_bidding") {
      aaveMatrixRef.current.visible = false;
      particleStreamsRef.current.visible = true;
      pointLightRef.current.color.setHex(0xffaa00);
      (particleStreamsRef.current.material as THREE.PointsMaterial).color.setHex(0xffaa00);
      if (winnerLightningRef.current) winnerLightningRef.current.visible = false;
      setRevealedWinner(null);
    } else if (activeStage === "settlement_dividends") {
      aaveMatrixRef.current.visible = false;
      particleStreamsRef.current.visible = true;
      pointLightRef.current.color.setHex(0xffd700);
      (particleStreamsRef.current.material as THREE.PointsMaterial).color.setHex(0xffd700);
      if (winnerLightningRef.current) winnerLightningRef.current.visible = true;
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
  const winningBidAmount = lowestBidNode ? lowestBidNode.secretBidAmount : (totalPotNum * 0.85);
  const discountWinningPot = totalPotNum - winningBidAmount;
  const bitCutAmount = (discountWinningPot * bitFeePercentage) / 100;
  const dividendPoolTotal = (discountWinningPot - bitCutAmount) + (totalPotNum * (aaveAPY / 100) * (28 / 365));
  const dividendPerPersonINR = Math.round((dividendPoolTotal / memberCount) * MST_TO_INR_RATE);

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ── */}
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

        {/* ── 4 Lifecycle Stage Step Selector Buttons ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-6 mt-6 border-t border-neutral-900">
          <button
            type="button"
            onClick={() => { setActiveStage("day1_pooling"); setIsPlayingAuto(false); }}
            className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
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
            <p className="text-[10px] text-neutral-500 mt-0.5">OMNET BridgeKey Inflow</p>
          </button>

          <button
            type="button"
            onClick={() => { setActiveStage("day2_30_aave"); setIsPlayingAuto(false); }}
            className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
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
            className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
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
            className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
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

      {/* ── PROMINENT STAGE EXPLAINER BANNER (RENDERED ON TOP BEFORE 3D MODEL) ── */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 shadow-xl ${
        activeStage === "day1_pooling"
          ? "bg-gradient-to-r from-red-950/50 via-neutral-950 to-red-950/20 border-red-600/50"
          : activeStage === "day2_30_aave"
          ? "bg-gradient-to-r from-emerald-950/50 via-neutral-950 to-emerald-950/20 border-emerald-500/50"
          : activeStage === "day31_bidding"
          ? "bg-gradient-to-r from-amber-950/50 via-neutral-950 to-amber-950/20 border-amber-500/50"
          : "bg-gradient-to-r from-purple-950/50 via-neutral-950 to-purple-950/20 border-purple-500/50"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                activeStage === "day1_pooling" ? "bg-red-950 text-red-400" :
                activeStage === "day2_30_aave" ? "bg-emerald-950 text-emerald-400" :
                activeStage === "day31_bidding" ? "bg-amber-950 text-amber-400" :
                "bg-purple-950 text-purple-400"
              }`}>
                {activeStage === "day1_pooling" && "Stage 1: Mandates & Inflow"}
                {activeStage === "day2_30_aave" && "Stage 2: De-Fi Capital Staking"}
                {activeStage === "day31_bidding" && "Stage 3: Secret Sealed Reverse Auction"}
                {activeStage === "settlement_dividends" && "Stage 4: Solvency & Compounding Dividends"}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {memberCount} Members on MST Blockchain
              </span>
            </div>

            <p className="text-sm sm:text-base font-bold text-white leading-snug">
              {activeStage === "day1_pooling" && (
                <>Pooling <span className="text-red-400">{formatRawINR(installmentINR)}</span> ({installmentNum} tMSTC) from each of the {memberCount} members via BridgeKey OMNET Autopay.</>
              )}
              {activeStage === "day2_30_aave" && (
                <>Total collected pot of <span className="text-emerald-400">{totalPotNum} tMSTC ({formatRawINR(totalPotINR)})</span> deployed into Aave protocol, earning continuous <span className="text-emerald-300">+{aaveAPY}% APY</span> compounding interest.</>
              )}
              {activeStage === "day31_bidding" && (
                <>Members submit encrypted <span className="text-amber-400 font-mono">keccak256</span> hash bids. 5% BIT fee is extracted into the long-term interest reserve. Lowest bidder wins the pot.</>
              )}
              {activeStage === "settlement_dividends" && (
                <>Winner <span className="text-purple-400">{lowestBidNode?.label || "Lowest Bidder"}</span> receives {winningBidAmount} tMSTC. The remaining discount + Aave yield is distributed as compounding dividends (<span className="text-purple-300 font-bold">{formatRawINR(dividendPerPersonINR)}/member</span>).</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {activeStage === "day1_pooling" && (
              <span className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-red-400" />
                <span>Target: {formatRawINR(totalPotINR)}</span>
              </span>
            )}
            {activeStage === "day2_30_aave" && (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>+{aaveAPY}% APY Active</span>
              </span>
            )}
            {activeStage === "day31_bidding" && (
              <span className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>5% BIT Cut Reserved</span>
              </span>
            )}
            {activeStage === "settlement_dividends" && (
              <span className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{formatRawINR(dividendPerPersonINR)} / Member</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 3D VIEWPORT & INTERACTIVE TELEMETRY SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 3D Canvas (2 Cols) */}
        <div className="lg:col-span-2 bg-neutral-950 rounded-2xl border border-neutral-900 overflow-hidden relative flex flex-col min-h-[520px]">
          {/* Three.js Mount */}
          <div ref={mountRef} className="w-full h-[540px] cursor-grab active:cursor-grabbing" />

          {/* 3D Viewport Floating Overlay Header */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-neutral-800 text-[11px] font-mono text-neutral-300 pointer-events-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>MST Autonomous Chain • {memberCount} Node Mesh</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-neutral-800 text-[11px] font-mono text-neutral-400 pointer-events-auto">
              Drag to Orbit • Scroll to Zoom
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
