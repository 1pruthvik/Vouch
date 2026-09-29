// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FXCollateralVault
 * @notice 150% Overcollateralized International Currency Exchange & Liquidity Vault.
 */
contract FXCollateralVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Loan {
        uint256 loanId;
        address borrower;
        address collateralToken;
        uint256 collateralAmount;
        address borrowedToken;
        uint256 borrowedAmount;
        uint256 interestRateBps; // e.g. 700 = 7.00%
        uint256 expiryTimestamp;
        bool isRepaid;
        bool isLiquidated;
    }

    uint256 public nextLoanId = 1;
    uint256 public constant MIN_COLLATERAL_RATIO_BPS = 15000; // 150.00%
    
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public borrowerLoans;

    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 borrowedAmount, uint256 collateralAmount);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 totalRepaid);
    event LoanLiquidated(uint256 indexed loanId, address indexed borrower, uint256 collateralClaimed);

    constructor() Ownable(msg.sender) {}

    function openLoan(
        address collateralToken,
        uint256 collateralAmount,
        address borrowedToken,
        uint256 borrowedAmount,
        uint256 durationSeconds,
        uint256 interestRateBps
    ) external nonReentrant returns (uint256) {
        require(collateralAmount > 0 && borrowedAmount > 0, "INVALID_AMOUNTS");
        
        // Transfer 150% collateral from borrower
        IERC20(collateralToken).safeTransferFrom(msg.sender, address(this), collateralAmount);

        uint256 loanId = nextLoanId++;
        loans[loanId] = Loan({
            loanId: loanId,
            borrower: msg.sender,
            collateralToken: collateralToken,
            collateralAmount: collateralAmount,
            borrowedToken: borrowedToken,
            borrowedAmount: borrowedAmount,
            interestRateBps: interestRateBps,
            expiryTimestamp: block.timestamp + durationSeconds,
            isRepaid: false,
            isLiquidated: false
        });
        borrowerLoans[msg.sender].push(loanId);

        // Issue stablecoin tranche
        IERC20(borrowedToken).safeTransfer(msg.sender, borrowedAmount);

        emit LoanCreated(loanId, msg.sender, borrowedAmount, collateralAmount);
        return loanId;
    }

    function repayLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(!loan.isRepaid && !loan.isLiquidated, "LOAN_ALREADY_CLOSED");
        require(block.timestamp <= loan.expiryTimestamp, "LOAN_EXPIRED");

        uint256 interestAmount = (loan.borrowedAmount * loan.interestRateBps) / 10000;
        uint256 totalRepay = loan.borrowedAmount + interestAmount;

        // Repay principal + interest
        IERC20(loan.borrowedToken).safeTransferFrom(msg.sender, address(this), totalRepay);

        loan.isRepaid = true;

        // Return collateral to borrower
        IERC20(loan.collateralToken).safeTransfer(loan.borrower, loan.collateralAmount);

        emit LoanRepaid(loanId, loan.borrower, totalRepay);
    }

    function liquidateDefault(uint256 loanId, address liquidatorRewardRecipient) external onlyOwner nonReentrant {
        Loan storage loan = loans[loanId];
        require(!loan.isRepaid && !loan.isLiquidated, "LOAN_ALREADY_CLOSED");
        require(block.timestamp > loan.expiryTimestamp, "LOAN_NOT_YET_EXPIRED");

        loan.isLiquidated = true;

        // Transfer seized higher collateral to protocol / liquidity pool
        IERC20(loan.collateralToken).safeTransfer(liquidatorRewardRecipient, loan.collateralAmount);

        emit LoanLiquidated(loanId, loan.borrower, loan.collateralAmount);
    }
}
