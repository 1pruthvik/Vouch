// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CommitRevealAuction
 * @notice Secret commit-reveal reverse auction engine for Vouch ROSCA pools on MST Blockchain.
 */
contract CommitRevealAuction is Ownable {
    enum AuctionState { INACTIVE, COMMIT_OPEN, REVEAL_OPEN, SETTLED }

    struct BidRecord {
        bytes32 commitHash;
        uint256 revealedBid;
        bool isRevealed;
    }

    struct RoundAuction {
        uint256 roundNumber;
        uint256 totalPot;
        uint256 minBidFloor;
        AuctionState state;
        uint256 commitDeadline;
        uint256 revealDeadline;
        address winningBidder;
        uint256 winningBidAmount;
        address[] bidders;
    }

    mapping(uint256 => RoundAuction) public roundAuctions;
    mapping(uint256 => mapping(address => BidRecord)) public bids;

    event AuctionOpened(uint256 indexed round, uint256 totalPot, uint256 commitDeadline, uint256 revealDeadline);
    event BidCommitted(uint256 indexed round, address indexed bidder, bytes32 commitHash);
    event BidRevealed(uint256 indexed round, address indexed bidder, uint256 bidAmount);
    event AuctionSettled(uint256 indexed round, address indexed winner, uint256 winningBid, uint256 discount);

    constructor() Ownable(msg.sender) {}

    function openAuction(
        uint256 round,
        uint256 totalPot,
        uint256 maxDiscountBps,
        uint256 commitDuration,
        uint256 revealDuration
    ) external onlyOwner {
        require(roundAuctions[round].state == AuctionState.INACTIVE, "ALREADY_ACTIVE");
        
        uint256 floor = (totalPot * (10000 - maxDiscountBps)) / 10000;

        roundAuctions[round] = RoundAuction({
            roundNumber: round,
            totalPot: totalPot,
            minBidFloor: floor,
            state: AuctionState.COMMIT_OPEN,
            commitDeadline: block.timestamp + commitDuration,
            revealDeadline: block.timestamp + commitDuration + revealDuration,
            winningBidder: address(0),
            winningBidAmount: totalPot,
            bidders: new address[](0)
        });

        emit AuctionOpened(round, totalPot, block.timestamp + commitDuration, block.timestamp + commitDuration + revealDuration);
    }

    function commitBid(uint256 round, bytes32 commitHash) external {
        RoundAuction storage auction = roundAuctions[round];
        require(auction.state == AuctionState.COMMIT_OPEN, "COMMIT_CLOSED");
        require(block.timestamp <= auction.commitDeadline, "COMMIT_DEADLINE_PASSED");
        require(bids[round][msg.sender].commitHash == bytes32(0), "BID_ALREADY_COMMITTED");

        bids[round][msg.sender] = BidRecord({
            commitHash: commitHash,
            revealedBid: 0,
            isRevealed: false
        });
        auction.bidders.push(msg.sender);

        emit BidCommitted(round, msg.sender, commitHash);
    }

    function revealBid(uint256 round, uint256 bidAmount, string calldata salt) external {
        RoundAuction storage auction = roundAuctions[round];
        if (block.timestamp > auction.commitDeadline && auction.state == AuctionState.COMMIT_OPEN) {
            auction.state = AuctionState.REVEAL_OPEN;
        }
        require(auction.state == AuctionState.REVEAL_OPEN, "REVEAL_NOT_OPEN");
        require(block.timestamp <= auction.revealDeadline, "REVEAL_DEADLINE_PASSED");

        BidRecord storage record = bids[round][msg.sender];
        require(record.commitHash != bytes32(0), "NO_BID_COMMITTED");
        require(!record.isRevealed, "ALREADY_REVEALED");

        bytes32 verificationHash = keccak256(abi.encodePacked(bidAmount, salt, msg.sender));
        require(verificationHash == record.commitHash, "HASH_MISMATCH");
        require(bidAmount >= auction.minBidFloor && bidAmount <= auction.totalPot, "BID_OUT_OF_BOUNDS");

        record.revealedBid = bidAmount;
        record.isRevealed = true;

        if (bidAmount < auction.winningBidAmount) {
            auction.winningBidAmount = bidAmount;
            auction.winningBidder = msg.sender;
        }

        emit BidRevealed(round, msg.sender, bidAmount);
    }

    function settleAuction(uint256 round) external onlyOwner returns (address winner, uint256 winningBid, uint256 discount) {
        RoundAuction storage auction = roundAuctions[round];
        require(auction.state == AuctionState.REVEAL_OPEN || block.timestamp > auction.revealDeadline, "CANNOT_SETTLE");
        
        auction.state = AuctionState.SETTLED;
        
        winner = auction.winningBidder;
        winningBid = auction.winningBidAmount;
        discount = auction.totalPot - winningBid;

        emit AuctionSettled(round, winner, winningBid, discount);
    }
}
