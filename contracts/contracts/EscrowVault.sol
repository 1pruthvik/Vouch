// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAaveYieldAdapter {
    function supply(address asset, uint256 amount) external;
    function withdraw(address asset, uint256 amount) external;
}

/**
 * @title EscrowVault
 * @notice Multi-token non-custodial asset vault for Vouch ROSCA pools on MST Blockchain.
 */
contract EscrowVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable underlyingToken;
    address public chitGroupContract;
    address public aaveAdapter;
    address public fxVault;

    event FundsDeposited(address indexed payer, uint256 amount);
    event FundsReleased(address indexed recipient, uint256 amount);
    event RoutedToYield(address indexed adapter, uint256 amount);
    event RecalledFromYield(address indexed adapter, uint256 amount);

    modifier onlyChitGroup() {
        require(msg.sender == chitGroupContract || msg.sender == owner(), "AUTH: Only ChitGroup or Owner");
        _;
    }

    constructor(address _underlyingToken) Ownable(msg.sender) {
        require(_underlyingToken != address(0), "INVALID_TOKEN");
        underlyingToken = IERC20(_underlyingToken);
    }

    function setChitGroup(address _chitGroup) external onlyOwner {
        require(chitGroupContract == address(0), "ALREADY_INITIALIZED");
        chitGroupContract = _chitGroup;
    }

    function setAdapters(address _aaveAdapter, address _fxVault) external onlyOwner {
        aaveAdapter = _aaveAdapter;
        fxVault = _fxVault;
    }

    function deposit(address payer, uint256 amount) external onlyChitGroup nonReentrant {
        require(amount > 0, "INVALID_AMOUNT");
        underlyingToken.safeTransferFrom(payer, address(this), amount);
        emit FundsDeposited(payer, amount);
    }

    function release(address recipient, uint256 amount) external onlyChitGroup nonReentrant {
        require(recipient != address(0), "INVALID_RECIPIENT");
        require(amount <= underlyingToken.balanceOf(address(this)), "INSUFFICIENT_LIQUIDITY");
        underlyingToken.safeTransfer(recipient, amount);
        emit FundsReleased(recipient, amount);
    }

    function deployToAaveYield(uint256 amount) external onlyChitGroup nonReentrant {
        require(aaveAdapter != address(0), "ADAPTER_NOT_SET");
        underlyingToken.safeIncreaseAllowance(aaveAdapter, amount);
        IAaveYieldAdapter(aaveAdapter).supply(address(underlyingToken), amount);
        emit RoutedToYield(aaveAdapter, amount);
    }

    function recallFromAaveYield(uint256 amount) external onlyChitGroup nonReentrant {
        require(aaveAdapter != address(0), "ADAPTER_NOT_SET");
        IAaveYieldAdapter(aaveAdapter).withdraw(address(underlyingToken), amount);
        emit RecalledFromYield(aaveAdapter, amount);
    }

    function getVaultBalance() external view returns (uint256) {
        return underlyingToken.balanceOf(address(this));
    }
}
