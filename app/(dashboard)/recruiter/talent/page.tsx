import { redirect } from 'next/navigation'

import { Users } from 'lucide-react'

import TalentFilters from '@/components/dashboard/recruiter/talent-filters'
import TalentTable from '@/components/dashboard/recruiter/talent-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getUser } from '@/lib/db/queries/queries'
import { getTalentSearchPage } from '@/lib/db/queries/recruiter-talent'
import type { TalentRow } from '@/lib/types/tables'
import {
  parsePagination,
  parseSort,
  getSearchTerm,
  getParam,
  pickParams,
  resolveSearchParams,
  type Query,
} from '@/lib/utils/query'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const ALLOWED_SORT_KEYS = ['name', 'email', 'id'] as const

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function TalentSearchPage({
  searchParams,
}: {
  searchParams?: Promise<Query>
}) {
  const params = await resolveSearchParams(searchParams)

  const user = await getUser()
  if (!user) redirect('/connect-wallet')
  if (user.role !== 'recruiter') redirect('/')

  /* ---------------------- Pagination, sort, search ----------------------- */
  const { page, pageSize } = parsePagination(params)
  const { sort, order } = parseSort(params, ALLOWED_SORT_KEYS, 'name')
  const searchTerm = getSearchTerm(params)

  /* ------------------ Additional numeric / boolean filters --------------- */
  const verifiedOnly = getParam(params, 'verifiedOnly') === '1'
  const skillMin = Math.max(0, Number(getParam(params, 'skillMin') ?? '0'))
  const skillMax = Math.min(100, Number(getParam(params, 'skillMax') ?? '100'))

  /* ---------------------------- Data fetch ------------------------------- */
  const { candidates, hasNext } = await getTalentSearchPage(
    page,
    pageSize,
    sort as (typeof ALLOWED_SORT_KEYS)[number],
    order,
    searchTerm,
    verifiedOnly,
    skillMin,
    skillMax,
  )

  const rows: TalentRow[] = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    bio: c.bio,
    verified: c.verified,
    topScore: c.topScore,
  }))

  /* ------------------------ Build initialParams -------------------------- */
  const initialParams = pickParams(params, ['size', 'sort', 'order', 'q'])

  /* ------------------------------- View ---------------------------------- */
  return (
    <section className='mx-auto max-w-6xl py-10'>
      <PageCard
        icon={Users}
        title='Talent Search'
        description='Discover and shortlist qualified candidates.'
      >
        <div className='space-y-6'>
          {/* Filters */}
          <TalentFilters
            basePath='/recruiter/talent'
            initialParams={initialParams}
            skillMin={skillMin}
            skillMax={skillMax}
            verifiedOnly={verifiedOnly}
          />

          {/* Results table */}
          <TalentTable
            rows={rows}
            sort={sort}
            order={order as 'asc' | 'desc'}
            basePath='/recruiter/talent'
            initialParams={{
              ...initialParams,
              skillMin: String(skillMin),
              skillMax: String(skillMax),
              verifiedOnly: verifiedOnly ? '1' : '',
            }}
            searchQuery={searchTerm}
          />

          <TablePagination
            page={page}
            hasNext={hasNext}
            basePath='/recruiter/talent'
            initialParams={{
              ...initialParams,
              skillMin: String(skillMin),
              skillMax: String(skillMax),
              verifiedOnly: verifiedOnly ? '1' : '',
            }}
            pageSize={pageSize}
          />
        </div>
      </PageCard>
    </section>
  )
}
