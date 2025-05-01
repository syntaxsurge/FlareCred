'use server'

import { eq } from 'drizzle-orm'

import { getUser } from '@/lib/db/queries/queries'
import { getRecruiterPipelinesPage } from '@/lib/db/queries/recruiter-pipelines'
import { db } from '@/lib/db/drizzle'
import {
  candidates,
  candidateCredentials,
} from '@/lib/db/schema/candidate'
import { issuers } from '@/lib/db/schema/issuer'
import { generateCandidateFitSummary } from '@/lib/ai/openai'
import { validateCandidateFitJson } from '@/lib/ai/fit-summary'

/* -------------------------------------------------------------------------- */
/*               R E C R U I T E R   " W H Y   H I R E ”  A C T I O N        */
/* -------------------------------------------------------------------------- */

/**
 * Generate a recruiter-specific fit summary for a candidate.
 * Retries up to 3 times when OpenAI returns malformed JSON.
 *
 * @throws Error with detailed reason when validation fails after 3 attempts.
 */
export async function generateCandidateFit(candidateId: number): Promise<string> {
  /* ----------------------------- Auth guard ----------------------------- */
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

  /* ------------------ Fetch up-to-20 recruiter pipelines ---------------- */
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

  /* ---------------------- Build candidate profile text ------------------ */
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

  /* -------------------- Call OpenAI with validation & retry ------------- */
  const MAX_RETRIES = 3
  let lastError = 'Unknown error'

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const raw = await generateCandidateFitSummary(pipelineText, profileStr)

    try {
      const parsed = JSON.parse(raw)
      const validationMessage = validateCandidateFitJson(parsed)
      if (!validationMessage) {
        /* Success – return the raw JSON string as generated */
        return raw.trim()
      }
      lastError = validationMessage
    } catch (err: any) {
      lastError = `Unable to parse JSON (${err?.message ?? 'unknown parse error'}).`
    }
    /* On failure, loop to retry */
  }

  /* All retries failed – throw detailed error for frontend toast */
  throw new Error(
    'OpenAI returned invalid JSON three times in a row. ' +
    `Last validation error: ${lastError} ` +
    'Please click "Why Hire” again to retry.',
  )
}