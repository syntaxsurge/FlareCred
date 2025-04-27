import { redirect } from 'next/navigation'

import { Users } from 'lucide-react'

import TalentFilters from '@/components/dashboard/recruiter/talent-filters'
import TalentTable, { RowType } from '@/components/dashboard/recruiter/talent-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getUser } from '@/lib/db/queries/queries'
import { getTalentSearchPage } from '@/lib/db/queries/recruiter-talent'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>

function getParam(params: Query, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function TalentSearchPage({
  searchParams,
}: {
  searchParams: Promise<Query> | Query
}) {
  const params = (await searchParams) as Query

  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(getParam(params, 'page') ?? '1'))

  const sizeRaw = Number(getParam(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = getParam(params, 'sort') ?? 'name'
  const order = getParam(params, 'order') === 'desc' ? 'desc' : 'asc'

  const searchTerm = (getParam(params, 'q') ?? '').trim()
  const verifiedOnly = getParam(params, 'verifiedOnly') === '1'
  const skillMin = Math.max(0, Number(getParam(params, 'skillMin') ?? '0'))
  const skillMax = Math.min(100, Number(getParam(params, 'skillMax') ?? '100'))

  /* ---------------------------- Data fetch ------------------------------- */
  const { candidates, hasNext } = await getTalentSearchPage(
    page,
    pageSize,
    sort as 'name' | 'email' | 'id',
    order as 'asc' | 'desc',
    searchTerm,
    verifiedOnly,
    skillMin,
    skillMax,
  )

  const rows: RowType[] = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    bio: c.bio,
    verified: c.verified,
    topScore: c.topScore,
  }))

  /* ------------------------ Build initialParams -------------------------- */
  const initialParams: Record<string, string> = {}
  const add = (k: string) => {
    const val = getParam(params, k)
    if (val) initialParams[k] = val
  }
  add('size')
  add('sort')
  add('order')
  add('q')
  /* skillMin/skillMax handled separately */

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
