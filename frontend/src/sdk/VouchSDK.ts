import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  formatEther,
  keccak256,
  encodePacked,
  stringToBytes,
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
  type WalletClient,
  type Account,
  type CustomTransport,
  type HttpTransport,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mstTestnet, MST_CHAIN_ID, MST_CHAIN_ID_HEX } from "./chain";
import {
  ChitFactoryABI,
  ChitGroupABI,
  VouchRegistryABI,
  MockYieldVaultABI,
  ChitGroupBytecode,
  DEFAULT_CONTRACT_ADDRESSES,
} from "./contracts";
import {
  type GroupDetails,
  type MemberDetails,
  type SolvencyInfo,
  type CreateGroupParams,
  type CreateGroupResult,
  type TransactionResult,
  type VouchSDKConfig,
  type GroupEventCallbacks,
  type GroupCreatedEvent,
  PHASE_NAMES,
} from "./types";
import { VouchEventManager } from "./events";

export class VouchSDK {
  public publicClient: PublicClient<HttpTransport>;
  public walletClient: WalletClient<CustomTransport | HttpTransport> | null = null;
  public account: Account | Address | null = null;
  public eventManager: VouchEventManager;

  public factoryAddress: Address;
  public registryAddress: Address;
  public yieldVaultAddress: Address;
  public mockTokenAddress: Address;

  constructor(config?: VouchSDKConfig) {
    const rpcUrl = config?.rpcUrl || mstTestnet.rpcUrls.default.http[0];

    // Initialize Viem Public Client
    this.publicClient = createPublicClient({
      chain: mstTestnet,
      transport: http(rpcUrl),
    }) as PublicClient<HttpTransport>;

    this.eventManager = new VouchEventManager(this.publicClient);

    // Set contract addresses with fallbacks
    this.factoryAddress = config?.factoryAddress || DEFAULT_CONTRACT_ADDRESSES.ChitFactory;
    this.registryAddress = config?.registryAddress || DEFAULT_CONTRACT_ADDRESSES.VouchRegistry;
    this.yieldVaultAddress = config?.yieldVaultAddress || DEFAULT_CONTRACT_ADDRESSES.MockYieldVault;
    this.mockTokenAddress = config?.mockTokenAddress || DEFAULT_CONTRACT_ADDRESSES.MockERC20;
  }

  // ==========================================
  // Wallet Connection & Account Management
  // ==========================================

  /**
   * Connect an injected browser provider (BridgeKey, MetaMask, EIP-6963 provider)
   */
  public async connectInjectedProvider(provider: any): Promise<Address> {
    const walletClient = createWalletClient({
      chain: mstTestnet,
      transport: custom(provider),
    });

    const [account] = await walletClient.requestAddresses();
    if (!account) throw new Error("No accounts found in injected provider");

    this.walletClient = walletClient;
    this.account = account;

    // Validate network
    await this.validateOrSwitchNetwork(provider);

    return account;
  }

  /**
   * Connect using a private key (for dev/testing/keeper bot)
   */
  public connectPrivateKey(privateKey: Hex): Address {
    const account = privateKeyToAccount(
      privateKey.startsWith("0x") ? privateKey : (`0x${privateKey}` as Hex)
    );

    this.account = account;
    this.walletClient = createWalletClient({
      account,
      chain: mstTestnet,
      transport: http(mstTestnet.rpcUrls.default.http[0]),
    });

    return account.address;
  }

  /**
   * Disconnect the active wallet
   */
  public disconnect(): void {
    this.walletClient = null;
    this.account = null;
  }

  public getConnectedAddress(): Address | null {
    if (!this.account) return null;
    return typeof this.account === "string" ? this.account : this.account.address;
  }

  public isConnected(): boolean {
    return this.walletClient !== null && this.account !== null;
  }

  /**
   * Prompt user's wallet to add or switch to MST Testnet
   */
  public async validateOrSwitchNetwork(provider: any): Promise<void> {
    if (!provider || !provider.request) return;
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MST_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: MST_CHAIN_ID_HEX,
              chainName: mstTestnet.name,
              nativeCurrency: mstTestnet.nativeCurrency,
              rpcUrls: mstTestnet.rpcUrls.default.http,
              blockExplorerUrls: [mstTestnet.blockExplorers.default.url],
            },
          ],
        });
      }
    }
  }

  /**
   * Fetch native balance for an address in tMSTC
   */
  public async getBalance(address: Address): Promise<string> {
    const balance = await this.publicClient.getBalance({ address });
    return formatEther(balance);
  }

  // ==========================================
  // Typed Contract Reads
  // ==========================================

  /**
   * Fetch full state of a ChitGroup contract
   */
  public async getGroupDetails(groupAddress: Address): Promise<GroupDetails> {
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
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "groupName",
      }),
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "memberCount",
      }),
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "installmentAmount",
      }),
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "cycleDuration",
      }),
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "discountCapBps",
      }),
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "reserveFeeBps",
      }),
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "safetyFactorBps",
      }),
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "currentState",
      }),
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "currentRound",
      }),
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "currentPot",
      }),
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "reserveFundBalance",
      }),
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "getMembers",
      }),
    ]);

    const count = Number(memberCount);
    const instAmtBigInt = installmentAmount as bigint;
    const currentPotBigInt = currentPot as bigint;
    const reserveFundBigInt = reserveFundBalance as bigint;

    const instAmtFormatted = formatEther(instAmtBigInt);
    const totalPotFloat = count * parseFloat(instAmtFormatted);
    const capPercent = Number(discountCapBps) / 10000;
    const minBidCalc = (totalPotFloat * (1 - capPercent)).toFixed(4);

    return {
      address: groupAddress,
      name: name as string,
      memberCount: count,
      installmentAmount: instAmtFormatted,
      installmentAmountRaw: instAmtBigInt,
      cycleDuration: Number(cycleDuration),
      discountCapBps: Number(discountCapBps),
      reserveFeeBps: Number(reserveFeeBps),
      safetyFactorBps: Number(safetyFactorBps),
      currentState: PHASE_NAMES[Number(stateNum)] || "Forming",
      currentRound: Number(currentRound),
      currentPot: formatEther(currentPotBigInt),
      currentPotRaw: currentPotBigInt,
      minBid: minBidCalc,
      reserveFundBalance: formatEther(reserveFundBigInt),
      reserveFundBalanceRaw: reserveFundBigInt,
      members: members as Address[],
    };
  }

  /**
   * Fetch member profile and solvency status
   */
  public async getMemberDetails(
    groupAddress: Address,
    memberAddress: Address
  ): Promise<MemberDetails> {
    const [memberData, solvency] = await Promise.all([
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "members",
        args: [memberAddress],
      }),
      this.publicClient.readContract({
        address: groupAddress,
        abi: ChitGroupABI,
        functionName: "checkSolvency",
        args: [memberAddress],
      }),
    ]);

    const m = memberData as any;
    const s = solvency as any;

    return {
      address: memberAddress,
      bufferBalance: formatEther(m.bufferBalance || 0n),
      bufferBalanceRaw: m.bufferBalance || 0n,
      lockedDividends: formatEther(m.lockedDividends || 0n),
      lockedDividendsRaw: m.lockedDividends || 0n,
      paidInstallments: Number(m.paidInstallments || 0n),
      hasPaidCurrentRound: m.hasPaidCurrentRound ?? false,
      hasWon: m.hasWon || false,
      winRound: Number(m.winRound || 0n),
      isDefaulted: m.isDefaulted || false,
      solvency: {
        isSolvent: s.isSolvent || false,
        totalBacking: formatEther(s.totalBacking || 0n),
        totalBackingRaw: s.totalBacking || 0n,
        requiredBacking: formatEther(s.requiredBacking || 0n),
        requiredBackingRaw: s.requiredBacking || 0n,
      },
    };
  }

  /**
   * Check solvency directly
   */
  public async checkSolvency(
    groupAddress: Address,
    memberAddress: Address
  ): Promise<SolvencyInfo> {
    const result = (await this.publicClient.readContract({
      address: groupAddress,
      abi: ChitGroupABI,
      functionName: "checkSolvency",
      args: [memberAddress],
    })) as any;

    return {
      isSolvent: result.isSolvent || false,
      totalBacking: formatEther(result.totalBacking || 0n),
      totalBackingRaw: result.totalBacking || 0n,
      requiredBacking: formatEther(result.requiredBacking || 0n),
      requiredBackingRaw: result.requiredBacking || 0n,
    };
  }

  /**
   * Get staked voucher backing
   */
  public async getVoucherStake(
    voucheeAddress: Address,
    voucherAddress: Address
  ): Promise<string> {
    const stake = (await this.publicClient.readContract({
      address: this.registryAddress,
      abi: VouchRegistryABI,
      functionName: "stakes",
      args: [voucheeAddress, voucherAddress],
    })) as bigint;

    return formatEther(stake);
  }

  // ==========================================
  // Typed Contract Writes & Lifecycle Management
  // ==========================================

  private ensureWalletConnected(): { client: WalletClient; account: Account | Address } {
    if (!this.walletClient || !this.account) {
      throw new Error("VouchSDK: Wallet is not connected. Call connectInjectedProvider() or connectPrivateKey() first.");
    }
    return { client: this.walletClient, account: this.account };
  }

  /**
   * Execute and wait for a transaction with full lifecycle monitoring
   */
  private async executeTx(
    contractAddress: Address,
    abi: any,
    functionName: string,
    args: any[] = [],
    value: bigint = 0n
  ): Promise<TransactionResult> {
    const { client, account } = this.ensureWalletConnected();

    // 1. Simulate contract call for pre-flight validation
    const { request } = await this.publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName,
      args,
      value,
      account: typeof account === "string" ? account : account.address,
    });

    // 2. Submit transaction
    const hash = await client.writeContract(request as any);

    // 3. Await receipt
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      receipt,
      blockNumber: receipt.blockNumber,
      status: receipt.status,
      gasUsed: receipt.gasUsed,
    };
  }

  /**
   * Create a new ChitGroup via ChitFactory
   */
  public async createGroup(params: CreateGroupParams): Promise<CreateGroupResult> {
    const { client, account } = this.ensureWalletConnected();
    const factoryAddr = params.factoryAddress || this.factoryAddress;
    const parsedInstallment = parseEther(params.installmentAmount);
    const safetyFactor = params.safetyFactorBps || 12000;

    // 1. If ChitFactory is configured, use it
    if (factoryAddr && factoryAddr !== "0x0000000000000000000000000000000000000000") {
      const { request } = await this.publicClient.simulateContract({
        address: factoryAddr,
        abi: ChitFactoryABI,
        functionName: "createGroup",
        args: [
          params.groupName,
          BigInt(params.memberCount),
          parsedInstallment,
          BigInt(params.cycleDuration),
          BigInt(params.discountCapBps),
          BigInt(params.reserveFeeBps),
          BigInt(safetyFactor),
        ],
        account: typeof account === "string" ? account : account.address,
      });

      const hash = await client.writeContract(request as any);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      // Parse GroupCreated event from logs
      let groupAddress: Address | undefined;
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === factoryAddr.toLowerCase()) {
          try {
            // GroupCreated signature topic: keccak256("GroupCreated(address,string,uint256,uint256)")
            // First indexed topic is groupAddress
            if (log.topics[1]) {
              groupAddress = `0x${log.topics[1].slice(26)}` as Address;
              break;
            }
          } catch {}
        }
      }

      return {
        hash,
        receipt,
        blockNumber: receipt.blockNumber,
        status: receipt.status,
        gasUsed: receipt.gasUsed,
        groupAddress,
      };
    }

    // 2. Direct Deploy fallback using ChitGroup bytecode
    const hash = await client.deployContract({
      abi: ChitGroupABI,
      bytecode: ChitGroupBytecode as Hex,
      args: [
        params.groupName,
        BigInt(params.memberCount),
        parsedInstallment,
        BigInt(params.cycleDuration),
        BigInt(params.discountCapBps),
        BigInt(params.reserveFeeBps),
        BigInt(safetyFactor),
        this.registryAddress,
        this.yieldVaultAddress,
      ],
      account: typeof account === "string" ? account : account.address,
    } as any);

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      receipt,
      blockNumber: receipt.blockNumber,
      status: receipt.status,
      gasUsed: receipt.gasUsed,
      groupAddress: receipt.contractAddress as Address | undefined,
    };
  }

  /**
   * Join a ChitGroup with initial collateral buffer deposit
   */
  public async joinGroup(
    groupAddress: Address,
    bufferAmount: string
  ): Promise<TransactionResult> {
    return this.executeTx(
      groupAddress,
      ChitGroupABI,
      "joinGroup",
      [],
      parseEther(bufferAmount)
    );
  }

  /**
   * Pay the current round's installment in Collect phase
   */
  public async payInstallment(
    groupAddress: Address,
    amount: string
  ): Promise<TransactionResult> {
    return this.executeTx(
      groupAddress,
      ChitGroupABI,
      "payInstallment",
      [],
      parseEther(amount)
    );
  }

  /**
   * Deposit optional additional collateral buffer
   */
  public async depositCollateralBuffer(
    groupAddress: Address,
    amount: string
  ): Promise<TransactionResult> {
    return this.executeTx(
      groupAddress,
      ChitGroupABI,
      "depositCollateralBuffer",
      [],
      parseEther(amount)
    );
  }

  /**
   * Commit secret bid in Commit phase
   */
  public async commitBid(
    groupAddress: Address,
    bidAmountOrHash: string,
    salt: string = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  ): Promise<TransactionResult> {
    let commitmentHash: Hex;

    if (bidAmountOrHash.startsWith("0x") && bidAmountOrHash.length === 66) {
      commitmentHash = bidAmountOrHash as Hex;
    } else {
      const userAddr = this.getConnectedAddress();
      if (!userAddr) throw new Error("Wallet not connected");

      const parsedBid = parseEther(bidAmountOrHash);
      const saltHex: Hex = salt.startsWith("0x")
        ? (salt as Hex)
        : keccak256(stringToBytes(salt));

      // keccak256(abi.encodePacked(bidAmount, salt, msg.sender))
      commitmentHash = keccak256(
        encodePacked(["uint256", "bytes32", "address"], [parsedBid, saltHex, userAddr])
      );
    }

    return this.executeTx(
      groupAddress,
      ChitGroupABI,
      "commitBid",
      [commitmentHash]
    );
  }

  /**
   * Reveal secret bid in Reveal phase
   */
  public async revealBid(
    groupAddress: Address,
    bidAmount: string,
    salt: string = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  ): Promise<TransactionResult> {
    const parsedBid = parseEther(bidAmount);
    const saltHex: Hex = salt.startsWith("0x")
      ? (salt as Hex)
      : keccak256(stringToBytes(salt));

    return this.executeTx(
      groupAddress,
      ChitGroupABI,
      "revealBid",
      [parsedBid, saltHex]
    );
  }

  /**
   * Settle round and distribute pot + dividends
   */
  public async settleAuction(groupAddress: Address): Promise<TransactionResult> {
    return this.executeTx(groupAddress, ChitGroupABI, "settleRound", []);
  }

  public async settleRound(groupAddress: Address): Promise<TransactionResult> {
    return this.settleAuction(groupAddress);
  }

  /**
   * Stake backing as a social voucher in VouchRegistry
   */
  public async stakeVoucher(
    voucheeAddress: Address,
    amount: string
  ): Promise<TransactionResult> {
    return this.executeTx(
      this.registryAddress,
      VouchRegistryABI,
      "stake",
      [voucheeAddress],
      parseEther(amount)
    );
  }

  // ==========================================
  // Standardized Event Streaming
  // ==========================================

  /**
   * Watch group lifecycle events
   */
  public watchGroupEvents(
    groupAddress: Address,
    callbacks: GroupEventCallbacks
  ): () => void {
    return this.eventManager.watchGroupEvents(groupAddress, callbacks);
  }

  /**
   * Watch factory creation events
   */
  public watchFactoryEvents(
    onGroupCreated: (event: GroupCreatedEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.eventManager.watchFactoryEvents(
      this.factoryAddress,
      onGroupCreated,
      onError
    );
  }
}
