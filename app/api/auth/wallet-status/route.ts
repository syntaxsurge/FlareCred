import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ethers } from 'ethers'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'

/* -------------------------------------------------------------------------- */
/*                                 SCHEMA                                     */
/* -------------------------------------------------------------------------- */

const paramsSchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid wallet address'),
})

/* -------------------------------------------------------------------------- */
/*                                   GET                                      */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parsed = paramsSchema.safeParse({ address: url.searchParams.get('address') || '' })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid or missing address.' }, { status: 400 })
    }

    const address = ethers.getAddress(parsed.data.address)

    const [row] = await db
      .select({
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.walletAddress, address))
      .limit(1)

    const exists =
      !!row && row.name.trim().length > 0 && row.email.trim().length > 0 && row.role.trim().length > 0

    return NextResponse.json({ exists })
  } catch (err) {
    console.error('wallet-status error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}