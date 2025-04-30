import { Briefcase } from 'lucide-react'

import JobsTable from '@/components/job-directory/jobs-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getJobOpeningsPage } from '@/lib/db/queries/job-openings'
import type { JobRow } from '@/lib/types/tables'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>
const BASE_PATH = '/jobs'
const first = (p: Query, k: string) => (Array.isArray(p[k]) ? p[k]?.[0] : p[k])

/* Allowed sort keys (validated to prevent SQL-inj) */
const SORT_KEYS = ['name', 'recruiter', 'createdAt'] as const
type SortKey = (typeof SORT_KEYS)[number]

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

  const sortRaw = first(params, 'sort') ?? 'createdAt'
  const sort: SortKey = SORT_KEYS.includes(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : 'createdAt'

  const order = first(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (first(params, 'q') ?? '').trim().toLowerCase()

  /* ------------------------------ Data fetch ----------------------------- */
  const { jobs, hasNext } = await getJobOpeningsPage(
    page,
    pageSize,
    sort,
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: JobRow[] = jobs

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