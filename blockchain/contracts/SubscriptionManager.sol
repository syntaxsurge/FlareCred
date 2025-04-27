// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @title FlareCred SubscriptionManager
/// @notice Accepts FLR payments to activate or extend a team's subscription.
contract SubscriptionManager is AccessControl {
    /* -------------------------------------------------------------------------- */
    /*                                   ROLES                                    */
    /* -------------------------------------------------------------------------- */

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /* -------------------------------------------------------------------------- */
    /*                                 CONSTANTS                                  */
    /* -------------------------------------------------------------------------- */

    /// @dev All plans grant 30 days of service per payment.
    uint256 public constant PERIOD = 30 days;

    /* -------------------------------------------------------------------------- */
    /*                                 STORAGE                                    */
    /* -------------------------------------------------------------------------- */

    /// team wallet → Unix timestamp (seconds) until which the subscription is active
    mapping(address => uint256) private _paidUntil;

    /// planKey (1 = Base, 2 = Plus, others reserved) → price in wei
    mapping(uint8 => uint256) public planPriceWei;

    /* -------------------------------------------------------------------------- */
    /*                                   EVENTS                                   */
    /* -------------------------------------------------------------------------- */

    event SubscriptionPaid(address indexed team, uint8 indexed planKey, uint256 paidUntil);

    /* -------------------------------------------------------------------------- */
    /*                                CONSTRUCTOR                                 */
    /* -------------------------------------------------------------------------- */

    /// @param admin         Address receiving DEFAULT_ADMIN_ROLE and ADMIN_ROLE.
    /// @param priceWeiBase  Initial price for the Base plan (planKey = 1).
    /// @param priceWeiPlus  Initial price for the Plus plan (planKey = 2).
    constructor(address admin, uint256 priceWeiBase, uint256 priceWeiPlus) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        planPriceWei[1] = priceWeiBase;
        planPriceWei[2] = priceWeiPlus;
    }

    /* -------------------------------------------------------------------------- */
    /*                               ADMIN ACTIONS                                */
    /* -------------------------------------------------------------------------- */

    /// @notice Update the wei price for a given plan.
    function setPlanPrice(uint8 planKey, uint256 newPriceWei) external onlyRole(ADMIN_ROLE) {
        require(planKey != 0, "Subscription: planKey 0 is reserved");
        planPriceWei[planKey] = newPriceWei;
    }

    /* -------------------------------------------------------------------------- */
    /*                           P U B L I C  A C T I O N                          */
    /* -------------------------------------------------------------------------- */

    /**
     * @dev Pay exactly the plan price in wei to activate or extend a subscription.
     *      If the team is already active, the new period is appended to the current
     *      expiry; otherwise it starts from `block.timestamp`.
     *
     * @param team     Wallet that owns the FlareCred Team/DID (can differ from `msg.sender`).
     * @param planKey  Pricing tier identifier (1 = Base, 2 = Plus).
     */
    function paySubscription(address team, uint8 planKey) external payable {
        uint256 price = planPriceWei[planKey];
        require(price > 0, "Subscription: unknown plan");
        require(msg.value == price, "Subscription: incorrect payment");

        uint256 startTime = _paidUntil[team] > block.timestamp ? _paidUntil[team] : block.timestamp;
        uint256 newExpiry = startTime + PERIOD;
        _paidUntil[team] = newExpiry;

        emit SubscriptionPaid(team, planKey, newExpiry);
    }

    /* -------------------------------------------------------------------------- */
    /*                                   VIEWS                                    */
    /* -------------------------------------------------------------------------- */

    /// @return Unix timestamp until which the subscription is active (0 if never paid)
    function paidUntil(address team) external view returns (uint256) {
        return _paidUntil[team];
    }

    /* -------------------------------------------------------------------------- */
    /*                                ERC-165                                     */
    /* -------------------------------------------------------------------------- */

    function supportsInterface(bytes4 id) public view override returns (bool) {
        return super.supportsInterface(id) || id == type(IERC165).interfaceId;
    }
}