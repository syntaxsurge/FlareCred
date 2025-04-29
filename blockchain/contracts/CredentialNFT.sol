// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title FlareCred Credential NFT
/// @notice Signature-gated credential minting.
contract CredentialNFT is ERC721URIStorage, AccessControl {
    bytes32 public constant ADMIN_ROLE    = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE   = keccak256("ISSUER_ROLE");
    bytes32 public constant PLATFORM_ROLE = keccak256("PLATFORM_ROLE");

    struct CredentialData {
        bytes32 vcHash;
    }

    uint256 private _nextTokenId;
    mapping(uint256 => CredentialData) private _credentialData;
    mapping(bytes32 => bool) private _mintedVcHashes; // replay-protection

    event CredentialMinted(address indexed to, uint256 indexed tokenId, bytes32 vcHash, string uri);
    event CredentialUpdated(uint256 indexed tokenId, bytes32 vcHash, string uri);
    event CredentialRevoked(uint256 indexed tokenId);

    constructor(address admin) ERC721("FlareCred Credential", "FCRD") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        _setRoleAdmin(ISSUER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PLATFORM_ROLE, ADMIN_ROLE);
    }

    /* -------------------------------------------------------------------------- */
    /*                             I N T E R N A L                                */
    /* -------------------------------------------------------------------------- */

    function _mintDigest(
        address to,
        bytes32 vcHash,
        string memory uri
    ) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(to, vcHash, keccak256(bytes(uri))));
    }

    /// OZ <4.9 compatibility – replicates `ECDSA.toEthSignedMessageHash(bytes32)`.
    function _ethSignedMessageHash(bytes32 hash) private pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    /* -------------------------------------------------------------------------- */
    /*                                   M I N T                                  */
    /* -------------------------------------------------------------------------- */

    /**
     * @param signature  65-byte ECDSA signature over `_mintDigest(to, vcHash, uri)`
     *                   by an account with ISSUER_ROLE or PLATFORM_ROLE; empty
     *                   when the caller already holds such a role.
     */
    function mintCredential(
        address to,
        bytes32 vcHash,
        string calldata uri,
        bytes calldata signature
    ) external returns (uint256) {
        bool callerIsTrusted = hasRole(ISSUER_ROLE, msg.sender) || hasRole(PLATFORM_ROLE, msg.sender);

        if (!callerIsTrusted) {
            require(signature.length == 65, "Credential: signature required");
            bytes32 digest = _ethSignedMessageHash(_mintDigest(to, vcHash, uri));
            address signer = ECDSA.recover(digest, signature);
            require(
                hasRole(ISSUER_ROLE, signer) || hasRole(PLATFORM_ROLE, signer),
                "Credential: invalid signer"
            );
        }

        require(!_mintedVcHashes[vcHash], "Credential: VC already anchored");
        _mintedVcHashes[vcHash] = true;

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        if (bytes(uri).length != 0) _setTokenURI(tokenId, uri);
        _credentialData[tokenId] = CredentialData({vcHash: vcHash});

        emit CredentialMinted(to, tokenId, vcHash, uri);
        return tokenId;
    }

    /* ----------------------------- UPDATE & REVOKE ---------------------------- */

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

    /* -------------------------------------------------------------------------- */
    /*                                    V I E W                                 */
    /* -------------------------------------------------------------------------- */

    function getVcHash(uint256 tokenId) external view returns (bytes32) {
        require(_exists(tokenId), "Credential: nonexistent");
        return _credentialData[tokenId].vcHash;
    }

    /* -------------------------------------------------------------------------- */
    /*                               U T I L I T Y                                */
    /* -------------------------------------------------------------------------- */

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function supportsInterface(bytes4 id)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(id);
    }
}