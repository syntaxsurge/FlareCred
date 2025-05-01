import { NextRequest, NextResponse } from 'next/server'

import { inArray, eq } from 'drizzle-orm'
import { z } from 'zod'

import { checkSubscription } from '@/lib/contracts/flare'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { teams, teamMembers } from '@/lib/db/schema/core'

/* -------------------------------------------------------------------------- */
/*                               V A L I D A T I O N                          */
/* -------------------------------------------------------------------------- */

const BodySchema = z.object({
  /** 1 = Base, 2 = Plus */
  planKey: z.number().int().min(1).max(2),
})

/* -------------------------------------------------------------------------- */
/*                                     POST                                   */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { planKey } = BodySchema.parse(body)
    const planName = planKey === 1 ? 'base' : 'plus'

    /* ----------------------- Read on-chain paidUntil ---------------------- */
    const paidUntil = await checkSubscription(user.walletAddress)
    if (!paidUntil) {
      return NextResponse.json({ error: 'Subscription not active on chain' }, { status: 400 })
    }

    /* --------------------------- Resolve team ids ------------------------ */
    const created = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.creatorUserId, user.id))

    const member = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))

    const ids = Array.from(
      new Set<number>([...created.map((t) => t.id), ...member.map((m) => m.teamId)]),
    )
    if (ids.length === 0) {
      return NextResponse.json({ error: 'No team found for user' }, { status: 404 })
    }

    /* ------------------------- Persist to database ----------------------- */
    await db
      .update(teams)
      .set({
        planName,
        subscriptionPaidUntil: paidUntil,
      })
      .where(inArray(teams.id, ids))

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
