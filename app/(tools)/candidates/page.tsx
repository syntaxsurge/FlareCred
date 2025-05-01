import { Users } from 'lucide-react'

import CandidatesTable from '@/components/candidate-directory/candidates-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getCandidateListingPage } from '@/lib/db/queries/candidates-core'
import type { CandidateDirectoryRow } from '@/lib/types/tables'
import {
  parsePagination,
  parseSort,
  getSearchTerm,
  pickParams,
  resolveSearchParams,
  type Query,
} from '@/lib/utils/query'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                               Constants                                    */
/* -------------------------------------------------------------------------- */

const ALLOWED_SORT_KEYS = ['name', 'email', 'verified'] as const
type SortKey = (typeof ALLOWED_SORT_KEYS)[number]

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default async function CandidateDirectoryPage({
  searchParams,
}: {
  searchParams?: Promise<Query>
}) {
  const params = await resolveSearchParams(searchParams)

  const { page, pageSize } = parsePagination(params)
  const { sort, order } = parseSort(params, ALLOWED_SORT_KEYS, 'name')
  const searchTerm = getSearchTerm(params).toLowerCase()

  const { candidates, hasNext } = await getCandidateListingPage(
    page,
    pageSize,
    sort as SortKey,
    order,
    searchTerm,
  )

  const rows: CandidateDirectoryRow[] = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    verified: c.verified,
  }))

  const initialParams = pickParams(params, ['size', 'sort', 'order', 'q'])

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
          order={order}
          basePath='/candidates'
          initialParams={initialParams}
          searchQuery={searchTerm}
        />

        <TablePagination
          page={page}
          hasNext={hasNext}
          basePath='/candidates'
          initialParams={initialParams}
          pageSize={pageSize}
        />
      </div>
    </PageCard>
  )
}