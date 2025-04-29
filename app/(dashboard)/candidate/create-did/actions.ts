'use server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { getUserWithTeam } from '@/lib/db/queries/queries'
import { teams, teamMembers } from '@/lib/db/schema'

/**
 * Persist a freshly created Flare DID for the caller’s team.
 *
 * The DID must match the caller’s wallet address and the caller must be
 * an owner of the team.  We never attempt an on-chain write here; that is
 * done in the browser via the connected wallet.
 */
export const createDidAction = validatedActionWithUser(
  z.object({
    did: z
      .string()
      .regex(/^did:flare:0x[0-9a-fA-F]{40}$/, 'Invalid Flare DID (expected did:flare:0x…)'),
  }),
  async ({ did }, _formData, user) => {
    /* ------------------------------------------------------------ */
    /*                  R E S O L V E   T E A M                     */
    /* ------------------------------------------------------------ */
    const userWithTeam = await getUserWithTeam(user.id)
    if (!userWithTeam?.teamId) {
      return { error: "You don't belong to a team." }
    }

    /* Confirm the caller is an owner on that team */
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, userWithTeam.teamId)))
      .limit(1)

    if (membership?.role !== 'owner') {
      return { error: 'Only team owners can set a DID.' }
    }

    /* ------------------------------------------------------------ */
    /*                E X I S T I N G   D I D  C H E C K            */
    /* ------------------------------------------------------------ */
    const [team] = await db
      .select({ id: teams.id, did: teams.did })
      .from(teams)
      .where(eq(teams.id, userWithTeam.teamId))
      .limit(1)

    if (!team) return { error: 'Team not found.' }
    if (team.did) return { error: 'Your team already has a DID.' }

    /* ------------------------------------------------------------ */
    /*                  V A L I D A T E   O W N E R S H I P          */
    /* ------------------------------------------------------------ */
    const expectedDid = `did:flare:${user.walletAddress}`
    if (expectedDid.toLowerCase() !== did.toLowerCase()) {
      return { error: 'DID does not match your connected wallet.' }
    }

    /* ------------------------------------------------------------ */
    /*                      P E R S I S T                           */
    /* ------------------------------------------------------------ */
    await db.update(teams).set({ did }).where(eq(teams.id, team.id))

    return { success: 'Team DID saved.' }
  },
)
