// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title FlareCred Credential NFT
/// @dev Each token represents a verifiable credential anchored on-chain.
///      `tokenURI` → IPFS/Arweave JSON; `_credentialData[tokenId].vcHash` → keccak-256 of full VC.
contract CredentialNFT is ERC721URIStorage, AccessControl {
    bytes32 public constant ADMIN_ROLE    = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE   = keccak256("ISSUER_ROLE");
    bytes32 public constant PLATFORM_ROLE = keccak256("PLATFORM_ROLE");

    struct CredentialData {
        bytes32 vcHash;
    }

    uint256 private _nextTokenId;
    mapping(uint256 => CredentialData) private _credentialData;

    event CredentialMinted(address indexed to, uint256 indexed tokenId, bytes32 vcHash, string uri);
    event CredentialUpdated(uint256 indexed tokenId, bytes32 vcHash, string uri);
    event CredentialRevoked(uint256 indexed tokenId);

    /// @param admin Address that receives DEFAULT_ADMIN and ADMIN roles.
    constructor(address admin) ERC721("FlareCred Credential", "FCRD") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        _setRoleAdmin(ISSUER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PLATFORM_ROLE, ADMIN_ROLE);
    }

    // ---------- Core actions ----------
    /// @notice Mint a new credential NFT. Callable by authorised issuers.
    function mintCredential(
        address to,
        bytes32 vcHash,
        string calldata uri
    ) external onlyRole(ISSUER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _credentialData[tokenId] = CredentialData({vcHash: vcHash});
        emit CredentialMinted(to, tokenId, vcHash, uri);
        return tokenId;
    }

    /// @notice Update VC hash / URI (e.g. revocation or metadata migration).
    function updateCredential(
        uint256 tokenId,
        bytes32 newVcHash,
        string calldata newUri
    ) external {
        require(_exists(tokenId), "Credential: nonexistent");
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(ISSUER_ROLE, msg.sender),
            "Credential: not authorised"
        );

        _credentialData[tokenId].vcHash = newVcHash;
        _setTokenURI(tokenId, newUri);
        emit CredentialUpdated(tokenId, newVcHash, newUri);
    }

    /// @notice Burn (revoke) a credential. Allowed to admin, issuer, or token owner.
    function revokeCredential(uint256 tokenId) external {
        require(_exists(tokenId), "Credential: nonexistent");
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
            hasRole(ISSUER_ROLE, msg.sender) ||
            msg.sender == ownerOf(tokenId),
            "Credential: not authorised"
        );

        _burn(tokenId);
        delete _credentialData[tokenId];
        emit CredentialRevoked(tokenId);
    }

    // ---------- Views ----------
    function getVcHash(uint256 tokenId) external view returns (bytes32) {
        require(_exists(tokenId), "Credential: nonexistent");
        return _credentialData[tokenId].vcHash;
    }

    // ---------- Internal ----------
    /// @dev OZ v5 still provides `_exists`; we expose a local helper for clarity.
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // ---------- ERC-165 ----------
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}