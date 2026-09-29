// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ChitGroup.sol";
import "./VouchRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChitFactory
 * @dev Factory contract deploying and tracking autonomous ROSCA ChitGroups on MST Blockchain
 */
contract ChitFactory is Ownable {
    VouchRegistry public vouchRegistry;
    address public defaultYieldStrategy;

    address[] public deployedGroups;
    mapping(address => bool) public isDeployedGroup;

    event GroupCreated(
        address indexed groupAddress,
        string groupName,
        uint256 memberCount,
        uint256 installmentAmount,
        uint256 cycleDuration,
        uint256 discountCapBps,
        uint256 reserveFeeBps,
        uint256 safetyFactorBps
    );

    constructor(address _vouchRegistry, address _yieldStrategy) Ownable(msg.sender) {
        vouchRegistry = VouchRegistry(payable(_vouchRegistry));
        defaultYieldStrategy = _yieldStrategy;
    }

    function setVouchRegistry(address _vouchRegistry) external onlyOwner {
        vouchRegistry = VouchRegistry(payable(_vouchRegistry));
    }

    function setDefaultYieldStrategy(address _strategy) external onlyOwner {
        defaultYieldStrategy = _strategy;
    }

    function createGroup(
        string memory groupName,
        uint256 memberCount,
        uint256 installmentAmount,
        uint256 cycleDuration,
        uint256 discountCapBps,
        uint256 reserveFeeBps,
        uint256 safetyFactorBps
    ) external returns (address groupAddr) {
        ChitGroup newGroup = new ChitGroup(
            groupName,
            memberCount,
            installmentAmount,
            cycleDuration,
            discountCapBps,
            reserveFeeBps,
            safetyFactorBps,
            address(vouchRegistry),
            defaultYieldStrategy
        );

        groupAddr = address(newGroup);
        deployedGroups.push(groupAddr);
        isDeployedGroup[groupAddr] = true;

        // Auto-authorize new group in VouchRegistry if possible
        if (address(vouchRegistry) != address(0)) {
            try vouchRegistry.authorizeGroup(groupAddr, true) {} catch {}
        }

        emit GroupCreated(
            groupAddr,
            groupName,
            memberCount,
            installmentAmount,
            cycleDuration,
            discountCapBps,
            reserveFeeBps,
            safetyFactorBps
        );
    }

    function getDeployedGroups() external view returns (address[] memory) {
        return deployedGroups;
    }

    function getDeployedGroupsCount() external view returns (uint256) {
        return deployedGroups.length;
    }
}
