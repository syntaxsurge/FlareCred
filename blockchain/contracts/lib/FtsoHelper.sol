// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston/ContractRegistry.sol";
import {TestFtsoV2Interface} from "@flarenetwork/flare-periphery-contracts/coston/TestFtsoV2Interface.sol";
import {IFtsoFeedIdConverter} from "@flarenetwork/flare-periphery-contracts/coston/IFtsoFeedIdConverter.sol";

/// @title FtsoHelper
/// @notice Lightweight helper for reading FLR/USD feed in wei precision.
library FtsoHelper {
    /// @return priceWei 18-decimals FLR/USD price
    /// @return timestamp last finalised price timestamp
    function flrUsdPriceWei() internal view returns (uint256 priceWei, uint256 timestamp) {
        // NOTE: `TestFtsoV2` used on testnets; switch to production interface on mainnet.
        TestFtsoV2Interface ftso = ContractRegistry.getTestFtsoV2();
        IFtsoFeedIdConverter conv = ContractRegistry.getFtsoFeedIdConverter();
        bytes21 feedId = conv.getFeedId(1, "FLR/USD");
        (priceWei, timestamp) = ftso.getFeedByIdInWei(feedId);
    }
}