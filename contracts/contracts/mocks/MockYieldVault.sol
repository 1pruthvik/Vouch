// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IYieldStrategy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MockYieldVault
 * @dev Simulated yield vault generating returns on idle ROSCA pot and dividend pools.
 */
contract MockYieldVault is IYieldStrategy, Ownable, ReentrancyGuard {
    uint256 public simulatedAPR = 500; // 5.00% APR in bps
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public depositTimestamps;

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 principal, uint256 yieldEarned);
    event APRUpdated(uint256 newAprBps);

    constructor() Ownable(msg.sender) {}

    function setAPR(uint256 newAprBps) external onlyOwner {
        simulatedAPR = newAprBps;
        emit APRUpdated(newAprBps);
    }

    function deposit(uint256 amount) external payable override nonReentrant returns (uint256) {
        require(msg.value == amount && amount > 0, "Invalid deposit amount");
        deposits[msg.sender] += amount;
        depositTimestamps[msg.sender] = block.timestamp;
        emit Deposited(msg.sender, amount);
        return amount;
    }

    function withdraw(uint256 shares) external override nonReentrant returns (uint256) {
        require(deposits[msg.sender] >= shares, "Insufficient shares in vault");
        uint256 timeElapsed = block.timestamp - depositTimestamps[msg.sender];
        if (timeElapsed == 0) {
            timeElapsed = 1; // Base micro-yield for instant demo triggers
        }

        // yield = (principal * APR * timeElapsed) / (365 days * 10000)
        uint256 yieldEarned = (shares * simulatedAPR * timeElapsed) / (365 days * 10000);
        uint256 totalPayout = shares + yieldEarned;

        // If vault does not have enough extra native balance to pay full yield, pay what is available
        if (address(this).balance < totalPayout) {
            totalPayout = address(this).balance >= shares ? shares : address(this).balance;
            yieldEarned = totalPayout > shares ? totalPayout - shares : 0;
        }

        deposits[msg.sender] -= shares;

        (bool sent, ) = msg.sender.call{value: totalPayout}("");
        require(sent, "Yield withdrawal failed");

        emit Withdrawn(msg.sender, shares, yieldEarned);
        return totalPayout;
    }

    function getBalance(address account) external view override returns (uint256) {
        return deposits[account];
    }

    function estimatedAPR() external view override returns (uint256) {
        return simulatedAPR;
    }

    // Allows owner to fund simulated yield reserves
    function fundYieldReserves() external payable {}

    receive() external payable {}
}
