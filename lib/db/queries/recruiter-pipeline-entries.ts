import { and, eq } from 'drizzle-orm'

import type { PipelineEntryRow } from '@/lib/types/table-rows'

import { db } from '../drizzle'
import { buildOrderExpr, buildSearchCondition, paginate } from './query-helpers'
import { recruiterPipelines, pipelineCandidates } from '../schema/recruiter'

/* -------------------------------------------------------------------------- */
/*                             Paginated fetch                                */
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
  /* --------------------------- ORDER BY helper --------------------------- */
  const sortMap = {
    pipelineName: recruiterPipelines.name,
    stage: pipelineCandidates.stage,
    addedAt: pipelineCandidates.addedAt,
    id: pipelineCandidates.id,
  } as const

  const orderBy = buildOrderExpr(sortMap, sortBy, order)

  /* ----------------------------- WHERE clause ---------------------------- */
  const base = and(
    eq(pipelineCandidates.candidateId, candidateId),
    eq(recruiterPipelines.recruiterId, recruiterId),
  )

  const searchCond = buildSearchCondition(searchTerm, [recruiterPipelines.name])
  const whereClause = searchCond ? and(base, searchCond) : base

  /* ------------------------------ Query ---------------------------------- */
  const baseQuery = db
    .select({
      id: pipelineCandidates.id,
      pipelineId: recruiterPipelines.id,
      pipelineName: recruiterPipelines.name,
      stage: pipelineCandidates.stage,
      addedAt: pipelineCandidates.addedAt,
    })
    .from(pipelineCandidates)
    .innerJoin(recruiterPipelines, eq(pipelineCandidates.pipelineId, recruiterPipelines.id))
    .where(whereClause as any)
    .orderBy(orderBy)

  const { rows, hasNext } = await paginate<PipelineEntryRow>(baseQuery as any, page, pageSize)

  /* Cast Date → ISO string for uniform consumption */
  const entries = rows.map((r) => ({
    ...r,
    addedAt: r.addedAt instanceof Date ? r.addedAt.toISOString() : r.addedAt,
  })) as PipelineEntryRow[]

  return { entries, hasNext }
}
