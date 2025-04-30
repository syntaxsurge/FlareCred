import { asc, desc, ilike, sql, eq } from 'drizzle-orm'
import { Briefcase } from 'lucide-react'

import JobsTable from '@/components/job-directory/jobs-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { db } from '@/lib/db/drizzle'
import { recruiterPipelines, users } from '@/lib/db/schema'
import type { JobRow } from '@/lib/types/tables'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>
const BASE_PATH = '/jobs'

const first = (p: Query, k: string) => (Array.isArray(p[k]) ? p[k]?.[0] : p[k])

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function JobsDirectoryPage({
  searchParams,
}: {
  searchParams: Query | Promise<Query>
}) {
  const params = (await searchParams) as Query

  /* ----------------------------- Query params ---------------------------- */
  const page = Math.max(1, Number(first(params, 'page') ?? '1'))
  const sizeRaw = Number(first(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = first(params, 'sort') ?? 'createdAt'
  const order = first(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (first(params, 'q') ?? '').trim().toLowerCase()

  /* ----------------------------- Sort map -------------------------------- */
  const sortMap = {
    name: recruiterPipelines.name,
    recruiter: users.name,
    createdAt: recruiterPipelines.createdAt,
  } as const

  const orderExpr =
    order === 'asc'
      ? asc(sortMap[sort as keyof typeof sortMap])
      : desc(sortMap[sort as keyof typeof sortMap])

  /* ----------------------------- Where clause ---------------------------- */
  let whereExpr: any = sql`TRUE`
  if (searchTerm.length > 0) {
    whereExpr = ilike(recruiterPipelines.name, `%${searchTerm}%`)
    whereExpr = sql`${whereExpr} OR ${ilike(users.name, `%${searchTerm}%`)}`
  }

  /* ----------------------------- Fetch rows ------------------------------ */
  const offset = (page - 1) * pageSize
  const rowsRaw = await db
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
    .orderBy(orderExpr)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rowsRaw.length > pageSize
  if (hasNext) rowsRaw.pop()

  const rows: JobRow[] = rowsRaw.map((r) => ({
    id: r.id,
    name: r.name,
    recruiter: r.recruiter,
    description: r.description,
    createdAt: r.createdAt.toISOString(),
  }))

  /* --------------------------- initialParams ----------------------------- */
  const initialParams: Record<string, string> = {}
  const keep = (k: string) => {
    const v = first(params, k)
    if (v) initialParams[k] = v
  }
  keep('size')
  keep('sort')
  keep('order')
  if (searchTerm) initialParams['q'] = searchTerm

  /* ------------------------------- View ---------------------------------- */
  return (
    <PageCard
      icon={Briefcase}
      title='Job Openings'
      description='Browse publicly listed job pipelines and apply directly.'
    >
      <div className='space-y-4 overflow-x-auto'>
        <JobsTable
          rows={rows}
          sort={sort}
          order={order as 'asc' | 'desc'}
          basePath={BASE_PATH}
          initialParams={initialParams}
          searchQuery={searchTerm}
        />

        <TablePagination
          page={page}
          hasNext={hasNext}
          basePath={BASE_PATH}
          initialParams={initialParams}
          pageSize={pageSize}
        />
      </div>
    </PageCard>
  )
}