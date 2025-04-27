import { eq, ilike, asc, desc, and } from 'drizzle-orm'

import { db } from '../drizzle'
import { recruiterPipelines } from '../schema/recruiter'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PipelineRow = {
  id: number
  name: string
  description: string | null
  createdAt: Date
}

/* -------------------------------------------------------------------------- */
/*                              Paginated fetch                               */
/* -------------------------------------------------------------------------- */

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
  const offset = (page - 1) * pageSize

  /* --------------------------- ORDER BY helper --------------------------- */
  const orderBy =
    sortBy === 'name'
      ? order === 'asc'
        ? asc(recruiterPipelines.name)
        : desc(recruiterPipelines.name)
      : order === 'asc'
        ? asc(recruiterPipelines.createdAt)
        : desc(recruiterPipelines.createdAt)

  /* ----------------------------- WHERE clause ---------------------------- */
  const whereClause =
    searchTerm.trim().length === 0
      ? eq(recruiterPipelines.recruiterId, recruiterId)
      : and(
          eq(recruiterPipelines.recruiterId, recruiterId),
          ilike(recruiterPipelines.name, `%${searchTerm}%`),
        )

  /* ------------------------------ Query ---------------------------------- */
  const rows = await db
    .select({
      id: recruiterPipelines.id,
      name: recruiterPipelines.name,
      description: recruiterPipelines.description,
      createdAt: recruiterPipelines.createdAt,
    })
    .from(recruiterPipelines)
    .where(whereClause as any)
    .orderBy(orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { pipelines: rows as PipelineRow[], hasNext }
}
