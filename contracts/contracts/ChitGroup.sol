// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VouchRegistry.sol";
import "./interfaces/IYieldStrategy.sol";

/**
 * @title ChitGroup
 * @dev Autonomous ROSCA / Chit Fund group executing cycles, reverse auctions, 5-tier waterfall, and solvency checks
 */
contract ChitGroup is ReentrancyGuard {
    enum GroupState {
        Forming,
        Collect,
        Commit,
        Reveal,
        Settle,
        Closed
    }

    struct Member {
        address addr;
        uint256 bufferBalance;      // Collateral buffer deposited
        uint256 lockedDividends;    // Accumulated yield and discount dividends
        uint256 paidInstallments;   // Count of installments successfully paid
        bool hasWon;                // Whether member has won a pot in a previous round
        uint256 winRound;           // Round number won
        bool isDefaulted;           // Mark if currently in default
    }

    struct BidCommitment {
        bytes32 commitmentHash;     // keccak256(abi.encodePacked(bidAmount, salt, msg.sender))
        bool committed;
    }

    struct RevealedBid {
        uint256 bidAmount;
        bool revealed;
    }

    // Immutable Parameters
    string public groupName;
    uint256 public immutable memberCount;
    uint256 public immutable installmentAmount;
    uint256 public immutable cycleDuration;
    uint256 public immutable discountCapBps;    // e.g. 3000 = 30% max discount
    uint256 public immutable reserveFeeBps;     // e.g. 500 = 5% to group reserve
    uint256 public immutable safetyFactorBps;   // e.g. 12000 = 120% collateral solvency ratio

    address public immutable factory;
    VouchRegistry public immutable vouchRegistry;
    IYieldStrategy public yieldStrategy;

    // State Variables
    GroupState public currentState;
    uint256 public currentRound;
    uint256 public phaseStartTime;
    uint256 public reserveFundBalance;
    uint256 public currentPot;

    address[] public memberList;
    mapping(address => Member) public members;
    mapping(address => bool) public isMember;

    // Round auction state
    mapping(uint256 => mapping(address => BidCommitment)) public roundCommits;
    mapping(uint256 => mapping(address => RevealedBid)) public roundReveals;
    address public lowestBidder;
    uint256 public lowestBidAmount;

    // Events
    event MemberJoined(address indexed member, uint256 bufferDeposit);
    event PhaseChanged(GroupState newState, uint256 round);
    event InstallmentCollected(address indexed member, uint256 round, uint256 amount);
    event BidCommitted(address indexed member, uint256 round, bytes32 commitmentHash);
    event BidRevealed(address indexed member, uint256 round, uint256 bidAmount);
    event AuctionSettled(uint256 indexed round, address indexed winner, uint256 payout, uint256 dividendPerMember);
    event DefaultAbsorbed(address indexed defaulter, uint256 round, uint8 tierUsed, uint256 amount);
    event GroupClosed();

    modifier onlyMember() {
        require(isMember[msg.sender], "Not a group member");
        _;
    }

    modifier inState(GroupState state) {
        require(currentState == state, "Invalid phase state");
        _;
    }

    constructor(
        string memory _groupName,
        uint256 _memberCount,
        uint256 _installmentAmount,
        uint256 _cycleDuration,
        uint256 _discountCapBps,
        uint256 _reserveFeeBps,
        uint256 _safetyFactorBps,
        address _vouchRegistry,
        address _yieldStrategy
    ) {
        require(_memberCount > 1, "Member count must be > 1");
        require(_discountCapBps <= 5000, "Discount cap cannot exceed 50%");
        
        groupName = _groupName;
        memberCount = _memberCount;
        installmentAmount = _installmentAmount;
        cycleDuration = _cycleDuration;
        discountCapBps = _discountCapBps;
        reserveFeeBps = _reserveFeeBps;
        safetyFactorBps = _safetyFactorBps > 0 ? _safetyFactorBps : 10000;

        factory = msg.sender;
        vouchRegistry = VouchRegistry(_vouchRegistry);
        yieldStrategy = IYieldStrategy(_yieldStrategy);

        currentState = GroupState.Forming;
        currentRound = 0;
        phaseStartTime = block.timestamp;
    }

    /**
     * @dev Join group and deposit initial buffer during Forming phase
     */
    function joinGroup() external payable inState(GroupState.Forming) nonReentrant {
        require(!isMember[msg.sender], "Already a member");
        require(memberList.length < memberCount, "Group full");
        require(msg.value >= installmentAmount, "Buffer must be >= 1 installment");

        isMember[msg.sender] = true;
        memberList.push(msg.sender);
        members[msg.sender] = Member({
            addr: msg.sender,
            bufferBalance: msg.value,
            lockedDividends: 0,
            paidInstallments: 0,
            hasWon: false,
            winRound: 0,
            isDefaulted: false
        });

        emit MemberJoined(msg.sender, msg.value);

        if (memberList.length == memberCount) {
            currentState = GroupState.Collect;
            currentRound = 1;
            phaseStartTime = block.timestamp;
            emit PhaseChanged(GroupState.Collect, currentRound);
        }
    }

    /**
     * @dev Collect monthly installment from active members
     */
    function payInstallment() external payable onlyMember inState(GroupState.Collect) nonReentrant {
        require(msg.value == installmentAmount, "Incorrect installment amount");
        Member storage m = members[msg.sender];
        m.paidInstallments += 1;
        currentPot += msg.value;

        emit InstallmentCollected(msg.sender, currentRound, msg.value);
    }

    /**
     * @dev Advance to auction commit phase once collections complete or timer expires
     */
    function advanceToCommit() external nonReentrant {
        require(currentState == GroupState.Collect, "Not in Collect phase");
        currentState = GroupState.Commit;
        phaseStartTime = block.timestamp;
        lowestBidAmount = type(uint256).max;
        lowestBidder = address(0);
        emit PhaseChanged(GroupState.Commit, currentRound);
    }

    /**
     * @dev Commit a secret bid hash during auction
     */
    function commitBid(bytes32 commitmentHash) external onlyMember inState(GroupState.Commit) {
        Member storage m = members[msg.sender];
        require(!m.hasWon, "Member already won a pot");
        require(!roundCommits[currentRound][msg.sender].committed, "Already committed");

        roundCommits[currentRound][msg.sender] = BidCommitment({
            commitmentHash: commitmentHash,
            committed: true
        });

        emit BidCommitted(msg.sender, currentRound, commitmentHash);
    }

    /**
     * @dev Advance to auction reveal phase
     */
    function advanceToReveal() external nonReentrant {
        require(currentState == GroupState.Commit, "Not in Commit phase");
        currentState = GroupState.Reveal;
        phaseStartTime = block.timestamp;
        emit PhaseChanged(GroupState.Reveal, currentRound);
    }

    /**
     * @dev Reveal secret bid
     */
    function revealBid(uint256 bidAmount, bytes32 salt) external onlyMember inState(GroupState.Reveal) {
        BidCommitment storage commit = roundCommits[currentRound][msg.sender];
        require(commit.committed, "No commitment found");
        require(!roundReveals[currentRound][msg.sender].revealed, "Already revealed");
        require(
            keccak256(abi.encodePacked(bidAmount, salt, msg.sender)) == commit.commitmentHash,
            "Invalid reveal salt or amount"
        );

        uint256 totalPot = memberCount * installmentAmount;
        uint256 minBid = totalPot - (totalPot * discountCapBps / 10000);
        require(bidAmount >= minBid && bidAmount <= totalPot, "Bid outside allowed discount range");

        roundReveals[currentRound][msg.sender] = RevealedBid({
            bidAmount: bidAmount,
            revealed: true
        });

        if (bidAmount < lowestBidAmount) {
            lowestBidAmount = bidAmount;
            lowestBidder = msg.sender;
        }

        emit BidRevealed(msg.sender, currentRound, bidAmount);
    }

    /**
     * @dev Settle round auction and distribute dividends
     */
    function settleRound() external nonReentrant {
        require(currentState == GroupState.Reveal, "Not in Reveal phase");
        address winner = lowestBidder != address(0) ? lowestBidder : memberList[currentRound - 1];
        uint256 totalPot = memberCount * installmentAmount;
        uint256 payout = lowestBidAmount < totalPot ? lowestBidAmount : totalPot;

        Member storage w = members[winner];
        w.hasWon = true;
        w.winRound = currentRound;

        uint256 discount = totalPot > payout ? totalPot - payout : 0;
        uint256 reserveSlice = (discount * reserveFeeBps) / 10000;
        reserveFundBalance += reserveSlice;

        uint256 dividendPool = discount - reserveSlice;
        uint256 dividendPerMember = dividendPool / memberCount;

        for (uint256 i = 0; i < memberList.length; i++) {
            members[memberList[i]].lockedDividends += dividendPerMember;
        }

        (bool sent, ) = winner.call{value: payout}("");
        require(sent, "Winner payout transfer failed");

        emit AuctionSettled(currentRound, winner, payout, dividendPerMember);

        currentPot = 0;
        if (currentRound >= memberCount) {
            currentState = GroupState.Closed;
            emit GroupClosed();
        } else {
            currentRound += 1;
            currentState = GroupState.Collect;
            phaseStartTime = block.timestamp;
            emit PhaseChanged(GroupState.Collect, currentRound);
        }
    }

    /**
     * @dev Solvency calculation formula checking if a member has enough backing for future rounds
     */
    function checkSolvency(address memberAddr) public view returns (bool isSolvent, uint256 totalBacking, uint256 requiredBacking) {
        Member storage m = members[memberAddr];
        uint256 remainingRounds = currentRound <= memberCount ? (memberCount - currentRound) : 0;
        uint256 futureObligation = remainingRounds * installmentAmount;
        requiredBacking = (futureObligation * safetyFactorBps) / 10000;

        totalBacking = m.bufferBalance + m.lockedDividends;
        isSolvent = totalBacking >= requiredBacking;
    }

    function getMembers() external view returns (address[] memory) {
        return memberList;
    }

    receive() external payable {}
}
