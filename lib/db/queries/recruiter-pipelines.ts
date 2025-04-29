import { eq, and } from 'drizzle-orm'

import type { PipelineRow } from '@/lib/types/table-rows'

import { db } from '../drizzle'
import { buildOrderExpr, buildSearchCondition, paginate } from './query-helpers'
import { recruiterPipelines } from '../schema/recruiter'

/**
 * Paginate pipelines for the given recruiter with optional search and sorting.
 */
export async function getRecruiterPipelinesPage(
  recruiterId: number,
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'createdAt' = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ pipelines: PipelineRow[]; hasNext: boolean }> {
  /* --------------------------- ORDER BY helper --------------------------- */
  const sortMap = {
    name: recruiterPipelines.name,
    createdAt: recruiterPipelines.createdAt,
  } as const

  const orderBy = buildOrderExpr(sortMap, sortBy, order)

  /* ----------------------------- WHERE clause ---------------------------- */
  const base = eq(recruiterPipelines.recruiterId, recruiterId)
  const searchCond = buildSearchCondition(searchTerm, [recruiterPipelines.name])
  const whereClause = searchCond ? and(base, searchCond) : base

  /* ------------------------------ Query ---------------------------------- */
  const baseQuery = db
    .select({
      id: recruiterPipelines.id,
      name: recruiterPipelines.name,
      description: recruiterPipelines.description,
      createdAt: recruiterPipelines.createdAt,
    })
    .from(recruiterPipelines)
    .where(whereClause as any)
    .orderBy(orderBy)

  const { rows, hasNext } = await paginate<PipelineRow>(baseQuery as any, page, pageSize)

  return { pipelines: rows as PipelineRow[], hasNext }
}
