import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'
import { ethers } from 'ethers'
import { z } from 'zod'

import { setSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

const paramsSchema = z.object({
  /** Checksummed 20-byte EVM address supplied via query-string. */
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid wallet address'),
})

/* -------------------------------------------------------------------------- */
/*                                     GET                                    */
/* -------------------------------------------------------------------------- */

/**
 * Validate the supplied wallet address, refresh the server-side session when
 * the user exists, and return a boolean `{ exists }` so the client can decide
 * whether to redirect straight to the dashboard or launch the onboarding flow.
 */
export async function GET(req: NextRequest) {
  try {
    /* ------------------------------- Parse ------------------------------- */
    const qs = Object.fromEntries(req.nextUrl.searchParams.entries())
    const parsed = paramsSchema.safeParse(qs)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid address parameter.' }, { status: 400 })
    }

    const walletAddress = ethers.getAddress(parsed.data.address)

    /* -------------------------- Lookup user ----------------------------- */
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1)

    if (!user) {
      /* No matching account – client will present the on-board modal. */
      return NextResponse.json({ exists: false }, { status: 200 })
    }

    /* ------------------------- Refresh session -------------------------- */
    await setSession(user)

    return NextResponse.json({ exists: true }, { status: 200 })
  } catch (err: any) {
    console.error('wallet-status GET error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
