// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChitGovernance
 * @notice Centralized-to-Decentralized Transition & Admin Step-Down Module.
 */
contract ChitGovernance is Ownable {
    enum GovernancePhase { ADMIN_CONTROLLED, MULTISIG_CONTROLLED, FULLY_DECENTRALIZED }
    
    GovernancePhase public currentPhase;
    address public admin;
    address public communityTimelock;
    uint256 public constant STEP_DOWN_COOLDOWN = 7 days;
    uint256 public stepDownInitiatedAt;

    event AdminStepDownInitiated(address indexed currentAdmin, address indexed targetGovernance, uint256 effectiveTimestamp);
    event AdminStepDownFinalized(address indexed previousAdmin, GovernancePhase newPhase);

    modifier onlyAdmin() {
        require(msg.sender == admin || msg.sender == owner(), "AUTH: Caller is not Admin");
        _;
    }

    constructor(address _initialAdmin) Ownable(msg.sender) {
        admin = _initialAdmin != address(0) ? _initialAdmin : msg.sender;
        currentPhase = GovernancePhase.ADMIN_CONTROLLED;
    }

    function initiateAdminStepDown(address _communityGovernanceAddress) external onlyAdmin {
        require(_communityGovernanceAddress != address(0), "INVALID_ADDRESS");
        stepDownInitiatedAt = block.timestamp;
        communityTimelock = _communityGovernanceAddress;
        emit AdminStepDownInitiated(admin, _communityGovernanceAddress, block.timestamp + STEP_DOWN_COOLDOWN);
    }

    function finalizeAdminStepDown() external {
        require(stepDownInitiatedAt > 0, "NOT_INITIATED");
        require(block.timestamp >= stepDownInitiatedAt + STEP_DOWN_COOLDOWN, "TIMELOCK_ACTIVE");
        
        address oldAdmin = admin;
        admin = address(0);
        currentPhase = GovernancePhase.FULLY_DECENTRALIZED;
        _transferOwnership(communityTimelock);
        
        emit AdminStepDownFinalized(oldAdmin, currentPhase);
    }
}
