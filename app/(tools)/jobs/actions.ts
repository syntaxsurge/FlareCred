'use server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { STAGES } from '@/lib/constants/recruiter'
import { db } from '@/lib/db/drizzle'
import { candidates, pipelineCandidates, recruiterPipelines } from '@/lib/db/schema'

/**
 * Server action: add the current candidate to the selected pipeline
 * with default stage "sourced”.  Guards ensure the caller is a candidate
 * and prevents duplicate applications.
 */
export const applyToJobAction = validatedActionWithUser(
  z.object({
    pipelineId: z.coerce.number(),
  }),
  async ({ pipelineId }, _formData, user) => {
    if (user.role !== 'candidate') {
      return { error: 'Only candidates can apply to jobs.' }
    }

    /* Resolve candidate row for the current user */
    const [cand] = await db
      .select({ id: candidates.id })
      .from(candidates)
      .where(eq(candidates.userId, user.id))
      .limit(1)

    if (!cand) {
      return { error: 'Candidate profile not found.' }
    }

    /* Verify pipeline exists */
    const [pipeline] = await db
      .select()
      .from(recruiterPipelines)
      .where(eq(recruiterPipelines.id, pipelineId))
      .limit(1)

    if (!pipeline) {
      return { error: 'Job opening not found.' }
    }

    /* Prevent duplicate applications */
    const dup = await db
      .select()
      .from(pipelineCandidates)
      .where(
        and(
          eq(pipelineCandidates.pipelineId, pipelineId),
          eq(pipelineCandidates.candidateId, cand.id),
        ),
      )
      .limit(1)

    if (dup.length > 0) {
      return { error: 'You have already applied to this job.' }
    }

    /* Insert application */
    await db.insert(pipelineCandidates).values({
      pipelineId,
      candidateId: cand.id,
      stage: STAGES[0], // 'sourced'
    })

    return { success: 'Application submitted.' }
  },
)