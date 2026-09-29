// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title VouchKYCRegistry
 * @dev Production-ready on-chain KYC verification registry integrated with DigiLocker / Aadhaar identity.
 * Features:
 *  1. Front-running protection: Reconstructs hash with msg.sender so mempool attackers cannot steal valid signatures.
 *  2. Time-bounded vouchers: Signatures expire after a short window (e.g. 15 minutes).
 *  3. Admin key rotation: Emergency update of the KYC signing authority if compromised.
 *  4. User revocation: Allows users to revoke verification if their wallet private key is compromised.
 *  5. Stateless compliance: Zero PII or raw Aadhaar numbers stored on-chain (DPDP Act 2023 compliant).
 */
contract VouchKYCRegistry is Ownable {
    using ECDSA for bytes32;

    // Authorized backend signer that approves verified DigiLocker sessions
    address public adminSigner;

    // Mapping: user address => KYC verification status
    mapping(address => bool) public isVerified;

    // Mapping: user address => timestamp of verification
    mapping(address => uint256) public verifiedAt;

    // Mapping: user address => voucher expiry timestamp recorded
    mapping(address => uint256) public voucherExpiry;

    event AdminSignerUpdated(address indexed previousSigner, address indexed newSigner);
    event UserKYCVerified(address indexed user, uint256 expiry, uint256 timestamp);
    event UserKYCRevoked(address indexed user, uint256 timestamp);

    constructor(address _adminSigner) Ownable(msg.sender) {
        require(_adminSigner != address(0), "Invalid admin signer");
        adminSigner = _adminSigner;
    }

    /**
     * @notice Update the admin signer address (e.g. key rotation or Multi-Sig emergency update)
     */
    function updateAdminSigner(address _newAdminSigner) external onlyOwner {
        require(_newAdminSigner != address(0), "Invalid address");
        address previousSigner = adminSigner;
        adminSigner = _newAdminSigner;
        emit AdminSignerUpdated(previousSigner, _newAdminSigner);
    }

    /**
     * @notice Verify a user's wallet address using a cryptographic voucher issued by the DigiLocker backend
     * @dev Front-running attack protection: The hash is strictly recreated using msg.sender!
     *      An attacker copying this transaction from the mempool with their own address will fail ecrecover.
     * @param signature Cryptographic signature produced by the adminSigner
     * @param expiry Timestamp after which the voucher is no longer valid
     */
    function verifyUser(bytes calldata signature, uint256 expiry) external {
        require(block.timestamp <= expiry, "KYC Voucher has expired");
        require(!isVerified[msg.sender], "User already verified");

        // Reconstruct message hash tied explicitly to msg.sender
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, expiry));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);

        // Recover signer via ECDSA
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(recoveredSigner == adminSigner, "Invalid signature or unauthorized signer");

        isVerified[msg.sender] = true;
        verifiedAt[msg.sender] = block.timestamp;
        voucherExpiry[msg.sender] = expiry;

        emit UserKYCVerified(msg.sender, expiry, block.timestamp);
    }

    /**
     * @notice Allow a user to revoke their own KYC if their wallet or keys are compromised
     */
    function revokeMyKYC() external {
        require(isVerified[msg.sender], "Not verified");
        isVerified[msg.sender] = false;
        emit UserKYCRevoked(msg.sender, block.timestamp);
    }

    /**
     * @notice Emergency administrative revocation in case of identified fraud
     */
    function adminRevokeKYC(address user) external onlyOwner {
        require(isVerified[user], "User not verified");
        isVerified[user] = false;
        emit UserKYCRevoked(user, block.timestamp);
    }
}
