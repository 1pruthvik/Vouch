import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GroupDetails, MemberDetails } from "../services/contractService";
import {
  Users,
  Gavel,
  CheckCircle2,
  RotateCcw,
  Send,
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
  color: number;
  colorHex: string;
  isCurrentUser?: boolean;
  angle: number;
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
  spawnTime: number;
}

export interface BlockchainNetwork3DProps {
  currentAccount?: string | null;
  groupDetails?: GroupDetails | null;
  memberDetails?: MemberDetails | null;
  onPayDues?: () => Promise<void>;
  onCommitBid?: (bidAmountMST: string) => Promise<void>;
}

export const BlockchainNetwork3D: React.FC<BlockchainNetwork3DProps> = ({
  currentAccount,
  groupDetails,
  memberDetails,
  onPayDues,
  onCommitBid,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [members, setMembers] = useState<MemberNode3D[]>([]);
  const currentRound = groupDetails?.currentRound || 1;
  const targetPot = groupDetails
    ? Number((groupDetails.memberCount * parseFloat(groupDetails.installmentAmount || "1.0")).toFixed(2))
    : 0;

  const [bids, setBids] = useState<BidBlock3D[]>([]);
  const [customBidderId, setCustomBidderId] = useState<string>("");
  const [customBidAmount, setCustomBidAmount] = useState<string>((targetPot * 0.9).toFixed(2));
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const memberMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const bidMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const poolVaultMeshRef = useRef<THREE.Group | null>(null);
  const networkLinesRef = useRef<THREE.LineSegments | null>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);

  const membersStateRef = useRef<MemberNode3D[]>(members);
  membersStateRef.current = members;
  const bidsStateRef = useRef<BidBlock3D[]>(bids);
  bidsStateRef.current = bids;

  const paidMembers = members.filter((m) => m.hasPaidThisMonth);
  const currentPoolAmount = groupDetails && groupDetails.currentPot && parseFloat(groupDetails.currentPot) > 0
    ? parseFloat(groupDetails.currentPot)
    : paidMembers.length * (groupDetails ? parseFloat(groupDetails.installmentAmount) : 1.0);

  useEffect(() => {
    if (groupDetails && groupDetails.members && groupDetails.members.length > 0) {
      const colors = [0x880d19, 0x9b111e, 0x750a14, 0x60060e, 0xa81c2b];
      const colorHexes = ["#880d19", "#9b111e", "#750a14", "#60060e", "#a81c2b"];
      const count = groupDetails.members.length;
      const mapped: MemberNode3D[] = groupDetails.members.map((addr, idx) => {
        const isMe = Boolean(currentAccount && addr.toLowerCase() === currentAccount.toLowerCase());
        const hasPaid = memberDetails && isMe ? (memberDetails.hasPaidCurrentRound || memberDetails.paidInstallments >= currentRound) : false;
        return {
          id: `member-${idx}`,
          name: isMe ? "You" : `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`,
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
    } else {
      setMembers([]);
    }
  }, [groupDetails, currentAccount, memberDetails, currentRound]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = 480;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 10, 16);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.035;
    controls.rotateSpeed = 1.35;
    controls.minPolarAngle = 0.0001;
    controls.maxPolarAngle = Math.PI - 0.0001;
    controls.minDistance = 2;
    controls.maxDistance = 60;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.85;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0x880d19, 3, 20);
    coreLight.position.set(0, 2, 0);
    scene.add(coreLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    const vaultGroup = new THREE.Group();
    poolVaultMeshRef.current = vaultGroup;

    const coreGeo = new THREE.OctahedronGeometry(1.6, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x880d19,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x880d19,
      emissiveIntensity: 0.8,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    vaultGroup.add(coreMesh);

    const wireGeo = new THREE.WireframeGeometry(coreGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    vaultGroup.add(wireMesh);

    ringsRef.current = [];
    for (let r = 0; r < 2; r++) {
      const torusGeo = new THREE.TorusGeometry(2.4 + r * 0.5, 0.03, 16, 100);
      const torusMat = new THREE.MeshBasicMaterial({
        color: r === 0 ? 0x880d19 : 0x750a14,
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

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (poolVaultMeshRef.current) {
        poolVaultMeshRef.current.rotation.y = elapsedTime * 0.35;
      }
      ringsRef.current.forEach((ring, idx) => {
        ring.rotation.z = elapsedTime * (0.2 + idx * 0.1);
        ring.rotation.x = (idx + 1) * 0.7 + Math.sin(elapsedTime * 0.5) * 0.2;
      });

      const currentMembers = membersStateRef.current;
      memberMeshesRef.current.forEach((meshGroup, memberId) => {
        const member = currentMembers.find((m) => m.id === memberId);
        if (member) {
          meshGroup.position.y = 0.5 + Math.sin(elapsedTime * 2 + member.angle) * 0.15;
          const nodeMesh = meshGroup.getObjectByName(`node-${member.id}`) as THREE.Mesh;
          if (nodeMesh && nodeMesh.material) {
            const mat = nodeMesh.material as THREE.MeshStandardMaterial;
            if (member.hasPaidThisMonth) {
              mat.emissive.setHex(0x22c55e);
              mat.emissiveIntensity = 0.9 + Math.sin(elapsedTime * 4) * 0.2;
            } else {
              mat.emissive.setHex(member.color);
              mat.emissiveIntensity = 0.5;
            }
          }
        }
      });

      const currentBids = bidsStateRef.current;
      bidMeshesRef.current.forEach((bidGroup, bidId) => {
        const bid = currentBids.find((b) => b.id === bidId);
        if (bid) {
          const age = elapsedTime - bid.spawnTime;
          const blockMesh = bidGroup.getObjectByName("bidBox") as THREE.Mesh;

          if (blockMesh && blockMesh.material) {
            const mat = blockMesh.material as THREE.MeshStandardMaterial;

            if (age < 1.8) {
              const blinkVal = Math.sin(age * Math.PI * 3);
              const isBlinkOn = blinkVal > 0;
              mat.emissiveIntensity = isBlinkOn ? 1.6 : 0.1;
              mat.emissive.setHex(0x880d19);
            } else {
              if (bid.isCurrentBest) {
                mat.emissive.setHex(0x880d19);
                mat.emissiveIntensity = 0.8 + Math.sin(elapsedTime * 3) * 0.2;
              } else {
                mat.emissive.setHex(0x222222);
                mat.emissiveIntensity = 0.2;
              }
            }
          }

          const targetScale = bid.isCurrentBest ? 1.3 : 0.75;
          bidGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 800;
      const h = 480;
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
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMemberIds = new Set(members.map((m) => m.id));
    memberMeshesRef.current.forEach((meshGroup, id) => {
      if (!currentMemberIds.has(id)) {
        scene.remove(meshGroup);
        memberMeshesRef.current.delete(id);
      }
    });

    if (networkLinesRef.current) {
      scene.remove(networkLinesRef.current);
      networkLinesRef.current.geometry.dispose();
      networkLinesRef.current = null;
    }

    if (members.length === 0) return;

    const radius = 7.2;

    members.forEach((member) => {
      let memberGroup = memberMeshesRef.current.get(member.id);
      const x = Math.cos(member.angle) * radius;
      const z = Math.sin(member.angle) * radius;

      if (!memberGroup) {
        memberGroup = new THREE.Group();
        memberGroup.position.set(x, 0.5, z);

        const nodeGeo = new THREE.BoxGeometry(1.5, 1.3, 1.3);
        const nodeMat = new THREE.MeshStandardMaterial({
          color: 0x0e0e0e,
          roughness: 0.3,
          metalness: 0.7,
          emissive: member.color,
          emissiveIntensity: 0.5,
        });
        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
        nodeMesh.name = `node-${member.id}`;
        memberGroup.add(nodeMesh);

        const nodeEdgesGeo = new THREE.EdgesGeometry(nodeGeo);
        const nodeEdgesMat = new THREE.LineBasicMaterial({
          color: member.color,
        });
        const nodeEdges = new THREE.LineSegments(nodeEdgesGeo, nodeEdgesMat);
        memberGroup.add(nodeEdges);

        scene.add(memberGroup);
        memberMeshesRef.current.set(member.id, memberGroup);
      } else {
        memberGroup.position.set(x, 0.5, z);
      }
    });

    const linePositions: number[] = [];
    for (let i = 0; i < members.length; i++) {
      const x1 = Math.cos(members[i].angle) * radius;
      const z1 = Math.sin(members[i].angle) * radius;

      const nextIdx = (i + 1) % members.length;
      const x2 = Math.cos(members[nextIdx].angle) * radius;
      const z2 = Math.sin(members[nextIdx].angle) * radius;

      linePositions.push(x1, 0.5, z1, x2, 0.5, z2);
      linePositions.push(x1, 0.5, z1, 0, 0.5, 0);
    }

    if (linePositions.length > 0) {
      const netLineGeo = new THREE.BufferGeometry();
      netLineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
      const netLineMat = new THREE.LineBasicMaterial({
        color: 0x880d19,
        transparent: true,
        opacity: 0.4,
      });
      const networkLines = new THREE.LineSegments(netLineGeo, netLineMat);
      networkLinesRef.current = networkLines;
      scene.add(networkLines);
    }
  }, [members]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

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

        const boxGeo = new THREE.BoxGeometry(1.6, 1.1, 1.1);
        const boxMat = new THREE.MeshStandardMaterial({
          color: 0x141414,
          roughness: 0.25,
          metalness: 0.75,
          emissive: 0x880d19,
          emissiveIntensity: 1.2,
        });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.name = "bidBox";
        bidGroup.add(boxMesh);

        const edgesGeo = new THREE.EdgesGeometry(boxGeo);
        const edgesMat = new THREE.LineBasicMaterial({
          color: 0xf8b4b4,
        });
        const edges = new THREE.LineSegments(edgesGeo, edgesMat);
        bidGroup.add(edges);

        scene.add(bidGroup);
        bidMeshesRef.current.set(bid.id, bidGroup);
      }

      const angle = (index / Math.max(1, bids.length)) * Math.PI * 2;
      const dist = 4.2;
      bidGroup.position.set(Math.cos(angle) * dist, 3.2 + (index % 2) * 0.8, Math.sin(angle) * dist);
    });
  }, [bids]);

  const handleManualBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const bidder = members.find((m) => m.id === customBidderId);
    if (!bidder) return;

    const parsedAmt = parseFloat(customBidAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) return;

    const dividend = Math.max(0, targetPot - parsedAmt);
    const newBidId = `bid-${Date.now()}`;
    const newBlockNum = 10500 + bids.length + 1;

    const isCurrentBest = bids.length === 0 || parsedAmt < Math.min(...bids.map((b) => b.bidAmount));

    const updatedBids = bids.map((b) => ({
      ...b,
      isCurrentBest: isCurrentBest ? false : b.isCurrentBest,
    }));

    const newBid: BidBlock3D = {
      id: newBidId,
      roundNumber: currentRound,
      blockNumber: newBlockNum,
      bidderId: bidder.id,
      bidderName: bidder.name,
      bidderAddress: bidder.address,
      bidAmount: parsedAmt,
      dividendSavings: dividend,
      timestamp: new Date().toLocaleTimeString(),
      isCurrentBest: true,
      spawnTime: performance.now() / 1000,
    };

    setBids([newBid, ...updatedBids].slice(0, 5));

    if (onCommitBid) {
      try {
        setIsProcessing(true);
        await onCommitBid(customBidAmount);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (!groupDetails) {
    return (
      <div className="text-center py-16 px-6 space-y-4">
        <div className="w-12 h-12 text-red-500 flex items-center justify-center mx-auto">
          <Box className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white font-display">No Active Chit Circle Selected</h3>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Select or deploy a savings circle to visualize its on-chain peer-to-peer topology in 3D.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden">
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            3D Blockchain Network
          </div>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              autoRotate ? "bg-red-600 text-white" : "bg-black/70 text-neutral-400 hover:text-white"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
            {autoRotate ? "Rotate ON" : "Rotate OFF"}
          </button>
        </div>

        <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-md p-3 rounded-lg text-right">
          <p className="text-[10px] text-neutral-400 font-medium">Pool Balance</p>
          <p className="text-lg font-bold text-white font-display">
            {currentPoolAmount.toFixed(2)} tMSTC
          </p>
        </div>

        <div ref={mountRef} className="w-full h-[480px] bg-black cursor-grab active:cursor-grabbing" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              Member Nodes ({members.length})
            </h3>
            {onPayDues && (
              <button
                onClick={onPayDues}
                disabled={isProcessing}
                className="btn-primary text-xs py-1.5 px-3"
              >
                Pay Installment
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
            {members.length === 0 ? (
              <div className="text-center py-6 text-neutral-500 text-xs">
                No members joined this circle yet.
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="p-3 bg-black flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: member.colorHex }}
                    />
                    <div>
                      <span className="font-bold text-white">{member.name}</span>
                      <p className="text-[10px] text-neutral-500 font-mono">{member.address.substring(0, 8)}...</p>
                    </div>
                  </div>

                  <div>
                    {member.hasPaidThisMonth ? (
                      <span className="badge text-[10px] text-green-400">
                        <CheckCircle2 className="w-3 h-3 text-green-400" /> Paid
                      </span>
                    ) : (
                      <span className="badge text-[10px] text-neutral-400">Pending</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="pb-3">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Gavel className="w-4 h-4 text-red-500" />
              Reverse Auction Bidding
            </h3>
          </div>

          {members.length > 0 && (
            <form
              onSubmit={handleManualBid}
              className="p-3.5 bg-black flex flex-wrap items-center gap-3 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400 font-semibold">Bidder:</span>
                <select
                  value={customBidderId}
                  onChange={(e) => setCustomBidderId(e.target.value)}
                  className="bg-neutral-900 rounded-md px-2.5 py-1.5 text-white text-xs focus:outline-none"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400 font-semibold">Payout (tMSTC):</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max={targetPot || 100}
                  value={customBidAmount}
                  onChange={(e) => setCustomBidAmount(e.target.value)}
                  className="w-24 bg-neutral-900 rounded-md px-2 py-1.5 text-white font-mono text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="btn-primary text-xs py-1.5 px-3.5 ml-auto"
              >
                <Send className="w-3 h-3" />
                Submit Bid Block
              </button>
            </form>
          )}

          <div className="space-y-2.5 max-h-[200px] overflow-y-auto">
            {bids.length === 0 ? (
              <div className="text-center py-6 text-neutral-500 text-xs">
                No active bid blocks submitted yet.
              </div>
            ) : (
              bids.map((bid) => {
                const isBest = bid.isCurrentBest;
                return (
                  <div
                    key={bid.id}
                    className="p-3 bg-black flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{bid.bidderName}</span>
                        {isBest && (
                          <span className="badge text-[10px] text-red-400">
                            ★ Best Bid
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {bid.timestamp} • BLOCK #{bid.blockNumber}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-white text-sm font-display">
                        {bid.bidAmount.toFixed(2)} tMSTC
                      </span>
                      <p className="text-[10px] text-red-400">
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
