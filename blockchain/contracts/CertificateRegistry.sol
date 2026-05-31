// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertificateRegistry
 * @notice Issues and verifies student achievement certificates on-chain.
 *
 * How it works:
 *  - The contract owner (school admin wallet) calls `issueCertificate`.
 *  - A unique certificateId is generated from the student data + timestamp.
 *  - Anyone can call `verifyCertificate(id)` to check if it is genuine.
 *  - Certificates can be revoked by the owner (e.g. issued in error).
 *
 * IPFS:
 *  - The full certificate document is stored on IPFS.
 *  - Only the IPFS CID (content hash) is stored on-chain — cheap and tamper-proof.
 */
contract CertificateRegistry is Ownable {

    // ── Events ────────────────────────────────────────────────────────────────
    event CertificateIssued(
        bytes32 indexed certificateId,
        uint256 indexed studentId,
        string  achievement,
        string  ipfsCid,
        uint256 issuedAt
    );

    event CertificateRevoked(
        bytes32 indexed certificateId,
        uint256 revokedAt
    );

    // ── Data structures ───────────────────────────────────────────────────────
    struct Certificate {
        uint256 studentId;    // matches users.id in the PostgreSQL DB
        string  studentName;
        string  achievement;  // e.g. "Best Student 2024", "100% Attendance"
        string  ipfsCid;      // IPFS CID of the full PDF/JSON certificate
        uint256 issuedAt;     // block timestamp
        bool    isValid;      // false once revoked
    }

    // certificateId => Certificate
    mapping(bytes32 => Certificate) private _certificates;

    // studentId => list of their certificate IDs  (for frontend lookup)
    mapping(uint256 => bytes32[]) private _studentCertificates;

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor() Ownable(msg.sender) {}

    // ── Write functions (owner only) ──────────────────────────────────────────

    /**
     * @notice Issue a new certificate.
     * @param studentId   The student's DB id (from PostgreSQL users.id).
     * @param studentName The student's full name at time of issue.
     * @param achievement Short description of the achievement.
     * @param ipfsCid     IPFS CID of the certificate document.
     * @return certificateId  The unique on-chain identifier.
     */
    function issueCertificate(
        uint256 studentId,
        string  calldata studentName,
        string  calldata achievement,
        string  calldata ipfsCid
    ) external onlyOwner returns (bytes32 certificateId) {

        // Deterministic ID: hash of student + achievement + time
        certificateId = keccak256(
            abi.encodePacked(studentId, achievement, block.timestamp, msg.sender)
        );

        // Prevent accidental duplicates in the same block
        require(_certificates[certificateId].issuedAt == 0, "Certificate already exists");

        _certificates[certificateId] = Certificate({
            studentId:   studentId,
            studentName: studentName,
            achievement: achievement,
            ipfsCid:     ipfsCid,
            issuedAt:    block.timestamp,
            isValid:     true
        });

        _studentCertificates[studentId].push(certificateId);

        emit CertificateIssued(certificateId, studentId, achievement, ipfsCid, block.timestamp);
    }

    /**
     * @notice Revoke a certificate (e.g. issued in error).
     */
    function revokeCertificate(bytes32 certificateId) external onlyOwner {
        require(_certificates[certificateId].issuedAt != 0, "Certificate does not exist");
        require(_certificates[certificateId].isValid,       "Already revoked");

        _certificates[certificateId].isValid = false;
        emit CertificateRevoked(certificateId, block.timestamp);
    }

    // ── Read functions (public) ───────────────────────────────────────────────

    /**
     * @notice Verify a certificate and return its full details.
     * @return isValid   False if the certificate was revoked.
     */
    function verifyCertificate(bytes32 certificateId)
        external
        view
        returns (
            bool    isValid,
            uint256 studentId,
            string  memory studentName,
            string  memory achievement,
            string  memory ipfsCid,
            uint256 issuedAt
        )
    {
        Certificate storage cert = _certificates[certificateId];
        require(cert.issuedAt != 0, "Certificate does not exist");

        return (
            cert.isValid,
            cert.studentId,
            cert.studentName,
            cert.achievement,
            cert.ipfsCid,
            cert.issuedAt
        );
    }

    /**
     * @notice Get all certificate IDs for a student.
     */
    function getStudentCertificates(uint256 studentId)
        external
        view
        returns (bytes32[] memory)
    {
        return _studentCertificates[studentId];
    }
}
