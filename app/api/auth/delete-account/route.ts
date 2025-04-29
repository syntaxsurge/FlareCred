// SPDX-License-Identifier: MIT
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'
import { ethers } from 'ethers'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

const payloadSchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid wallet address'),
  message: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, 'Invalid signature'),
})

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

/**
 * Permanently deletes (soft-deletes) the user account that owns the supplied
 * EVM address after verifying the signed confirmation message.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = payloadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }

    const { address, message, signature } = parsed.data
    const checksumAddress = ethers.getAddress(address)

    /* Signature verification --------------------------------------------- */
    let recovered: string
    try {
      recovered = ethers.verifyMessage(message, signature)
    } catch {
      return NextResponse.json({ error: 'Malformed signature.' }, { status: 400 })
    }
    if (recovered.toLowerCase() !== checksumAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Signature does not match address.' }, { status: 401 })
    }

    /* Fetch user ---------------------------------------------------------- */
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.walletAddress, checksumAddress))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    /* Soft-delete account ------------------------------------------------- */
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, user.id))

    /* Clear session cookie ------------------------------------------------ */
    ;(await cookies()).delete('session')

    return NextResponse.json({ success: 'Account deleted.' }, { status: 200 })
  } catch (err: any) {
    console.error('Account deletion error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
