// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston/ContractRegistry.sol";
import {IFdcVerification} from "@flarenetwork/flare-periphery-contracts/coston/IFdcVerification.sol";
import {IEVMTransaction} from "@flarenetwork/flare-periphery-contracts/coston/IEVMTransaction.sol";
import {IJsonApi} from "@flarenetwork/flare-periphery-contracts/coston/IJsonApi.sol";
import {IAddressValidity} from "@flarenetwork/flare-periphery-contracts/coston/IAddressValidity.sol";
import {IPayment} from "@flarenetwork/flare-periphery-contracts/coston/IPayment.sol";

/// @title FdcHelper
/// @dev Thin wrappers for the most common FDC proof verifications used by FlareCred.
library FdcHelper {
    function verifyEVM(IEVMTransaction.Proof calldata p) internal view returns (bool) {
        return ContractRegistry.getFdcVerification().verifyEVMTransaction(p);
    }

    function verifyPayment(IPayment.Proof calldata p) internal view returns (bool) {
        return ContractRegistry.getFdcVerification().verifyPayment(p);
    }

    function verifyAddress(IAddressValidity.Proof calldata p) internal view returns (bool) {
        return ContractRegistry.getFdcVerification().verifyAddressValidity(p);
    }

    function verifyJson(IJsonApi.Proof calldata p) internal view returns (bool) {
        // JSON attestation is currently under `auxiliaryGetIJsonApiVerification`
        return ContractRegistry.auxiliaryGetIJsonApiVerification().verifyJsonApi(p);
    }
}