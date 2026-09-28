// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IYieldStrategy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockYieldVault
 * @dev Simulated yield vault with configurable simulated APR for idle Chit pot and dividend funds
 */
contract MockYieldVault is IYieldStrategy, Ownable {
    uint256 public simulatedAPR = 500; // 5.00% APR in bps
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public depositTimestamps;

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 principal, uint256 yieldEarned);

    constructor() Ownable(msg.sender) {}

    function setAPR(uint256 newAprBps) external onlyOwner {
        simulatedAPR = newAprBps;
    }

    function deposit(uint256 amount) external payable override returns (uint256) {
        deposits[msg.sender] += amount;
        depositTimestamps[msg.sender] = block.timestamp;
        emit Deposited(msg.sender, amount);
        return amount;
    }

    function withdraw(uint256 shares) external override returns (uint256) {
        require(deposits[msg.sender] >= shares, "Insufficient balance");
        uint256 timeElapsed = block.timestamp - depositTimestamps[msg.sender];
        // yield = principal * APR * time / (365 days * 10000)
        uint256 yieldEarned = (shares * simulatedAPR * timeElapsed) / (365 days * 10000);
        uint256 totalPayout = shares + yieldEarned;
        deposits[msg.sender] -= shares;

        emit Withdrawn(msg.sender, shares, yieldEarned);
        return totalPayout;
    }

    function getBalance(address account) external view override returns (uint256) {
        return deposits[account];
    }

    function estimatedAPR() external view override returns (uint256) {
        return simulatedAPR;
    }
}
