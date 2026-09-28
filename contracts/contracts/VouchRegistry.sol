// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VouchRegistry
 * @dev Manages social staked vouching where vouchers stake capital to back chit fund members.
 * Implements stake locking, maximum vouchee limits, reputation tracking, and authorized slashing.
 */
contract VouchRegistry is Ownable, ReentrancyGuard {
    struct Voucher {
        uint256 totalStaked;
        uint256 lockedStake;
        uint256 reputationScore; // 0 to 10000 (1000 = base baseline)
        uint256 activeVoucheeCount;
    }

    struct VouchRecord {
        bytes32 recordId;
        address voucher;
        address vouchee;
        address chitGroup;
        uint256 stakedAmount;
        bool active;
        uint256 timestamp;
    }

    uint256 public constant MAX_VOUCHEES_PER_VOUCHER = 5;

    // voucher address => Voucher details
    mapping(address => Voucher) public vouchers;
    // vouchee address => array of VouchRecord IDs
    mapping(address => bytes32[]) private _voucheeRecords;
    // recordId => VouchRecord
    mapping(bytes32 => VouchRecord) public records;
    // authorized ChitGroups allowed to slash
    mapping(address => bool) public authorizedGroups;

    event StakeDeposited(address indexed voucher, uint256 amount);
    event StakeWithdrawn(address indexed voucher, uint256 amount);
    event VouchRegistered(bytes32 indexed recordId, address indexed voucher, address indexed vouchee, address chitGroup, uint256 amount);
    event VouchReleased(bytes32 indexed recordId, address indexed voucher, address indexed vouchee);
    event VoucherSlashed(bytes32 indexed recordId, address indexed voucher, address indexed vouchee, address chitGroup, uint256 amount);
    event GroupAuthorized(address indexed chitGroup, bool status);
    event ReputationUpdated(address indexed voucher, uint256 newScore);

    modifier onlyAuthorizedGroup() {
        require(authorizedGroups[msg.sender], "Caller is not an authorized ChitGroup");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Authorize or revoke ChitGroup contract addresses
     */
    function authorizeGroup(address group, bool status) external onlyOwner {
        require(group != address(0), "Invalid group address");
        authorizedGroups[group] = status;
        emit GroupAuthorized(group, status);
    }

    /**
     * @dev Deposit stake to become or fund voucher balance
     */
    function depositStake() external payable nonReentrant {
        require(msg.value > 0, "Stake amount must be > 0");
        Voucher storage v = vouchers[msg.sender];
        v.totalStaked += msg.value;
        if (v.reputationScore == 0) {
            v.reputationScore = 1000; // Baseline reputation score
        }
        emit StakeDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw unallocated / free stake
     */
    function withdrawStake(uint256 amount) external nonReentrant {
        Voucher storage v = vouchers[msg.sender];
        require(v.totalStaked - v.lockedStake >= amount, "Insufficient free stake to withdraw");
        v.totalStaked -= amount;
        
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send stake to voucher");

        emit StakeWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Voucher registers capital backing for a specific member in a ChitGroup
     */
    function registerVouch(address vouchee, address chitGroup, uint256 amount) external nonReentrant returns (bytes32 recordId) {
        require(vouchee != address(0) && chitGroup != address(0), "Invalid addresses");
        require(vouchee != msg.sender, "Cannot vouch for oneself");
        require(amount > 0, "Vouch amount must be > 0");

        Voucher storage v = vouchers[msg.sender];
        require(v.totalStaked - v.lockedStake >= amount, "Insufficient free stake");
        require(v.activeVoucheeCount < MAX_VOUCHEES_PER_VOUCHER, "Exceeded max vouchees limit");

        v.lockedStake += amount;
        v.activeVoucheeCount += 1;

        recordId = keccak256(abi.encodePacked(msg.sender, vouchee, chitGroup, block.timestamp, _voucheeRecords[vouchee].length));
        records[recordId] = VouchRecord({
            recordId: recordId,
            voucher: msg.sender,
            vouchee: vouchee,
            chitGroup: chitGroup,
            stakedAmount: amount,
            active: true,
            timestamp: block.timestamp
        });

        _voucheeRecords[vouchee].push(recordId);

        emit VouchRegistered(recordId, msg.sender, vouchee, chitGroup, amount);
    }

    /**
     * @dev Slashes voucher stake when a vouchee defaults. Called exclusively by authorized ChitGroup.
     */
    function slashVoucher(bytes32 recordId, uint256 amount) external onlyAuthorizedGroup nonReentrant returns (uint256 slashed) {
        VouchRecord storage record = records[recordId];
        require(record.active, "Vouch record is not active");
        require(record.chitGroup == msg.sender, "ChitGroup mismatch on slash");

        slashed = amount > record.stakedAmount ? record.stakedAmount : amount;
        record.stakedAmount -= slashed;
        if (record.stakedAmount == 0) {
            record.active = false;
            if (vouchers[record.voucher].activeVoucheeCount > 0) {
                vouchers[record.voucher].activeVoucheeCount -= 1;
            }
        }

        vouchers[record.voucher].lockedStake -= slashed;
        vouchers[record.voucher].totalStaked -= slashed;

        // Penalty on reputation score
        if (vouchers[record.voucher].reputationScore > 200) {
            vouchers[record.voucher].reputationScore -= 200;
        } else {
            vouchers[record.voucher].reputationScore = 0;
        }

        (bool sent, ) = msg.sender.call{value: slashed}("");
        require(sent, "Slash payout transfer failed");

        emit VoucherSlashed(recordId, record.voucher, record.vouchee, msg.sender, slashed);
        emit ReputationUpdated(record.voucher, vouchers[record.voucher].reputationScore);
    }

    /**
     * @dev Slashes active vouchers backing a specific member up to the requested deficit amount.
     */
    function slashForMember(address vouchee, uint256 amountNeeded) external onlyAuthorizedGroup nonReentrant returns (uint256 totalSlashed) {
        bytes32[] memory recIds = _voucheeRecords[vouchee];
        totalSlashed = 0;

        for (uint256 i = 0; i < recIds.length && totalSlashed < amountNeeded; i++) {
            VouchRecord storage record = records[recIds[i]];
            if (record.active && record.chitGroup == msg.sender && record.stakedAmount > 0) {
                uint256 needed = amountNeeded - totalSlashed;
                uint256 toSlash = needed > record.stakedAmount ? record.stakedAmount : needed;

                record.stakedAmount -= toSlash;
                vouchers[record.voucher].lockedStake -= toSlash;
                vouchers[record.voucher].totalStaked -= toSlash;
                totalSlashed += toSlash;

                if (record.stakedAmount == 0) {
                    record.active = false;
                    if (vouchers[record.voucher].activeVoucheeCount > 0) {
                        vouchers[record.voucher].activeVoucheeCount -= 1;
                    }
                }

                // Penalty on reputation score
                if (vouchers[record.voucher].reputationScore > 200) {
                    vouchers[record.voucher].reputationScore -= 200;
                } else {
                    vouchers[record.voucher].reputationScore = 0;
                }

                emit VoucherSlashed(record.recordId, record.voucher, record.vouchee, msg.sender, toSlash);
                emit ReputationUpdated(record.voucher, vouchers[record.voucher].reputationScore);
            }
        }

        if (totalSlashed > 0) {
            (bool sent, ) = msg.sender.call{value: totalSlashed}("");
            require(sent, "Slash transfer failed");
        }
    }

    /**
     * @dev Release locked vouch stake after successful group completion
     */
    function releaseVouch(bytes32 recordId) external nonReentrant {
        VouchRecord storage record = records[recordId];
        require(record.active, "Record not active");
        require(
            msg.sender == record.voucher || authorizedGroups[msg.sender] || msg.sender == owner(),
            "Unauthorized to release vouch"
        );

        record.active = false;
        vouchers[record.voucher].lockedStake -= record.stakedAmount;
        if (vouchers[record.voucher].activeVoucheeCount > 0) {
            vouchers[record.voucher].activeVoucheeCount -= 1;
        }

        // Reward reputation score for successful backing
        vouchers[record.voucher].reputationScore = min(10000, vouchers[record.voucher].reputationScore + 50);

        emit VouchReleased(recordId, record.voucher, record.vouchee);
        emit ReputationUpdated(record.voucher, vouchers[record.voucher].reputationScore);
    }

    /**
     * @dev Get total active voucher backing for a member in a specific ChitGroup
     */
    function getMemberVouchBacking(address vouchee, address chitGroup) external view returns (uint256 totalBacking) {
        bytes32[] memory recIds = _voucheeRecords[vouchee];
        for (uint256 i = 0; i < recIds.length; i++) {
            VouchRecord storage rec = records[recIds[i]];
            if (rec.active && (chitGroup == address(0) || rec.chitGroup == chitGroup)) {
                totalBacking += rec.stakedAmount;
            }
        }
    }

    function getVoucheeRecords(address vouchee) external view returns (bytes32[] memory) {
        return _voucheeRecords[vouchee];
    }

    function getFreeStake(address voucher) external view returns (uint256) {
        return vouchers[voucher].totalStaked - vouchers[voucher].lockedStake;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    receive() external payable {
        Voucher storage v = vouchers[msg.sender];
        v.totalStaked += msg.value;
        if (v.reputationScore == 0) {
            v.reputationScore = 1000;
        }
        emit StakeDeposited(msg.sender, msg.value);
    }
}
