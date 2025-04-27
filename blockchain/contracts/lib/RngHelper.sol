// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston/ContractRegistry.sol";
import {RandomNumberV2Interface} from "@flarenetwork/flare-periphery-contracts/coston/RandomNumberV2Interface.sol";

/// @title RngHelper
/// @notice Lightweight helpers for obtaining verifiable randomness (used for quiz shuffling, etc.).
library RngHelper {
    /// @return rnd   Random uint256 produced by Flare RNG
    /// @return ready Boolean flag signalling randomness availability
    /// @return ts    Timestamp of the randomness round
    function random() internal view returns (uint256 rnd, bool ready, uint256 ts) {
        RandomNumberV2Interface gen = ContractRegistry.getRandomNumberV2();
        (rnd, ready, ts) = gen.getRandomNumber();
    }

    /// @notice Convenience wrapper returning a bounded value in `[0, modulus-1]`.
    function randomMod(uint256 modulus) internal view returns (uint256) {
        (uint256 r,,) = random();
        return modulus == 0 ? 0 : r % modulus;
    }
}