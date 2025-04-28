// High-level helper functions used by server-actions or React components
// to start an on-chain subscription payment and query its status.

import { ethers } from 'ethers'
import { paySubscription, checkSubscription } from '@/lib/contracts/flare'

/* -------------------------------------------------------------------------- */
/*                               C H E C K O U T                              */
/* -------------------------------------------------------------------------- */

/**
 * Invokes the SubscriptionManager contract with the correct FLR value for the
 * chosen plan and waits for confirmation.
 *
 * @param signer   Connected wallet signer (wagmi or ethers.js).
 * @param planKey  Pricing tier (1 = Base, 2 = Plus).
 */
export async function startCryptoCheckout(
  signer: ethers.Signer,
  planKey: 1 | 2,
): Promise<{ txHash: string; paidUntil: Date }> {
  return await paySubscription({ signer, planKey })
}

/* -------------------------------------------------------------------------- */
/*                               S T A T U S                                  */
/* -------------------------------------------------------------------------- */

/**
 * Convenience helper to fetch the current subscription expiry as a Date.
 *
 * @param teamAddress  Checksummed 0x address of the team wallet.
 */
export async function getSubscriptionExpiry(teamAddress: string): Promise<Date | null> {
  return await checkSubscription(teamAddress)
}