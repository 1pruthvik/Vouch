// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VouchRegistry
 * @dev Manages social staked vouching where vouchers stake capital to back chit fund members
 */
contract VouchRegistry is Ownable, ReentrancyGuard {
    struct Voucher {
        uint256 totalStaked;
        uint256 lockedStake;
        uint256 reputationScore; // 0 to 10000
        uint256 activeVoucheeCount;
    }

    struct VouchRecord {
        address voucher;
        address vouchee;
        address chitGroup;
        uint256 stakedAmount;
        bool active;
    }

    uint256 public constant MAX_VOUCHEES_PER_VOUCHER = 5;

    // voucher address => Voucher details
    mapping(address => Voucher) public vouchers;
    // vouchee address => list of VouchRecord IDs
    mapping(address => bytes32[]) public voucheeRecords;
    // recordId => VouchRecord
    mapping(bytes32 => VouchRecord) public records;
    // authorized ChitGroups allowed to slash
    mapping(address => bool) public authorizedGroups;

    event StakeDeposited(address indexed voucher, uint256 amount);
    event StakeWithdrawn(address indexed voucher, uint256 amount);
    event VouchRegistered(bytes32 indexed recordId, address indexed voucher, address indexed vouchee, address chitGroup, uint256 amount);
    event VoucherSlashed(address indexed voucher, address indexed vouchee, address indexed chitGroup, uint256 amount);
    event GroupAuthorized(address indexed chitGroup, bool status);

    modifier onlyAuthorizedGroup() {
        require(authorizedGroups[msg.sender], "Caller is not an authorized ChitGroup");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function authorizeGroup(address group, bool status) external onlyOwner {
        authorizedGroups[group] = status;
        emit GroupAuthorized(group, status);
    }

    function depositStake() external payable nonReentrant {
        require(msg.value > 0, "Stake amount must be > 0");
        vouchers[msg.sender].totalStaked += msg.value;
        if (vouchers[msg.sender].reputationScore == 0) {
            vouchers[msg.sender].reputationScore = 1000; // Base score
        }
        emit StakeDeposited(msg.sender, msg.value);
    }

    function withdrawStake(uint256 amount) external nonReentrant {
        Voucher storage v = vouchers[msg.sender];
        require(v.totalStaked - v.lockedStake >= amount, "Stake is currently locked");
        v.totalStaked -= amount;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send stake");
        emit StakeWithdrawn(msg.sender, amount);
    }

    function registerVouch(address vouchee, address chitGroup, uint256 amount) external nonReentrant returns (bytes32 recordId) {
        Voucher storage v = vouchers[msg.sender];
        require(v.totalStaked - v.lockedStake >= amount, "Insufficient free stake");
        require(v.activeVoucheeCount < MAX_VOUCHEES_PER_VOUCHER, "Exceeded max vouchees");

        v.lockedStake += amount;
        v.activeVoucheeCount += 1;

        recordId = keccak256(abi.encodePacked(msg.sender, vouchee, chitGroup, block.timestamp));
        records[recordId] = VouchRecord({
            voucher: msg.sender,
            vouchee: vouchee,
            chitGroup: chitGroup,
            stakedAmount: amount,
            active: true
        });
        voucheeRecords[vouchee].push(recordId);

        emit VouchRegistered(recordId, msg.sender, vouchee, chitGroup, amount);
    }

    function slashVoucher(bytes32 recordId, uint256 amount) external onlyAuthorizedGroup nonReentrant returns (uint256 slashed) {
        VouchRecord storage record = records[recordId];
        require(record.active, "Vouch record not active");
        require(record.chitGroup == msg.sender, "ChitGroup mismatch");

        slashed = amount > record.stakedAmount ? record.stakedAmount : amount;
        record.stakedAmount -= slashed;
        vouchers[record.voucher].lockedStake -= slashed;
        vouchers[record.voucher].totalStaked -= slashed;

        // Reduce voucher reputation
        if (vouchers[record.voucher].reputationScore > 200) {
            vouchers[record.voucher].reputationScore -= 200;
        }

        (bool sent, ) = msg.sender.call{value: slashed}("");
        require(sent, "Slash payout transfer failed");

        emit VoucherSlashed(record.voucher, record.vouchee, msg.sender, slashed);
    }

    function getFreeStake(address voucher) external view returns (uint256) {
        return vouchers[voucher].totalStaked - vouchers[voucher].lockedStake;
    }
}
