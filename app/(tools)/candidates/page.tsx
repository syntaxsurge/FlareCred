import { Users } from 'lucide-react'

import CandidatesTable from '@/components/candidate-directory/candidates-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getCandidateListingPage } from '@/lib/db/queries/candidates-core'
import type { CandidateDirectoryRow } from '@/lib/types/tables'
import {
  getParam,
  resolveSearchParams,
  pickParams,
  type Query,
} from '@/lib/utils/query'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                               P A R A M S                                  */
/* -------------------------------------------------------------------------- */

const ALLOWED_SORT_KEYS = ['name', 'email', 'verified'] as const
type SortKey = (typeof ALLOWED_SORT_KEYS)[number]

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default async function CandidateDirectoryPage({
  searchParams,
}: {
  searchParams?: Promise<Query>
}) {
  /* ----------------------------- Read params ---------------------------- */
  const params = await resolveSearchParams(searchParams)

  const page = Math.max(1, Number(getParam(params, 'page') ?? '1'))
  const sizeRaw = Number(getParam(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sortRaw = getParam(params, 'sort') ?? 'name'
  const sort: SortKey = ALLOWED_SORT_KEYS.includes(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : 'name'

  const order = getParam(params, 'order') === 'desc' ? 'desc' : 'asc'
  const searchTerm = (getParam(params, 'q') ?? '').trim().toLowerCase()

  /* ------------------------------ Data fetch ---------------------------- */
  const { candidates, hasNext } = await getCandidateListingPage(
    page,
    pageSize,
    sort as any,
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: CandidateDirectoryRow[] = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    verified: c.verified,
  }))

  /* ---------------------------- initialParams --------------------------- */
  const initialParams = pickParams(params, ['size', 'sort', 'order', 'q'])

  /* ------------------------------- View --------------------------------- */
  return (
    <PageCard
      icon={Users}
      title='Candidate Directory'
      description='Browse public candidate profiles. Use the search box, sortable headers and pagination controls to find talent quickly.'
    >
      <div className='space-y-4 overflow-x-auto'>
        <CandidatesTable
          rows={rows}
          sort={sort}
          order={order as 'asc' | 'desc'}
          basePath={'/candidates'}
          initialParams={initialParams}
          searchQuery={searchTerm}
        />

        <TablePagination
          page={page}
          hasNext={hasNext}
          basePath={'/candidates'}
          initialParams={initialParams}
          pageSize={pageSize}
        />
      </div>
    </PageCard>
  )
}