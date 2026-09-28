export const ChitFactoryABI = [
  "function createGroup(string memory groupName, uint256 memberCount, uint256 installmentAmount, uint256 cycleDuration, uint256 discountCapBps, uint256 reserveFeeBps, uint256 safetyFactorBps) external returns (address groupAddr)",
  "function getDeployedGroups() external view returns (address[] memory)",
  "function getDeployedGroupsCount() external view returns (uint256)",
  "function isDeployedGroup(address) external view returns (bool)",
  "event GroupCreated(address indexed groupAddress, string groupName, uint256 memberCount, uint256 installmentAmount, uint256 cycleDuration)"
];

export const ChitGroupABI = [
  "function groupName() external view returns (string)",
  "function memberCount() external view returns (uint256)",
  "function installmentAmount() external view returns (uint256)",
  "function cycleDuration() external view returns (uint256)",
  "function discountCapBps() external view returns (uint256)",
  "function reserveFeeBps() external view returns (uint256)",
  "function safetyFactorBps() external view returns (uint256)",
  "function currentState() external view returns (uint8)",
  "function currentRound() external view returns (uint256)",
  "function phaseStartTime() external view returns (uint256)",
  "function reserveFundBalance() external view returns (uint256)",
  "function currentPot() external view returns (uint256)",
  "function lowestBidder() external view returns (address)",
  "function lowestBidAmount() external view returns (uint256)",
  "function isMember(address) external view returns (bool)",
  "function getMembers() external view returns (address[] memory)",
  "function members(address) external view returns (address addr, uint256 bufferBalance, uint256 lockedDividends, uint256 paidInstallments, bool hasWon, uint256 winRound, bool isDefaulted)",
  "function checkSolvency(address memberAddr) external view returns (bool isSolvent, uint256 totalBacking, uint256 requiredBacking)",
  "function joinGroup() external payable",
  "function payInstallment() external payable",
  "function commitBid(bytes32 commitmentHash) external",
  "function revealBid(uint256 bidAmount, bytes32 salt) external",
  "function settleRound() external",
  "function advanceToCommit() external",
  "function advanceToReveal() external",
  "event MemberJoined(address indexed member, uint256 bufferDeposit)",
  "event PhaseChanged(uint8 newState, uint256 round)",
  "event InstallmentCollected(address indexed member, uint256 round, uint256 amount)",
  "event BidCommitted(address indexed member, uint256 round, bytes32 commitmentHash)",
  "event BidRevealed(address indexed member, uint256 round, uint256 bidAmount)",
  "event AuctionSettled(uint256 indexed round, address indexed winner, uint256 payout, uint256 dividendPerMember)",
  "event DefaultAbsorbed(address indexed defaulter, uint256 round, uint8 tierUsed, uint256 amount)",
  "event GroupClosed()"
];

export const VouchRegistryABI = [
  "function stake(address vouchee) external payable",
  "function unstake(address vouchee, uint256 amount) external",
  "function getVoucherStake(address voucher, address vouchee) external view returns (uint256)",
  "function getVoucheeTotalStake(address vouchee) external view returns (uint256)",
  "function reputationScore(address) external view returns (uint256)",
  "event VoucherStaked(address indexed voucher, address indexed vouchee, uint256 amount)",
  "event VoucherSlashed(address indexed voucher, address indexed vouchee, uint256 amount, uint256 round)"
];
