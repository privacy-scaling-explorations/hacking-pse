// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { ISemaphore } from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import { ISemaphoreVerifier } from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";
import { SemaphoreGroups } from "@semaphore-protocol/contracts/base/SemaphoreGroups.sol";
import { MIN_DEPTH, MAX_DEPTH } from "@semaphore-protocol/contracts/base/Constants.sol";
import { HatsExcubia } from "@zk-kit/excubiae/extensions/HatsExcubia.sol";

/// @title Semaphore
/// @dev A minimal version of the Semaphore contract.
contract Semaphore is ISemaphore, SemaphoreGroups {
    HatsExcubia public hatsExcubia;
    ISemaphoreVerifier public verifier;

    uint256 public groupId = 1;

    Group public group;

    /// @dev Creates the group and initializes the Semaphore verifier and gatekeeper.
    /// @param _verifier: Semaphore verifier address.
    /// @param _hatsExcubia: Gatekeeper address.
    constructor(ISemaphoreVerifier _verifier, HatsExcubia _hatsExcubia) {
        _createGroup(groupId, msg.sender);

        group.merkleTreeDuration = 1 hours;

        verifier = _verifier;
        hatsExcubia = _hatsExcubia;
    }

    /// @dev See {ISemaphore-updateGroupMerkleTreeDuration}.
    function updateGroupMerkleTreeDuration(
        uint256,
        /*groupId*/
        uint256 newMerkleTreeDuration
    )
        external
        override
        onlyGroupAdmin(groupId)
    {
        uint256 oldMerkleTreeDuration = group.merkleTreeDuration;

        group.merkleTreeDuration = newMerkleTreeDuration;

        emit GroupMerkleTreeDurationUpdated(groupId, oldMerkleTreeDuration, newMerkleTreeDuration);
    }

    function gateAndAddMember(uint256 identityCommitment, bytes calldata data) external {
        hatsExcubia.pass(msg.sender, data);

        uint256 merkleTreeRoot = _addMember(groupId, identityCommitment);

        group.merkleRootCreationDates[merkleTreeRoot] = block.timestamp;
    }

    /// @dev See {SemaphoreGroups-_updateMember}.
    function updateMember(
        uint256, /*groupId*/
        uint256 identityCommitment,
        uint256 newIdentityCommitment,
        uint256[] calldata merkleProofSiblings
    )
        external
        override
    {
        uint256 merkleTreeRoot = _updateMember(groupId, identityCommitment, newIdentityCommitment, merkleProofSiblings);

        group.merkleRootCreationDates[merkleTreeRoot] = block.timestamp;
    }

    /// @dev See {SemaphoreGroups-_removeMember}.
    function removeMember(
        uint256,
        /*groupId*/
        uint256 identityCommitment,
        uint256[] calldata merkleProofSiblings
    )
        external
        override
    {
        uint256 merkleTreeRoot = _removeMember(groupId, identityCommitment, merkleProofSiblings);

        group.merkleRootCreationDates[merkleTreeRoot] = block.timestamp;
    }

    /// @dev See {ISemaphore-validateProof}.
    function validateProof(
        uint256,
        /*groupId*/
        SemaphoreProof calldata proof
    )
        external
        override
    {
        // The function will revert if the nullifier that is part of the proof,
        // was already used inside the group with id groupId.
        if (group.nullifiers[proof.nullifier]) {
            revert Semaphore__YouAreUsingTheSameNullifierTwice();
        }

        // The function will revert if the proof is not verified successfully.
        if (!verifyProof(groupId, proof)) {
            revert Semaphore__InvalidProof();
        }

        // Saves the nullifier so that it cannot be used again to successfully verify a proof
        // that is part of the group with id groupId.
        group.nullifiers[proof.nullifier] = true;

        emit ProofValidated(
            groupId,
            proof.merkleTreeDepth,
            proof.merkleTreeRoot,
            proof.nullifier,
            proof.message,
            proof.scope,
            proof.points
        );
    }

    /// @dev See {ISemaphore-verifyProof}.
    function verifyProof(
        uint256,
        /*groupId*/
        SemaphoreProof calldata proof
    )
        public
        view
        override
        onlyExistingGroup(groupId)
        returns (bool)
    {
        // The function will revert if the Merkle tree depth is not supported.
        if (proof.merkleTreeDepth < MIN_DEPTH || proof.merkleTreeDepth > MAX_DEPTH) {
            revert Semaphore__MerkleTreeDepthIsNotSupported();
        }

        // Gets the number of leaves in the Incremental Merkle Tree that represents the group
        // with id groupId which is the same as the number of members in the group groupId.
        uint256 merkleTreeSize = getMerkleTreeSize(groupId);

        // The function will revert if there are no members in the group.
        if (merkleTreeSize == 0) {
            revert Semaphore__GroupHasNoMembers();
        }

        // Gets the Merkle root of the Incremental Merkle Tree that represents the group with id groupId.
        uint256 currentMerkleTreeRoot = getMerkleTreeRoot(groupId);

        // A proof could have used an old Merkle tree root.
        // https://github.com/semaphore-protocol/semaphore/issues/98
        if (proof.merkleTreeRoot != currentMerkleTreeRoot) {
            uint256 merkleRootCreationDate = group.merkleRootCreationDates[proof.merkleTreeRoot];
            uint256 merkleTreeDuration = group.merkleTreeDuration;

            if (merkleRootCreationDate == 0) {
                revert Semaphore__MerkleTreeRootIsNotPartOfTheGroup();
            }

            if (block.timestamp > merkleRootCreationDate + merkleTreeDuration) {
                revert Semaphore__MerkleTreeRootIsExpired();
            }
        }

        return verifier.verifyProof(
            [proof.points[0], proof.points[1]],
            [[proof.points[2], proof.points[3]], [proof.points[4], proof.points[5]]],
            [proof.points[6], proof.points[7]],
            [proof.merkleTreeRoot, proof.nullifier, _hash(proof.message), _hash(proof.scope)],
            proof.merkleTreeDepth
        );
    }

    /// @dev Creates a keccak256 hash of a message compatible with the SNARK scalar modulus.
    /// @param message: Message to be hashed.
    /// @return Message digest.
    function _hash(uint256 message) private pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(message))) >> 8;
    }

    /**
     * STUBS & MOCKS
     */
    function groupCounter() external pure returns (uint256) {
        return 1;
    }

    /// @dev See {SemaphoreGroups-_createGroup}.
    function createGroup() external pure override returns (uint256) {
        return 1;
    }

    function createGroup(address /*admin*/ ) external pure override returns (uint256) {
        return 1;
    }

    function createGroup(
        address,
        /*admin*/
        uint256 /*merkleTreeDuration*/
    )
        external
        pure
        override
        returns (uint256)
    {
        return 1;
    }

    /// @dev See {SemaphoreGroups-_updateGroupAdmin}.
    function updateGroupAdmin(
        uint256,
        /*groupId*/
        address /*newAdmin*/
    )
        external
        override
    { }

    /// @dev See {SemaphoreGroups- acceptGroupAdmin}.
    function acceptGroupAdmin(uint256 /*groupId*/ ) external override { }

    /// @dev See {SemaphoreGroups-_addMember}.
    function addMember(
        uint256,
        /*groupId*/
        uint256 identityCommitment
    )
        external
        override
    { }

    /// @dev See {SemaphoreGroups-_addMembers}.
    function addMembers(
        uint256,
        /*groupId*/
        uint256[] calldata /*identityCommitments*/
    )
        external
        override
    { }
}
