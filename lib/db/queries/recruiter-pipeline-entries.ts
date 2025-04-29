import { and, asc, desc, eq, ilike } from 'drizzle-orm'

import { db } from '../drizzle'
import { recruiterPipelines, pipelineCandidates } from '../schema/recruiter'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PipelineEntryRow = {
  id: number
  pipelineId: number
  pipelineName: string
  stage: string
  addedAt: Date
}

/* -------------------------------------------------------------------------- */
/*                             Paginated fetch                                */
/* -------------------------------------------------------------------------- */

/**
 * Return a page of pipeline entries for a candidate, limited to pipelines
 * owned by the recruiter. Supports search, sort and pagination.
 */
export async function getCandidatePipelineEntriesPage(
  candidateId: number,
  recruiterId: number,
  page: number,
  pageSize = 10,
  sortBy: 'pipelineName' | 'stage' | 'addedAt' | 'id' = 'addedAt',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ entries: PipelineEntryRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* --------------------------- ORDER BY helper --------------------------- */
  const orderBy =
    sortBy === 'pipelineName'
      ? order === 'asc'
        ? asc(recruiterPipelines.name)
        : desc(recruiterPipelines.name)
      : sortBy === 'stage'
        ? order === 'asc'
          ? asc(pipelineCandidates.stage)
          : desc(pipelineCandidates.stage)
        : sortBy === 'addedAt'
          ? order === 'asc'
            ? asc(pipelineCandidates.addedAt)
            : desc(pipelineCandidates.addedAt)
          : order === 'asc'
            ? asc(pipelineCandidates.id)
            : desc(pipelineCandidates.id)

  /* ----------------------------- WHERE clause ---------------------------- */
  const where =
    searchTerm.trim().length === 0
      ? and(eq(pipelineCandidates.candidateId, candidateId), eq(recruiterPipelines.recruiterId, recruiterId))
      : and(
          eq(pipelineCandidates.candidateId, candidateId),
          eq(recruiterPipelines.recruiterId, recruiterId),
          ilike(recruiterPipelines.name, `%${searchTerm}%`),
        )

  /* ------------------------------ Query ---------------------------------- */
  const rows = await db
    .select({
      id: pipelineCandidates.id,
      pipelineId: recruiterPipelines.id,
      pipelineName: recruiterPipelines.name,
      stage: pipelineCandidates.stage,
      addedAt: pipelineCandidates.addedAt,
    })
    .from(pipelineCandidates)
    .innerJoin(recruiterPipelines, eq(pipelineCandidates.pipelineId, recruiterPipelines.id))
    .where(where as any)
    .orderBy(orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { entries: rows as PipelineEntryRow[], hasNext }
}
