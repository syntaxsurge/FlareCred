'use server'

import { withTeam } from '@/lib/auth/middleware'
import { paySubscription } from '@/lib/contracts/flare'
import { updateTeamCryptoSubscription } from '@/lib/db/queries/queries'

/* -------------------------------------------------------------------------- */
/*                                 T Y P E S                                  */
/* -------------------------------------------------------------------------- */

/** Mapping from numeric contract key to internal plan name. */
function keyToPlanName(key: 1 | 2): 'base' | 'plus' {
  return key === 1 ? 'base' : 'plus'
}

/* -------------------------------------------------------------------------- */
/*                        C R Y P T O   C H E C K O U T                       */
/* -------------------------------------------------------------------------- */

/**
 * Executes an on-chain subscription payment and synchronises the result
 * with the database so that quota enforcement is immediate.
 *
 * The caller must send a `planKey` field (string ‘1’ or ‘2’) in the
 * associated `FormData`. A server-side signer relays the payment;
 * this avoids client tampering with the FLR amount,
 * as the contract itself enforces the exact `planPriceWei`.
 */
export const cryptoCheckoutAction = withTeam(async (formData, team) => {
  if (!team) {
    throw new Error('Team not found for current user.')
  }

  /* ----------------------------- Parse input ----------------------------- */
  const rawKey = formData?.get?.('planKey')?.toString() ?? ''
  if (rawKey !== '1' && rawKey !== '2') {
    throw new Error('Invalid or missing planKey; expected "1” or "2”.')
  }
  const planKey = rawKey === '1' ? (1 as const) : (2 as const)
  const planName = keyToPlanName(planKey)

  /* ------------------------ On-chain transaction ------------------------- */
  const { paidUntil, txHash } = await paySubscription({ planKey })

  /* ------------------------------- Persist ------------------------------- */
  await updateTeamCryptoSubscription(team.id, planName, paidUntil)

  return { teamId: team.id, paidUntil, txHash }
})
