import { NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'
import { ethers } from 'ethers'
import { z } from 'zod'

import { setSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { users, teams, teamMembers, activityLogs, ActivityType } from '@/lib/db/schema'

/* -------------------------------------------------------------------------- */
/*                                    SCHEMA                                  */
/* -------------------------------------------------------------------------- */

const payloadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['candidate', 'recruiter', 'issuer']),
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid wallet address'),
})

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function normaliseEmail(email: string) {
  return email.trim().toLowerCase()
}

async function emailExists(email: string) {
  const row = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return row.length > 0
}

async function walletExists(wallet: string) {
  const row = await db.select().from(users).where(eq(users.walletAddress, wallet)).limit(1)
  return row.length > 0
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = payloadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }

    const name = parsed.data.name.trim()
    const email = normaliseEmail(parsed.data.email)
    const role = parsed.data.role
    const walletAddress = ethers.getAddress(parsed.data.address) // EIP-55 checksum

    /* Duplicate checks ---------------------------------------------------- */
    if (await emailExists(email)) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 })
    }
    if (await walletExists(walletAddress)) {
      return NextResponse.json({ error: 'Wallet already registered.' }, { status: 409 })
    }

    /* Create user --------------------------------------------------------- */
    const [user] = await db.insert(users).values({ name, email, role, walletAddress }).returning()

    /* Personal placeholder team ------------------------------------------ */
    const [team] = await db
      .insert(teams)
      .values({ name: `${email}'s Team`, creatorUserId: user.id })
      .returning()

    await db.insert(teamMembers).values({
      userId: user.id,
      teamId: team.id,
      role: 'owner',
    })

    /* Activity log -------------------------------------------------------- */
    await db.insert(activityLogs).values({
      teamId: team.id,
      userId: user.id,
      action: ActivityType.CREATE_TEAM,
      ipAddress: req.headers.get('x-forwarded-for') ?? '',
    })

    /* Session cookie ------------------------------------------------------ */
    await setSession(user)

    return NextResponse.json({ success: 'Account created.' }, { status: 200 })
  } catch (err: any) {
    console.error('Wallet onboard error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
