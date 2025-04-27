// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston/ContractRegistry.sol";
import {IFdcVerification} from "@flarenetwork/flare-periphery-contracts/coston/IFdcVerification.sol";
import {IEVMTransaction} from "@flarenetwork/flare-periphery-contracts/coston/IEVMTransaction.sol";
import {IJsonApi} from "@flarenetwork/flare-periphery-contracts/coston/IJsonApi.sol";
import {IAddressValidity} from "@flarenetwork/flare-periphery-contracts/coston/IAddressValidity.sol";
import {IPayment} from "@flarenetwork/flare-periphery-contracts/coston/IPayment.sol";

/**
 * @title FlareCredVerifier
 * @notice Minimal delegate exposing the Flare Data Connector (FDC) verification
 *         entry-points required by the FlareCred platform.  Each wrapper simply
 *         forwards the call to the canonical IFdcVerification implementation
 *         fetched from the on-chain ContractRegistry so that future upgrades
 *         propagate automatically without changing this contract’s address.
 */
contract FlareCredVerifier {
    /// @dev Cached IFdcVerification instance for gas-efficient forwarding.
    IFdcVerification public immutable verifier;

    constructor() {
        verifier = ContractRegistry.getFdcVerification();
    }

    /* --------------------------------------------------------------------- */
    /*                            V E R I F I C A T I O N                    */
    /* --------------------------------------------------------------------- */

    /**
     * @notice Verify an EVM transaction attestation.
     * @param proof Structured proof payload.
     * @return success True if the proof is valid.
     */
    function verifyEVM(
        IEVMTransaction.Proof calldata proof
    ) external view returns (bool success) {
        success = verifier.verifyEVMTransaction(proof);
    }

    /**
     * @notice Verify a JSON API attestation.
     */
    function verifyJson(
        IJsonApi.Proof calldata proof
    ) external view returns (bool success) {
        success = ContractRegistry
            .auxiliaryGetIJsonApiVerification()
            .verifyJsonApi(proof);
    }

    /**
     * @notice Verify a payment attestation.
     */
    function verifyPayment(
        IPayment.Proof calldata proof
    ) external view returns (bool success) {
        success = verifier.verifyPayment(proof);
    }

    /**
     * @notice Verify an address-ownership attestation.
     */
    function verifyAddress(
        IAddressValidity.Proof calldata proof
    ) external view returns (bool success) {
        success = verifier.verifyAddressValidity(proof);
    }
}