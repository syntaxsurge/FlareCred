import { sql, eq } from 'drizzle-orm'

import type { JobRow } from '@/lib/types/tables'
import { db } from '../drizzle'
import { buildOrderExpr, buildSearchCondition, paginate } from './query-helpers'
import { recruiterPipelines } from '../schema/recruiter'
import { users } from '../schema/core'

/**
 * Fetch a paginated, searchable, sortable list of public job openings
 * backed by recruiter pipelines.
 */
export async function getJobOpeningsPage(
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'recruiter' | 'createdAt' = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ jobs: JobRow[]; hasNext: boolean }> {
  /* --------------------------- ORDER-BY helper --------------------------- */
  const sortMap = {
    name: recruiterPipelines.name,
    recruiter: users.name,
    createdAt: recruiterPipelines.createdAt,
  } as const

  const orderBy = buildOrderExpr(sortMap, sortBy, order)

  /* ----------------------------- WHERE clause --------------------------- */
  const searchCond = buildSearchCondition(searchTerm, [
    recruiterPipelines.name,
    users.name,
    recruiterPipelines.description,
  ])
  const whereExpr: any = searchCond ?? sql`TRUE`

  /* ------------------------------- Query -------------------------------- */
  const baseQuery = db
    .select({
      id: recruiterPipelines.id,
      name: recruiterPipelines.name,
      recruiter: users.name,
      description: recruiterPipelines.description,
      createdAt: recruiterPipelines.createdAt,
    })
    .from(recruiterPipelines)
    .innerJoin(users, eq(recruiterPipelines.recruiterId, users.id))
    .where(whereExpr)
    .orderBy(orderBy)

  const { rows, hasNext } = await paginate<JobRow>(baseQuery as any, page, pageSize)

  /* Normalise Date → ISO for serialisable rows */
  const jobs = rows.map((r) => ({
    ...r,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : (r.createdAt as string),
  })) as JobRow[]

  return { jobs, hasNext }
}