// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston/ContractRegistry.sol";
import {RandomNumberV2Interface} from "@flarenetwork/flare-periphery-contracts/coston/RandomNumberV2Interface.sol";

/// @title RngHelper
/// @notice Stand-alone helper contract providing provable randomness sourced from Flare RNG.
contract RngHelper {
    /**
     * @return rnd   Raw random uint256
     * @return ready Indicator whether the randomness round is finalised
     * @return ts    Timestamp of the randomness round
     */
    function random() public view returns (uint256 rnd, bool ready, uint256 ts) {
        RandomNumberV2Interface gen = ContractRegistry.getRandomNumberV2();
        (rnd, ready, ts) = gen.getRandomNumber();
    }

    /**
     * @notice Convenience wrapper returning a bounded random number.
     * @param  modulus Upper bound (exclusive); returns 0 when modulus is zero.
     */
    function randomMod(uint256 modulus) external view returns (uint256) {
        (uint256 r,,) = random();
        return modulus == 0 ? 0 : r % modulus;
    }
}