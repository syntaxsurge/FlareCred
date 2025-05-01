import { and, eq, inArray } from 'drizzle-orm'
import { Briefcase } from 'lucide-react'

import JobsTable from '@/components/job-directory/jobs-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { db } from '@/lib/db/drizzle'
import { getJobOpeningsPage } from '@/lib/db/queries/job-openings'
import { getUser } from '@/lib/db/queries/queries'
import { candidates as candidatesTable } from '@/lib/db/schema/candidate'
import { pipelineCandidates } from '@/lib/db/schema/recruiter'
import type { JobRow } from '@/lib/types/tables'
import {
  parsePagination,
  parseSort,
  getSearchTerm,
  resolveSearchParams,
  pickParams,
  type Query,
} from '@/lib/utils/query'

export const revalidate = 0

/* Allowed sort keys */
const SORT_KEYS = ['name', 'recruiter', 'createdAt'] as const
type SortKey = (typeof SORT_KEYS)[number]

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function JobsDirectoryPage({
  searchParams,
}: {
  searchParams?: Promise<Query>
}) {
  const params = await resolveSearchParams(searchParams)

  /* ----------------------------- Query params ---------------------------- */
  const { page, pageSize } = parsePagination(params)
  const { sort: sortParam, order } = parseSort(params, SORT_KEYS, 'createdAt')
  const sort: SortKey = sortParam as SortKey
  const searchTerm = getSearchTerm(params).toLowerCase()

  /* ------------------------------ Data fetch ----------------------------- */
  const { jobs, hasNext } = await getJobOpeningsPage(
    page,
    pageSize,
    sort,
    order as 'asc' | 'desc',
    searchTerm,
  )

  /* ------------------- Enrich with applied status & role ------------------ */
  const user = await getUser()
  const isCandidate = user?.role === 'candidate'

  let appliedSet = new Set<number>()
  if (isCandidate) {
    const [cand] = await db
      .select({ id: candidatesTable.id })
      .from(candidatesTable)
      .where(eq(candidatesTable.userId, user!.id))
      .limit(1)

    if (cand) {
      const pipelineIds = jobs.map((j) => j.id)
      if (pipelineIds.length) {
        const appliedRows = await db
          .select({ pipelineId: pipelineCandidates.pipelineId })
          .from(pipelineCandidates)
          .where(
            and(
              eq(pipelineCandidates.candidateId, cand.id),
              inArray(pipelineCandidates.pipelineId, pipelineIds),
            ),
          )
        appliedSet = new Set(appliedRows.map((r) => r.pipelineId))
      }
    }
  }

  const rows: JobRow[] = jobs.map((j) => ({
    ...j,
    applied: appliedSet.has(j.id),
  }))

  /* --------------------------- initialParams ----------------------------- */
  const initialParams = pickParams(params, ['size', 'sort', 'order', 'q'])

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
          basePath={'/jobs'}
          initialParams={initialParams}
          searchQuery={searchTerm}
          isCandidate={isCandidate}
        />

        <TablePagination
          page={page}
          hasNext={hasNext}
          basePath={'/jobs'}
          initialParams={initialParams}
          pageSize={pageSize}
        />
      </div>
    </PageCard>
  )
}