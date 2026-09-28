// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IYieldStrategy
 * @dev Interface for yield generation on idle ROSCA pot funds and rolled dividend pools
 */
interface IYieldStrategy {
    function deposit(uint256 amount) external payable returns (uint256 shares);
    function withdraw(uint256 shares) external returns (uint256 amountWithYield);
    function getBalance(address account) external view returns (uint256);
    function estimatedAPR() external view returns (uint256);
}
