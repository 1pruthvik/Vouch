import { ethers } from "ethers";
import { ChitFactoryABI, ChitGroupABI, VouchRegistryABI } from "../contracts/abis";
import { CONTRACT_ADDRESSES, MST_TESTNET } from "../config/network";

export const PHASE_NAMES = [
  "Forming",
  "Collect",
  "Commit",
  "Reveal",
  "Settle",
  "Closed",
] as const;

export type PhaseType = typeof PHASE_NAMES[number];

export interface GroupDetails {
  address: string;
  name: string;
  memberCount: number;
  installmentAmount: string;
  cycleDuration: number;
  discountCapBps: number;
  reserveFeeBps: number;
  safetyFactorBps: number;
  currentState: PhaseType;
  currentRound: number;
  currentPot: string;
  minBid: string;
  reserveFundBalance: string;
  members: string[];
}

export interface MemberDetails {
  address: string;
  isMember: boolean;
  bufferBalance: string;
  lockedDividends: string;
  paidInstallments: number;
  hasPaidCurrentRound?: boolean;
  hasWon: boolean;
  winRound: number;
  isDefaulted: boolean;
  solvency: {
    isSolvent: boolean;
    totalBacking: string;
    requiredBacking: string;
  };
}

export class ContractService {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider;
  private signer: ethers.Signer | null = null;

  constructor(provider?: ethers.BrowserProvider) {
    if (provider) {
      this.provider = provider;
    } else {
      this.provider = new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl);
    }
  }

  public async setSigner(signer: ethers.Signer) {
    this.signer = signer;
  }

  // Create a new group via ChitFactory or direct ChitGroup deployment
  public async createGroup(params: {
    factoryAddress?: string;
    groupName: string;
    memberCount: number;
    installmentAmount: string;
    cycleDuration: number;
    discountCapBps: number;
    reserveFeeBps: number;
    safetyFactorBps?: number;
  }): Promise<{ txHash: string; groupAddress?: string }> {
    if (!this.signer) throw new Error("Wallet not connected");
    const factoryAddr = params.factoryAddress || CONTRACT_ADDRESSES.ChitFactory;
    const parsedInstallment = ethers.parseEther(params.installmentAmount);
    const safetyFactor = params.safetyFactorBps || 12000;

    // 1. If factory address is configured, use ChitFactory
    if (factoryAddr && factoryAddr.trim() !== "") {
      const factory = new ethers.Contract(factoryAddr, ChitFactoryABI, this.signer);
      const tx = await factory.createGroup(
        params.groupName,
        params.memberCount,
        parsedInstallment,
        params.cycleDuration,
        params.discountCapBps,
        params.reserveFeeBps,
        safetyFactor
      );

      const receipt = await tx.wait();
      let groupAddress: string | undefined;

      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = factory.interface.parseLog(log);
            if (parsed && parsed.name === "GroupCreated") {
              groupAddress = parsed.args.groupAddress;
              break;
            }
          } catch {}
        }
      }

      return { txHash: tx.hash, groupAddress };
    }

    // 2. Direct on-chain deployment of ChitGroup from user wallet
    const { ChitGroupBytecode } = await import("../contracts/abis");
    const factory = new ethers.ContractFactory(ChitGroupABI, ChitGroupBytecode, this.signer);

    const registryAddr = CONTRACT_ADDRESSES.VouchRegistry || ethers.ZeroAddress;
    const yieldAddr = CONTRACT_ADDRESSES.MockYieldVault || ethers.ZeroAddress;

    const deployedContract = await factory.deploy(
      params.groupName,
      params.memberCount,
      parsedInstallment,
      params.cycleDuration,
      params.discountCapBps,
      params.reserveFeeBps,
      safetyFactor,
      registryAddr,
      yieldAddr
    );

    await deployedContract.waitForDeployment();
    const groupAddress = await deployedContract.getAddress();
    const deploymentTx = deployedContract.deploymentTransaction();

    return {
      txHash: deploymentTx ? deploymentTx.hash : "0x0",
      groupAddress,
    };
  }

  // Join group with initial collateral buffer deposit
  public async joinGroup(groupAddress: string, bufferAmount: string): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    const group = new ethers.Contract(groupAddress, ChitGroupABI, this.signer);
    const tx = await group.joinGroup({
      value: ethers.parseEther(bufferAmount),
    });
    await tx.wait();
    return tx.hash;
  }

  // Pay monthly installment in Collect phase
  public async payInstallment(groupAddress: string, amount: string): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    const group = new ethers.Contract(groupAddress, ChitGroupABI, this.signer);
    const tx = await group.payInstallment({
      value: ethers.parseEther(amount),
    });
    await tx.wait();
    return tx.hash;
  }

  // Commit secret bid hash in Commit phase
  public async commitBid(
    groupAddress: string,
    bidAmountOrHash: string,
    salt: string = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  ): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    const group = new ethers.Contract(groupAddress, ChitGroupABI, this.signer);
    let commitmentHash = bidAmountOrHash;
    if (!bidAmountOrHash.startsWith("0x") || bidAmountOrHash.length !== 66) {
      const userAddr = await this.signer.getAddress();
      const parsedBid = ethers.parseEther(bidAmountOrHash);
      const saltBytes = salt.startsWith("0x") ? salt : ethers.keccak256(ethers.toUtf8Bytes(salt));
      commitmentHash = ethers.solidityPackedKeccak256(
        ["uint256", "bytes32", "address"],
        [parsedBid, saltBytes, userAddr]
      );
    }
    const tx = await group.commitBid(commitmentHash);
    await tx.wait();
    return tx.hash;
  }

  // Reveal secret bid in Reveal phase
  public async revealBid(
    groupAddress: string,
    bidAmount: string,
    salt: string = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  ): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    const group = new ethers.Contract(groupAddress, ChitGroupABI, this.signer);
    const parsedBid = ethers.parseEther(bidAmount);
    const saltBytes = salt.startsWith("0x") ? salt : ethers.keccak256(ethers.toUtf8Bytes(salt));
    const tx = await group.revealBid(parsedBid, saltBytes);
    await tx.wait();
    return tx.hash;
  }

  // Settle round and distribute pot + dividends
  public async settleRound(groupAddress: string): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    const group = new ethers.Contract(groupAddress, ChitGroupABI, this.signer);
    const tx = await group.settleRound();
    await tx.wait();
    return tx.hash;
  }

  // Stake backing as a social voucher
  public async stakeVoucher(voucheeAddress: string, amount: string): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    const registryAddr = CONTRACT_ADDRESSES.VouchRegistry;
    if (!registryAddr) throw new Error("VouchRegistry address not configured");
    const registry = new ethers.Contract(registryAddr, VouchRegistryABI, this.signer);
    const tx = await registry.stake(voucheeAddress, {
      value: ethers.parseEther(amount),
    });
    await tx.wait();
    return tx.hash;
  }

  // Fetch full details of a ChitGroup
  public async getGroupDetails(groupAddress: string): Promise<GroupDetails> {
    const group = new ethers.Contract(groupAddress, ChitGroupABI, this.provider);

    const [
      name,
      memberCount,
      installmentAmount,
      cycleDuration,
      discountCapBps,
      reserveFeeBps,
      safetyFactorBps,
      stateNum,
      currentRound,
      currentPot,
      reserveFundBalance,
      members,
    ] = await Promise.all([
      group.groupName(),
      group.memberCount(),
      group.installmentAmount(),
      group.cycleDuration(),
      group.discountCapBps(),
      group.reserveFeeBps(),
      group.safetyFactorBps(),
      group.currentState(),
      group.currentRound(),
      group.currentPot(),
      group.reserveFundBalance(),
      group.getMembers(),
    ]);

    const count = Number(memberCount);
    const instAmt = ethers.formatEther(installmentAmount);
    const totalPotNum = count * parseFloat(instAmt);
    const capPercent = Number(discountCapBps) / 10000;
    const minBidCalc = (totalPotNum * (1 - capPercent)).toFixed(4);

    return {
      address: groupAddress,
      name,
      memberCount: count,
      installmentAmount: instAmt,
      cycleDuration: Number(cycleDuration),
      discountCapBps: Number(discountCapBps),
      reserveFeeBps: Number(reserveFeeBps),
      safetyFactorBps: Number(safetyFactorBps),
      currentState: PHASE_NAMES[Number(stateNum)] || "Forming",
      currentRound: Number(currentRound),
      currentPot: ethers.formatEther(currentPot),
      minBid: minBidCalc,
      reserveFundBalance: ethers.formatEther(reserveFundBalance),
      members,
    };
  }

  // Fetch member profile and solvency status
  public async getMemberDetails(groupAddress: string, memberAddress: string): Promise<MemberDetails> {
    const group = new ethers.Contract(groupAddress, ChitGroupABI, this.provider);

    const [m, solvency, membersList] = await Promise.all([
      group.members(memberAddress).catch(() => null),
      group.checkSolvency(memberAddress).catch(() => ({ isSolvent: false, totalBacking: 0n, requiredBacking: 0n })),
      group.getMembers().catch(() => []),
    ]);

    const isMember = (membersList && membersList.some((addr: string) => addr.toLowerCase() === memberAddress.toLowerCase())) ||
      (m && m.addr && m.addr !== ethers.ZeroAddress && m.addr.toLowerCase() === memberAddress.toLowerCase());

    return {
      address: memberAddress,
      isMember: Boolean(isMember),
      bufferBalance: m?.bufferBalance ? ethers.formatEther(m.bufferBalance) : "0",
      lockedDividends: m?.lockedDividends ? ethers.formatEther(m.lockedDividends) : "0",
      paidInstallments: m?.paidInstallments ? Number(m.paidInstallments) : 0,
      hasPaidCurrentRound: m?.hasPaidCurrentRound ?? false,
      hasWon: m?.hasWon ?? false,
      winRound: m?.winRound ? Number(m.winRound) : 0,
      isDefaulted: m?.isDefaulted ?? false,
      solvency: {
        isSolvent: solvency?.isSolvent ?? false,
        totalBacking: solvency?.totalBacking ? ethers.formatEther(solvency.totalBacking) : "0",
        requiredBacking: solvency?.requiredBacking ? ethers.formatEther(solvency.requiredBacking) : "0",
      },
    };
  }
}
