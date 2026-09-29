// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface IAToken is IERC20 {}

/**
 * @title AaveYieldAdapter
 * @notice Adapter for supplying idle ROSCA funds to Aave v3 pools on MST Blockchain.
 */
contract AaveYieldAdapter is Ownable {
    using SafeERC20 for IERC20;

    IPool public immutable aavePool;
    address public escrowVault;

    mapping(address => address) public aTokens;

    event SuppliedToAave(address indexed asset, uint256 amount);
    event WithdrawnFromAave(address indexed asset, uint256 amount);

    modifier onlyVault() {
        require(msg.sender == escrowVault || msg.sender == owner(), "AUTH: Only EscrowVault");
        _;
    }

    constructor(address _aavePool) Ownable(msg.sender) {
        aavePool = IPool(_aavePool);
    }

    function setEscrowVault(address _vault) external onlyOwner {
        escrowVault = _vault;
    }

    function setAToken(address asset, address aToken) external onlyOwner {
        aTokens[asset] = aToken;
    }

    function supply(address asset, uint256 amount) external onlyVault {
        require(amount > 0, "INVALID_AMOUNT");
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(asset).safeIncreaseAllowance(address(aavePool), amount);
        
        if (address(aavePool) != address(0)) {
            aavePool.supply(asset, amount, address(this), 0);
        }
        emit SuppliedToAave(asset, amount);
    }

    function withdraw(address asset, uint256 amount) external onlyVault returns (uint256) {
        require(amount > 0, "INVALID_AMOUNT");
        uint256 withdrawn = amount;
        if (address(aavePool) != address(0)) {
            withdrawn = aavePool.withdraw(asset, amount, msg.sender);
        } else {
            IERC20(asset).safeTransfer(msg.sender, amount);
        }
        emit WithdrawnFromAave(asset, withdrawn);
        return withdrawn;
    }

    function getAccruedYield(address asset) external view returns (uint256) {
        address aToken = aTokens[asset];
        if (aToken == address(0)) return 0;
        return IAToken(aToken).balanceOf(address(this));
    }
}
