import { NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { quizAttempts, candidates } from '@/lib/db/schema/candidate'

/* -------------------------------------------------------------------------- */
/*                  P A Y L O A D   &   V A L I D A T I O N                   */
/* -------------------------------------------------------------------------- */

const Payload = z.object({
  quizId: z.number().int().positive(),
  score: z.number().int().min(0).max(100),
  seed: z.string().regex(/^0x[0-9a-fA-F]{1,64}$/),
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  vcJson: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = Payload.parse(body)

    /* Candidate ensure -------------------------------------------------- */
    let [candidateRow] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.userId, user.id))
      .limit(1)

    if (!candidateRow) {
      const [created] = await db.insert(candidates).values({ userId: user.id, bio: '' }).returning()
      candidateRow = created
    }

    /* Insert quizAttempt (minted Skill Pass) ---------------------------- */
    await db.insert(quizAttempts).values({
      candidateId: candidateRow.id,
      quizId: parsed.quizId,
      seed: parsed.seed,
      score: parsed.score,
      maxScore: 100,
      pass: 1,
      vcIssuedId: parsed.txHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      vcJson: parsed.vcJson ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message ?? 'Internal Server Error' }, { status: 500 })
  }
}
