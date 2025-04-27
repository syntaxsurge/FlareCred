'use server'

import { withTeam } from '@/lib/auth/middleware'

/**
 * Starts the on-chain subscription checkout flow.
 *
 * This server-action simply ensures the caller is authenticated and
 * belongs to a team; the actual contract interaction is performed
 * client-side (see Section 2 – Crypto subscription integration).
 *
 * @returns an object with the caller’s `teamId` so the front-end can
 *          pass it as context to `SubscriptionManager.paySubscription`.
 */
export const cryptoCheckoutAction = withTeam(async (_formData, team) => {
  if (!team) {
    throw new Error('Team not found for current user.')
  }
  return { teamId: team.id }
})