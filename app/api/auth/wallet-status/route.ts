// SPDX-License-Identifier: MIT
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ethers } from 'ethers'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'
import { setSession } from '@/lib/auth/session'

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

const paramsSchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid wallet address'),
})

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parsed = paramsSchema.safeParse({ address: url.searchParams.get('address') || '' })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid or missing address.' }, { status: 400 })
    }

    const address = ethers.getAddress(parsed.data.address)

    /* Fetch full user record so we can initialise a session */
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, address))
      .limit(1)

    const profileComplete =
      !!user &&
      String(user.name ?? '').trim().length > 0 &&
      String(user.email ?? '').trim().length > 0 &&
      String(user.role ?? '').trim().length > 0

    /* If profile is complete, create/refresh the session cookie */
    if (profileComplete) {
      await setSession(user as any)
    }

    return NextResponse.json({ exists: profileComplete })
  } catch (err) {
    console.error('wallet-status error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}