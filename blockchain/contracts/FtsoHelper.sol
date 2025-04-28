// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston/ContractRegistry.sol";
import {TestFtsoV2Interface} from "@flarenetwork/flare-periphery-contracts/coston/TestFtsoV2Interface.sol";
import {IFtsoFeedIdConverter} from "@flarenetwork/flare-periphery-contracts/coston/IFtsoFeedIdConverter.sol";

/// @title FtsoHelper
/// @notice Stand-alone helper contract that returns the live FLR/USD price in wei precision.
/// @dev    Deploy this contract once per network and reference its address in the front-end
///         NEXT_PUBLIC_FTSO_HELPER_ADDRESS environment variable.
contract FtsoHelper {
    /**
     * @return priceWei   18-decimals FLR/USD price
     * @return timestamp  Unix timestamp of the last finalised price
     */
    function flrUsdPriceWei() external view returns (uint256 priceWei, uint256 timestamp) {
        // On Coston & Coston2 we rely on the testnet FTSO V2 interface.
        TestFtsoV2Interface ftso = ContractRegistry.getTestFtsoV2();
        IFtsoFeedIdConverter conv = ContractRegistry.getFtsoFeedIdConverter();
        bytes21 feedId = conv.getFeedId(1, "FLR/USD");
        (priceWei, timestamp) = ftso.getFeedByIdInWei(feedId);
    }
}