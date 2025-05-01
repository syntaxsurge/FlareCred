'use server'

import { format } from 'date-fns'
import { eq } from 'drizzle-orm'
import { createHash } from 'crypto'

import { getUser } from '@/lib/db/queries/queries'
import { getRecruiterPipelinesPage } from '@/lib/db/queries/recruiter-pipelines'
import { db } from '@/lib/db/drizzle'
import {
  candidates,
  candidateCredentials,
} from '@/lib/db/schema/candidate'
import { issuers } from '@/lib/db/schema/issuer'
import { generateCandidateFitSummary } from '@/lib/ai/openai'

/**
 * Generate a recruiter-specific fit summary for a candidate and return it
 * directly (no persistence – the caller handles display or caching).
 *
 * Guards:
 * • User must be an authenticated recruiter.
 * • Limits pipelines to 20 most-recent entries to control token cost.
 */
export async function generateCandidateFit(candidateId: number): Promise<string> {
  const user = await getUser()
  if (!user) {
    throw new Error(
      'You must be signed in with a recruiter account to generate a Why Hire summary. ' +
      'Please connect your recruiter wallet and try again.',
    )
  }
  if (user.role !== 'recruiter') {
    throw new Error(
      `Access denied – your current role "${user.role}" cannot generate Why Hire summaries. ` +
      'Recruiter privileges are required.',
    )
  }

  /* ------------------------------------------------------------ */
  /*                  Fetch up-to-20 recruiter pipelines           */
  /* ------------------------------------------------------------ */
  const { pipelines } = await getRecruiterPipelinesPage(
    user.id,
    1,
    20,
    'createdAt',
    'desc',
    '',
  )

  const pipelineText =
    pipelines.length === 0
      ? 'NONE'
      : pipelines
          .map(
            (p, i) =>
              `${i + 1}. ${p.name}${p.description ? ` – ${p.description}` : ''}`,
          )
          .join('\n')

  /* ------------------------------------------------------------ */
  /*                    Build candidate profile text              */
  /* ------------------------------------------------------------ */
  const [cand] = await db
    .select({
      bio: candidates.bio,
    })
    .from(candidates)
    .where(eq(candidates.id, candidateId))
    .limit(1)

  if (!cand) throw new Error('Candidate not found.')

  const creds = await db
    .select({
      title: candidateCredentials.title,
      issuer: issuers.name,
    })
    .from(candidateCredentials)
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
    .where(eq(candidateCredentials.candidateId, candidateId))

  const profileLines = [
    cand.bio ?? '',
    '',
    'Credentials:',
    ...creds.map((c) => `• ${c.title}${c.issuer ? ` – ${c.issuer}` : ''}`),
  ]

  const profileStr = profileLines.join('\n').trim()

  /* ------------------------------------------------------------ */
  /*              Call OpenAI and return raw JSON string          */
  /* ------------------------------------------------------------ */
  return await generateCandidateFitSummary(pipelineText, profileStr)
}