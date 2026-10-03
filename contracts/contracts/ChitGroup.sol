// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VouchRegistry.sol";
import "./interfaces/IYieldStrategy.sol";

/**
 * @title ChitGroup
 * @dev Autonomous ROSCA / Chit Fund group on MST Blockchain.
 * Lifecycle & Bidding Schema:
 *   - 1st of Month: Autopay / Mandates Pooling (OMNET fiat-to-token -> BridgeKey wallet -> Group Pool)
 *   - 2nd - 30th of Month: Pooled money deployed to Aave De-Fi yield farming in Web3
 *   - 31st of Month: Secret Commit-Reveal Bidding (BIT fee cut & pooled in yield, lowest bid wins pot)
 *   - Settlement & Dividends: Remaining discount + Aave yield pooled as compounding interest dividends
 * Target EVM: Paris.
 */
contract ChitGroup is ReentrancyGuard {
    enum GroupState {
        Forming,
        Collect,        // 1st of Month: Autopay Mandates & Inflow Pooling
        Commit,         // 2nd-30th De-Fi Yield Staking & 31st Secret Sealed Bidding
        Reveal,         // 31st of Month: Secret Bid Reveal & Lowest Bidder Determination
        Settle,
        Closed
    }

    struct Member {
        address addr;
        uint256 bufferBalance;      // Deposited collateral buffer
        uint256 lockedDividends;    // Accumulated yield & discount dividends
        uint256 paidInstallments;   // Count of installments paid in total
        bool hasPaidCurrentRound;   // Flag for current round collection
        bool hasWon;                // Whether member won a pot previously
        uint256 winRound;           // Round won
        bool isDefaulted;           // Marked if currently unresolved in default
    }

    struct BridgeKeyMandate {
        bool active;
        uint256 maxAllowancePerRound;
        uint256 lastExecutedRound;
    }

    struct BidCommitment {
        bytes32 commitmentHash;     // keccak256(abi.encodePacked(bidAmount, salt, msg.sender))
        bool committed;
    }

    struct RevealedBid {
        uint256 bidAmount;
        bool revealed;
        uint256 timestamp;
    }

    // Immutable Parameters
    string public groupName;
    uint256 public immutable memberCount;
    uint256 public immutable installmentAmount;
    uint256 public immutable cycleDuration;
    uint256 public immutable discountCapBps;    // e.g., 3000 = 30% max discount (discount floor)
    uint256 public immutable reserveFeeBps;     // e.g., 500 = 5% BIT fee / reserve commission
    uint256 public immutable safetyFactorBps;   // e.g., 10000 = 100% collateral solvency ratio

    address public immutable factory;
    VouchRegistry public immutable vouchRegistry;
    IYieldStrategy public yieldStrategy;

    // State Variables
    GroupState public currentState;
    uint256 public currentRound;
    uint256 public phaseStartTime;
    uint256 public reserveFundBalance;          // Accumulated BIT fee & reserve pool
    uint256 public currentPot;
    uint256 public activeYieldShares;           // Shares currently staked in Aave / yield strategy
    uint256 public totalYieldEarnedAllRounds;
    uint256 public totalBitFeeAccumulated;

    address[] public memberList;
    mapping(address => Member) public members;
    mapping(address => bool) public isMember;
    mapping(address => BridgeKeyMandate) public bridgeKeyMandates;

    // Auction State per round
    mapping(uint256 => mapping(address => BidCommitment)) public roundCommits;
    mapping(uint256 => mapping(address => RevealedBid)) public roundReveals;
    address public lowestBidder;
    uint256 public lowestBidAmount;

    // Events
    event MemberJoined(address indexed member, uint256 bufferDeposit);
    event PhaseChanged(GroupState indexed newState, uint256 indexed round);
    event InstallmentCollected(address indexed member, uint256 indexed round, uint256 amount);
    event MandateRegistered(address indexed member, uint256 allowance);
    event MandateExecuted(address indexed member, uint256 indexed round, uint256 amount);
    event FundsDeployedToAave(uint256 indexed round, uint256 principalAmount, uint256 sharesReceived);
    event BidCommitted(address indexed member, uint256 indexed round, bytes32 commitmentHash);
    event BidRevealed(address indexed member, uint256 indexed round, uint256 bidAmount);
    event BitFeeDeducted(uint256 indexed round, uint256 bitAmount, uint256 totalBitPool);
    event AuctionSettled(
        uint256 indexed round,
        address indexed winner,
        uint256 payout,
        uint256 discount,
        uint256 bitFee,
        uint256 dividendPerMember,
        uint256 yieldEarned
    );
    event DefaultAbsorbed(address indexed defaulter, uint256 indexed round, uint8 tierUsed, uint256 amount);
    event SolvencyEnforced(address indexed member, uint256 requiredBacking, uint256 actualBacking, uint256 topUpHeld);
    event BalancesWithdrawn(address indexed member, uint256 bufferReturned, uint256 dividendsPaid);
    event GroupClosed();

    modifier onlyMember() {
        require(isMember[msg.sender], "Not a group member");
        _;
    }

    modifier inState(GroupState state) {
        require(currentState == state, "Invalid phase state for operation");
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
        require(_installmentAmount > 0, "Installment must be > 0");

        groupName = _groupName;
        memberCount = _memberCount;
        installmentAmount = _installmentAmount;
        cycleDuration = _cycleDuration;
        discountCapBps = _discountCapBps;
        reserveFeeBps = _reserveFeeBps;
        safetyFactorBps = _safetyFactorBps > 0 ? _safetyFactorBps : 10000;

        factory = msg.sender;
        vouchRegistry = VouchRegistry(payable(_vouchRegistry));
        yieldStrategy = IYieldStrategy(_yieldStrategy);

        currentState = GroupState.Forming;
        currentRound = 0;
        phaseStartTime = block.timestamp;
    }

    // ==========================================
    // 1. FORMING PHASE: JOIN & BUFFER
    // ==========================================

    function joinGroup() external payable inState(GroupState.Forming) nonReentrant {
        require(!isMember[msg.sender], "Already a member of this group");
        require(memberList.length < memberCount, "ChitGroup is full");
        require(msg.value >= installmentAmount, "Buffer deposit must be at least 1 installment");

        isMember[msg.sender] = true;
        memberList.push(msg.sender);
        members[msg.sender] = Member({
            addr: msg.sender,
            bufferBalance: msg.value,
            lockedDividends: 0,
            paidInstallments: 0,
            hasPaidCurrentRound: false,
            hasWon: false,
            winRound: 0,
            isDefaulted: false
        });

        emit MemberJoined(msg.sender, msg.value);

        if (memberList.length == memberCount) {
            currentState = GroupState.Collect;
            currentRound = 1;
            phaseStartTime = block.timestamp;
            _resetRoundFlags();
            emit PhaseChanged(GroupState.Collect, currentRound);
        }
    }

    // ==========================================
    // 2. DAY 1: AUTOPAY MANDATES & POOLING
    // ==========================================

    /**
     * @dev Register BridgeKey / OMNET Autopay Mandate for automated monthly deductions
     */
    function registerBridgeKeyMandate(uint256 maxAllowance) external onlyMember {
        require(maxAllowance >= installmentAmount, "Allowance must cover at least 1 installment");
        bridgeKeyMandates[msg.sender] = BridgeKeyMandate({
            active: true,
            maxAllowancePerRound: maxAllowance,
            lastExecutedRound: 0
        });
        emit MandateRegistered(msg.sender, maxAllowance);
    }

    /**
     * @dev Execute Autopay Mandate for a member (from BridgeKey pre-approved deposit)
     */
    function executeBridgeKeyMandate(address memberAddr) external payable nonReentrant {
        require(currentState == GroupState.Collect, "Must be in Collect phase");
        require(isMember[memberAddr], "Not a member");
        BridgeKeyMandate storage mandate = bridgeKeyMandates[memberAddr];
        require(mandate.active, "No active mandate");
        require(mandate.lastExecutedRound < currentRound, "Mandate already executed for this round");
        require(msg.value == installmentAmount, "Payment must equal monthly installment");

        Member storage m = members[memberAddr];
        require(!m.hasPaidCurrentRound, "Already paid for this round");

        mandate.lastExecutedRound = currentRound;
        m.paidInstallments += 1;
        m.hasPaidCurrentRound = true;
        currentPot += msg.value;

        emit MandateExecuted(memberAddr, currentRound, msg.value);
        emit InstallmentCollected(memberAddr, currentRound, msg.value);

        if (_allMembersPaid()) {
            _transitionToCommit();
        }
    }

    /**
     * @dev Manual monthly installment contribution
     */
    function payInstallment() external payable onlyMember inState(GroupState.Collect) nonReentrant {
        Member storage m = members[msg.sender];
        require(!m.hasPaidCurrentRound, "Installment already paid for this round");
        require(msg.value == installmentAmount, "Incorrect installment amount sent");

        m.paidInstallments += 1;
        m.hasPaidCurrentRound = true;
        currentPot += msg.value;

        emit InstallmentCollected(msg.sender, currentRound, msg.value);

        if (_allMembersPaid()) {
            _transitionToCommit();
        }
    }

    // ==========================================
    // 3. DAYS 2 - 30: AAVE DE-FI YIELD DEPLOYMENT
    // ==========================================

    function _deployPoolToYield() internal {
        if (address(yieldStrategy) != address(0) && currentPot > 0 && activeYieldShares == 0) {
            try yieldStrategy.deposit{value: currentPot}(currentPot) returns (uint256 shares) {
                activeYieldShares = shares;
                emit FundsDeployedToAave(currentRound, currentPot, shares);
            } catch {}
        }
    }

    /**
     * @dev Advance to auction commit phase once collections complete or timer triggers
     */
    function advanceToCommit() external nonReentrant {
        require(currentState == GroupState.Collect, "Must be in Collect phase");

        // Handle defaults for anyone who didn't pay
        for (uint256 i = 0; i < memberList.length; i++) {
            if (!members[memberList[i]].hasPaidCurrentRound) {
                handleMemberDefault(memberList[i]);
            }
        }

        _transitionToCommit();
    }

    function _transitionToCommit() internal {
        currentState = GroupState.Commit;
        phaseStartTime = block.timestamp;
        lowestBidAmount = type(uint256).max;
        lowestBidder = address(0);

        // Put pooled funds into Aave De-Fi yield strategy while auction runs
        _deployPoolToYield();

        emit PhaseChanged(GroupState.Commit, currentRound);
    }

    // ==========================================
    // 4. DAY 31: SECRET COMMIT-REVEAL REVERSE AUCTION
    // ==========================================

    /**
     * @dev Commit secret sealed bid hash: keccak256(abi.encodePacked(bidAmount, salt, msg.sender))
     */
    function commitBid(bytes32 commitmentHash) external onlyMember inState(GroupState.Commit) {
        Member storage m = members[msg.sender];
        require(!m.hasWon, "Member already won in a previous round");
        require(!roundCommits[currentRound][msg.sender].committed, "Already committed for this round");

        roundCommits[currentRound][msg.sender] = BidCommitment({
            commitmentHash: commitmentHash,
            committed: true
        });

        emit BidCommitted(msg.sender, currentRound, commitmentHash);
    }

    /**
     * @dev Advance to auction reveal phase on Day 31
     */
    function advanceToReveal() external inState(GroupState.Commit) nonReentrant {
        currentState = GroupState.Reveal;
        phaseStartTime = block.timestamp;
        emit PhaseChanged(GroupState.Reveal, currentRound);
    }

    /**
     * @dev Reveal secret bid amount and salt.
     * The lowest bid wins (member who accepts lowest payout / leaves highest discount for group).
     */
    function revealBid(uint256 bidAmount, bytes32 salt) external onlyMember inState(GroupState.Reveal) {
        BidCommitment storage commit = roundCommits[currentRound][msg.sender];
        require(commit.committed, "No valid commitment found for member");
        require(!roundReveals[currentRound][msg.sender].revealed, "Bid already revealed");
        require(
            keccak256(abi.encodePacked(bidAmount, salt, msg.sender)) == commit.commitmentHash,
            "Invalid reveal salt or bid amount"
        );

        uint256 totalPot = memberCount * installmentAmount;
        uint256 minBid = totalPot - ((totalPot * discountCapBps) / 10000); // Discount floor rule

        require(bidAmount >= minBid, "Bid violates maximum discount floor");
        require(bidAmount <= totalPot, "Bid cannot exceed full pot");

        roundReveals[currentRound][msg.sender] = RevealedBid({
            bidAmount: bidAmount,
            revealed: true,
            timestamp: block.timestamp
        });

        // Lowest bid wins the reverse auction
        if (bidAmount < lowestBidAmount) {
            lowestBidAmount = bidAmount;
            lowestBidder = msg.sender;
        }

        emit BidRevealed(msg.sender, currentRound, bidAmount);
    }

    // ==========================================
    // 5. SETTLEMENT, BIT MONEY CUT & DIVIDENDS
    // ==========================================

    /**
     * @dev Settle round:
     *   1. Harvest Aave De-Fi yield
     *   2. Determine winning bidder (lowest bid)
     *   3. Deduct BIT fee cut and pool into interest-bearing reserve
     *   4. Distribute left discount + Aave yield as dividends to members
     *   5. Enforce solvency and pay winner
     */
    function settleRound() external inState(GroupState.Reveal) nonReentrant {
        uint256 totalPot = memberCount * installmentAmount;
        uint256 yieldEarned = _harvestYield();
        totalYieldEarnedAllRounds += yieldEarned;

        // 1. Determine winner
        address winner = _determineWinner(totalPot);
        members[winner].hasWon = true;
        members[winner].winRound = currentRound;

        // 2. Calculate payout, discount & BIT cut
        uint256 basePayout = lowestBidAmount <= totalPot ? lowestBidAmount : totalPot;
        uint256 discount = totalPot > basePayout ? totalPot - basePayout : 0;
        uint256 bitFee = (discount * reserveFeeBps) / 10000;
        reserveFundBalance += bitFee;
        totalBitFeeAccumulated += bitFee;
        emit BitFeeDeducted(currentRound, bitFee, reserveFundBalance);

        // 3. Distribute remaining discount + Aave yield as dividends
        uint256 dividendPerMember = _distributeDividends(discount, bitFee, yieldEarned);

        // 4. Enforce solvency & execute payout
        uint256 finalPayout = _enforceWinnerSolvency(winner, basePayout);
        currentPot = 0;

        (bool sent, ) = winner.call{value: finalPayout}("");
        require(sent, "Winner payout transfer failed");

        emit AuctionSettled(
            currentRound,
            winner,
            finalPayout,
            discount,
            bitFee,
            dividendPerMember,
            yieldEarned
        );

        _advanceAfterSettlement();
    }

    function _determineWinner(uint256 totalPot) internal returns (address winner) {
        winner = lowestBidder;
        if (winner == address(0)) {
            for (uint256 i = 0; i < memberList.length; i++) {
                if (!members[memberList[i]].hasWon) {
                    winner = memberList[i];
                    lowestBidAmount = totalPot;
                    break;
                }
            }
        }
        require(winner != address(0), "No eligible winner found");
    }

    function _distributeDividends(
        uint256 discount,
        uint256 bitFee,
        uint256 yieldEarned
    ) internal returns (uint256 dividendPerMember) {
        uint256 dividendPool = (discount > bitFee ? discount - bitFee : 0) + yieldEarned;
        dividendPerMember = dividendPool / memberCount;

        for (uint256 i = 0; i < memberList.length; i++) {
            members[memberList[i]].lockedDividends += dividendPerMember;
        }
    }

    function _advanceAfterSettlement() internal {
        if (currentRound >= memberCount) {
            currentState = GroupState.Closed;
            emit GroupClosed();
        } else {
            currentRound += 1;
            currentState = GroupState.Collect;
            phaseStartTime = block.timestamp;
            _resetRoundFlags();
            emit PhaseChanged(GroupState.Collect, currentRound);
        }
    }

    function _harvestYield() internal returns (uint256 yieldEarned) {
        if (address(yieldStrategy) != address(0) && activeYieldShares > 0) {
            try yieldStrategy.withdraw(activeYieldShares) returns (uint256 amountWithYield) {
                if (amountWithYield > currentPot) {
                    yieldEarned = amountWithYield - currentPot;
                }
                activeYieldShares = 0;
            } catch {
                activeYieldShares = 0;
            }
        }
    }

    function _enforceWinnerSolvency(address winner, uint256 payout) internal returns (uint256) {
        (bool isSolvent, uint256 totalBacking, uint256 requiredBacking) = checkSolvency(winner);
        if (!isSolvent && requiredBacking > totalBacking) {
            uint256 deficit = requiredBacking - totalBacking;
            uint256 topUpHeld = deficit > payout ? payout : deficit;
            members[winner].bufferBalance += topUpHeld;
            emit SolvencyEnforced(winner, requiredBacking, totalBacking, topUpHeld);
            return payout - topUpHeld;
        }
        return payout;
    }

    // ==========================================
    // 6. DEFAULT WATERFALL (5 LAYERS)
    // ==========================================

    function handleMemberDefault(address defaulter) public nonReentrant {
        require(
            currentState == GroupState.Collect,
            "Invalid state for default handling"
        );
        require(isMember[defaulter], "Target is not a member");
        Member storage m = members[defaulter];
        require(!m.hasPaidCurrentRound, "Member already paid for this round");

        uint256 deficit = installmentAmount;

        // Layer 1: Member Collateral Buffer
        if (deficit > 0 && m.bufferBalance > 0) {
            uint256 absorbed = deficit > m.bufferBalance ? m.bufferBalance : deficit;
            m.bufferBalance -= absorbed;
            currentPot += absorbed;
            deficit -= absorbed;
            emit DefaultAbsorbed(defaulter, currentRound, 1, absorbed);
        }

        // Layer 2: Defaulter's Locked Dividends
        if (deficit > 0 && m.lockedDividends > 0) {
            uint256 absorbed = deficit > m.lockedDividends ? m.lockedDividends : deficit;
            m.lockedDividends -= absorbed;
            currentPot += absorbed;
            deficit -= absorbed;
            emit DefaultAbsorbed(defaulter, currentRound, 2, absorbed);
        }

        // Layer 3: Staked Voucher Capital
        if (deficit > 0 && address(vouchRegistry) != address(0)) {
            uint256 slashed = vouchRegistry.slashForMember(defaulter, deficit);
            if (slashed > 0) {
                currentPot += slashed;
                deficit -= (deficit > slashed ? slashed : deficit);
                emit DefaultAbsorbed(defaulter, currentRound, 3, slashed);
            }
        }

        // Layer 4: Protocol / BIT Reserve Fund
        if (deficit > 0 && reserveFundBalance > 0) {
            uint256 absorbed = deficit > reserveFundBalance ? reserveFundBalance : deficit;
            reserveFundBalance -= absorbed;
            currentPot += absorbed;
            deficit -= absorbed;
            emit DefaultAbsorbed(defaulter, currentRound, 4, absorbed);
        }

        // Layer 5: Pro-Rata Haircut across solvent members
        if (deficit > 0) {
            uint256 solventCount = 0;
            for (uint256 i = 0; i < memberList.length; i++) {
                if (memberList[i] != defaulter && !members[memberList[i]].isDefaulted) {
                    solventCount += 1;
                }
            }

            if (solventCount > 0) {
                uint256 haircutPerMember = deficit / solventCount;
                for (uint256 i = 0; i < memberList.length; i++) {
                    address solventAddr = memberList[i];
                    if (solventAddr != defaulter && !members[solventAddr].isDefaulted) {
                        if (members[solventAddr].lockedDividends >= haircutPerMember) {
                            members[solventAddr].lockedDividends -= haircutPerMember;
                        } else if (members[solventAddr].bufferBalance >= haircutPerMember) {
                            members[solventAddr].bufferBalance -= haircutPerMember;
                        }
                    }
                }
                currentPot += deficit;
                emit DefaultAbsorbed(defaulter, currentRound, 5, deficit);
                deficit = 0;
            }
        }

        m.isDefaulted = true;
        m.hasPaidCurrentRound = true;

        if (_allMembersPaid()) {
            _transitionToCommit();
        }
    }

    // ==========================================
    // 7. FINAL WITHDRAWAL & SOLVENCY
    // ==========================================

    function withdrawFinalBalances() external onlyMember inState(GroupState.Closed) nonReentrant {
        Member storage m = members[msg.sender];
        uint256 bufferPayout = m.bufferBalance;
        uint256 dividendPayout = m.lockedDividends;
        uint256 totalWithdraw = bufferPayout + dividendPayout;

        require(totalWithdraw > 0, "No remaining balance to withdraw");

        m.bufferBalance = 0;
        m.lockedDividends = 0;

        (bool sent, ) = msg.sender.call{value: totalWithdraw}("");
        require(sent, "Final balance transfer failed");

        emit BalancesWithdrawn(msg.sender, bufferPayout, dividendPayout);
    }

    function checkSolvency(address memberAddr) public view returns (
        bool isSolvent,
        uint256 totalBacking,
        uint256 requiredBacking
    ) {
        Member storage m = members[memberAddr];
        uint256 remainingRounds = currentRound <= memberCount ? (memberCount - currentRound) : 0;
        uint256 futureObligation = remainingRounds * installmentAmount;
        requiredBacking = (futureObligation * safetyFactorBps) / 10000;

        uint256 voucherBacking = 0;
        if (address(vouchRegistry) != address(0)) {
            voucherBacking = vouchRegistry.getMemberVouchBacking(memberAddr, address(this));
        }

        totalBacking = m.bufferBalance + m.lockedDividends + voucherBacking;
        isSolvent = totalBacking >= requiredBacking;
    }

    function _resetRoundFlags() internal {
        for (uint256 i = 0; i < memberList.length; i++) {
            members[memberList[i]].hasPaidCurrentRound = false;
        }
    }

    function _allMembersPaid() internal view returns (bool) {
        for (uint256 i = 0; i < memberList.length; i++) {
            if (!members[memberList[i]].hasPaidCurrentRound) {
                return false;
            }
        }
        return true;
    }

    function getMembers() external view returns (address[] memory) {
        return memberList;
    }

    function getMemberDetails(address memberAddr) external view returns (
        uint256 bufferBalance,
        uint256 lockedDividends,
        uint256 paidInstallments,
        bool hasPaidCurrentRound,
        bool hasWon,
        uint256 winRound,
        bool isDefaulted
    ) {
        Member storage m = members[memberAddr];
        return (
            m.bufferBalance,
            m.lockedDividends,
            m.paidInstallments,
            m.hasPaidCurrentRound,
            m.hasWon,
            m.winRound,
            m.isDefaulted
        );
    }

    receive() external payable {}
}
