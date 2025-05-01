'use server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { candidates, candidateCredentials } from '@/lib/db/schema/candidate'
import { issuers } from '@/lib/db/schema/issuer'
import { summariseCandidateProfile } from '@/lib/ai/openai'

/**
 * Generate an AI summary for the given candidate and cache it in the database.
 */
export async function generateCandidateSummary(candidateId: number): Promise<void> {
  /* Existing summary check */
  const [cand] = await db
    .select({
      summary: candidates.summary,
      bio: candidates.bio,
    })
    .from(candidates)
    .where(eq(candidates.id, candidateId))
    .limit(1)

  if (!cand) {
    throw new Error('Candidate not found.')
  }
  if (cand.summary && cand.summary.trim().length > 0) return

  /* Gather credential titles for context */
  const creds = await db
    .select({
      title: candidateCredentials.title,
      issuer: issuers.name,
    })
    .from(candidateCredentials)
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
    .where(eq(candidateCredentials.candidateId, candidateId))

  const profileText =
    `${cand.bio ?? ''}\n\nCredentials:\n` +
    creds.map((c) => `${c.title}${c.issuer ? ` – ${c.issuer}` : ''}`).join('\n')

  /* AI summary */
  const summary = await summariseCandidateProfile(profileText, 120)

  /* Persist */
  await db.update(candidates).set({ summary }).where(eq(candidates.id, candidateId))
}