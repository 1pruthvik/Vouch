// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BITReserve
 * @notice Buffer & Insurance Tranche accumulator and end-term dividend distributor.
 */
contract BITReserve is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public chitGroup;
    uint256 public totalAccumulatedBIT;

    struct RoundBITRecord {
        uint256 round;
        uint256 bitDeducted;
        uint256 timestamp;
    }

    RoundBITRecord[] public bitHistory;

    event BITDeducted(uint256 indexed round, uint256 amount, uint256 cumulativeTotal);
    event EndTermBITDisbursed(address indexed member, uint256 payoutAmount);

    modifier onlyChitGroup() {
        require(msg.sender == chitGroup || msg.sender == owner(), "AUTH: Only ChitGroup or Owner");
        _;
    }

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "INVALID_TOKEN");
        token = IERC20(_token);
    }

    function setChitGroup(address _chitGroup) external onlyOwner {
        require(chitGroup == address(0), "ALREADY_SET");
        chitGroup = _chitGroup;
    }

    function recordBIT(uint256 round, uint256 amount) external onlyChitGroup {
        require(amount > 0, "INVALID_AMOUNT");
        totalAccumulatedBIT += amount;
        bitHistory.push(RoundBITRecord({
            round: round,
            bitDeducted: amount,
            timestamp: block.timestamp
        }));

        emit BITDeducted(round, amount, totalAccumulatedBIT);
    }

    function disburseEndTerm(address[] calldata members, uint256 totalYieldInterest) external onlyChitGroup {
        require(members.length > 0, "EMPTY_MEMBERS");
        uint256 totalDistributionPool = totalAccumulatedBIT + totalYieldInterest;
        uint256 perMemberShare = totalDistributionPool / members.length;

        for (uint256 i = 0; i < members.length; i++) {
            if (perMemberShare > 0 && token.balanceOf(address(this)) >= perMemberShare) {
                token.safeTransfer(members[i], perMemberShare);
                emit EndTermBITDisbursed(members[i], perMemberShare);
            }
        }

        totalAccumulatedBIT = 0;
    }

    function getHistoryLength() external view returns (uint256) {
        return bitHistory.length;
    }
}
