// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title FlareCred DID Registry
/// @notice Allows each address to mint one `did:flare:0x…`, update its document pointer,
///         and lets admins pre-mint DIDs for any account (useful during deployment).
contract DIDRegistry is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct DIDDocument {
        string uri;
        bytes32 docHash;
    }

    /// owner → DID string
    mapping(address => string) public didOf;
    /// DID string → document metadata
    mapping(string => DIDDocument) public documentOf;

    event DIDCreated(address indexed owner, string did, bytes32 docHash);
    event DIDDocumentUpdated(string indexed did, string uri, bytes32 docHash);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    /* -------------------------------------------------------------------------- */
    /*                               I N T E R N A L                              */
    /* -------------------------------------------------------------------------- */

    function _deriveDID(address owner) private pure returns (string memory) {
        return string.concat("did:flare:", Strings.toHexString(uint160(owner), 20));
    }

    /* -------------------------------------------------------------------------- */
    /*                                   M I N T                                  */
    /* -------------------------------------------------------------------------- */

    /// @notice Mint a new DID for the caller.
    /// @param docHash Optional keccak-256 hash of the initial DID document (zero for none).
    function createDID(bytes32 docHash) external {
        require(bytes(didOf[msg.sender]).length == 0, "DID already exists");
        string memory did = _deriveDID(msg.sender);

        didOf[msg.sender] = did;
        documentOf[did] = DIDDocument({uri: "", docHash: docHash});

        emit DIDCreated(msg.sender, did, docHash);
    }

    /// @notice Admin helper to mint a DID for `owner` without their signature.
    function adminCreateDID(address owner, bytes32 docHash) external onlyRole(ADMIN_ROLE) {
        require(owner != address(0), "Owner is zero");
        require(bytes(didOf[owner]).length == 0, "DID already exists");

        string memory did = _deriveDID(owner);
        didOf[owner] = did;
        documentOf[did] = DIDDocument({uri: "", docHash: docHash});

        emit DIDCreated(owner, did, docHash);
    }

    /* -------------------------------------------------------------------------- */
    /*                                 U P D A T E                                */
    /* -------------------------------------------------------------------------- */

    /// @notice Update the caller’s DID document pointer/hash.
    function setDocument(string calldata uri, bytes32 hash) external {
        string memory did = didOf[msg.sender];
        require(bytes(did).length != 0, "No DID");

        documentOf[did] = DIDDocument({uri: uri, docHash: hash});
        emit DIDDocumentUpdated(did, uri, hash);
    }

    /// @notice Admin override for emergencies.
    function adminSetDocument(
        address owner,
        string calldata uri,
        bytes32 hash
    ) external onlyRole(ADMIN_ROLE) {
        string memory did = didOf[owner];
        require(bytes(did).length != 0, "Owner has no DID");

        documentOf[did] = DIDDocument({uri: uri, docHash: hash});
        emit DIDDocumentUpdated(did, uri, hash);
    }

    /* -------------------------------------------------------------------------- */
    /*                                   V I E W                                  */
    /* -------------------------------------------------------------------------- */

    function hasDID(address owner) external view returns (bool) {
        return bytes(didOf[owner]).length != 0;
    }

    /* -------------------------------------------------------------------------- */
    /*                                 ERC-165                                    */
    /* -------------------------------------------------------------------------- */

    function supportsInterface(bytes4 id) public view override returns (bool) {
        return id == type(IERC165).interfaceId || super.supportsInterface(id);
    }
}