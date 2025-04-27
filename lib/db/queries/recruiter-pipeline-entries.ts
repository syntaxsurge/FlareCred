import { and, asc, desc, eq, ilike } from 'drizzle-orm'

import { db } from '../drizzle'
import { recruiterPipelines as rp, pipelineCandidates as pc } from '../schema/recruiter'

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
        ? asc(rp.name)
        : desc(rp.name)
      : sortBy === 'stage'
        ? order === 'asc'
          ? asc(pc.stage)
          : desc(pc.stage)
        : sortBy === 'addedAt'
          ? order === 'asc'
            ? asc(pc.addedAt)
            : desc(pc.addedAt)
          : order === 'asc'
            ? asc(pc.id)
            : desc(pc.id)

  /* ----------------------------- WHERE clause ---------------------------- */
  const where =
    searchTerm.trim().length === 0
      ? and(eq(pc.candidateId, candidateId), eq(rp.recruiterId, recruiterId))
      : and(
          eq(pc.candidateId, candidateId),
          eq(rp.recruiterId, recruiterId),
          ilike(rp.name, `%${searchTerm}%`),
        )

  /* ------------------------------ Query ---------------------------------- */
  const rows = await db
    .select({
      id: pc.id,
      pipelineId: rp.id,
      pipelineName: rp.name,
      stage: pc.stage,
      addedAt: pc.addedAt,
    })
    .from(pc)
    .innerJoin(rp, eq(pc.pipelineId, rp.id))
    .where(where as any)
    .orderBy(orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { entries: rows as PipelineEntryRow[], hasNext }
}
