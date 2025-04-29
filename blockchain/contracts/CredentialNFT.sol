// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title FlareCred Credential NFT
/// @notice Adds signature-based gating so only credentials that were authorised
///         by the platform (or a trusted issuer) can be self-minted.
contract CredentialNFT is ERC721URIStorage, AccessControl {
    bytes32 public constant ADMIN_ROLE    = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE   = keccak256("ISSUER_ROLE");
    bytes32 public constant PLATFORM_ROLE = keccak256("PLATFORM_ROLE");

    struct CredentialData {
        bytes32 vcHash;
    }

    /* --------------------------------------------------------------------- */
    /*                               STORAGE                                 */
    /* --------------------------------------------------------------------- */

    uint256 private _nextTokenId;
    mapping(uint256 => CredentialData) private _credentialData;

    /// Prevents replay – a VC hash can be anchored only once.
    mapping(bytes32 => bool) private _mintedVcHashes;

    /* --------------------------------------------------------------------- */
    /*                                EVENTS                                 */
    /* --------------------------------------------------------------------- */

    event CredentialMinted(address indexed to, uint256 indexed tokenId, bytes32 vcHash, string uri);
    event CredentialUpdated(uint256 indexed tokenId, bytes32 vcHash, string uri);
    event CredentialRevoked(uint256 indexed tokenId);

    /* --------------------------------------------------------------------- */
    /*                              CONSTRUCTOR                              */
    /* --------------------------------------------------------------------- */

    constructor(address admin) ERC721("FlareCred Credential", "FCRD") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        _setRoleAdmin(ISSUER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PLATFORM_ROLE, ADMIN_ROLE);
    }

    /* --------------------------------------------------------------------- */
    /*                         I N T E R N A L   H E L P E R S               */
    /* --------------------------------------------------------------------- */

    /// @dev Deterministic hash for signature pre-image (includes URI hash).
    function _mintDigest(
        address to,
        bytes32 vcHash,
        string memory uri
    ) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(to, vcHash, keccak256(bytes(uri))));
    }

    /* --------------------------------------------------------------------- */
    /*                                 M I N T                               */
    /* --------------------------------------------------------------------- */

    /**
     * @notice Mint a credential token.
     * @param  to         Recipient wallet (credential subject).
     * @param  vcHash     Bytes32 hash of the Verifiable Credential JSON.
     * @param  uri        Optional off-chain tokenURI (may be empty).
     * @param  signature  ECDSA signature of `_mintDigest(to, vcHash, uri)` by
     *                    an account that holds `PLATFORM_ROLE` **or** `ISSUER_ROLE`.
     *                    Issuers calling the function themselves may pass `0x`.
     *
     * Security model:
     *   – Trusted issuers (ISSUER_ROLE) call directly with an empty signature.
     *   – Candidates self-minting must present a valid signature that proves
     *     the platform / issuer approved the credential off-chain.
     */
    function mintCredential(
        address to,
        bytes32 vcHash,
        string calldata uri,
        bytes calldata signature
    ) external returns (uint256) {
        bool callerIsIssuer = hasRole(ISSUER_ROLE, msg.sender) || hasRole(PLATFORM_ROLE, msg.sender);

        if (!callerIsIssuer) {
            // Self-mint: signature is mandatory
            require(signature.length == 65, "Credential: signature required");

            address signer = ECDSA.recover(
                ECDSA.toEthSignedMessageHash(_mintDigest(to, vcHash, uri)),
                signature
            );

            require(
                hasRole(ISSUER_ROLE, signer) || hasRole(PLATFORM_ROLE, signer),
                "Credential: invalid signer"
            );
        }

        require(!_mintedVcHashes[vcHash], "Credential: VC already anchored");
        _mintedVcHashes[vcHash] = true;

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        if (bytes(uri).length != 0) {
            _setTokenURI(tokenId, uri);
        }
        _credentialData[tokenId] = CredentialData({vcHash: vcHash});

        emit CredentialMinted(to, tokenId, vcHash, uri);
        return tokenId;
    }

    /* --------------------------------------------------------------------- */
    /*                               U P D A T E                             */
    /* --------------------------------------------------------------------- */

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

    /* --------------------------------------------------------------------- */
    /*                               R E V O K E                             */
    /* --------------------------------------------------------------------- */

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

    /* --------------------------------------------------------------------- */
    /*                                V I E W                                */
    /* --------------------------------------------------------------------- */

    function getVcHash(uint256 tokenId) external view returns (bytes32) {
        require(_exists(tokenId), "Credential: nonexistent");
        return _credentialData[tokenId].vcHash;
    }

    /* --------------------------------------------------------------------- */
    /*                               U T I L S                               */
    /* --------------------------------------------------------------------- */

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /* --------------------------------------------------------------------- */
    /*                              ERC-165                                   */
    /* --------------------------------------------------------------------- */

    function supportsInterface(bytes4 id)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(id);
    }
}