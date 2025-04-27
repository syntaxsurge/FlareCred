import { redirect } from 'next/navigation'

import { Building } from 'lucide-react'

import AdminIssuersTable, { type RowType } from '@/components/dashboard/admin/issuers-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getAdminIssuersPage } from '@/lib/db/queries/admin-issuers'
import { getUser } from '@/lib/db/queries/queries'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>
const first = (p: Query, k: string) => (Array.isArray(p[k]) ? p[k]?.[0] : p[k])

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function AdminIssuersPage({
  searchParams,
}: {
  searchParams: Promise<Query> | Query
}) {
  const params = (await searchParams) as Query

  const currentUser = await getUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(first(params, 'page') ?? '1'))

  const sizeRaw = Number(first(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = first(params, 'sort') ?? 'id'
  const order = first(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (first(params, 'q') ?? '').trim()

  /* ---------------------------- Data fetch ------------------------------- */
  const { issuers, hasNext } = await getAdminIssuersPage(
    page,
    pageSize,
    sort as 'name' | 'domain' | 'owner' | 'category' | 'industry' | 'status' | 'id',
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: RowType[] = issuers.map((i) => ({
    id: i.id,
    name: i.name,
    domain: i.domain,
    owner: i.owner,
    category: i.category,
    industry: i.industry,
    status: i.status,
  }))

  /* ------------------------ Build initialParams -------------------------- */
  const initialParams: Record<string, string> = {}
  const keep = (k: string) => {
    const v = first(params, k)
    if (v) initialParams[k] = v
  }
  keep('size')
  keep('sort')
  keep('order')
  if (searchTerm) initialParams.q = searchTerm

  /* ------------------------------ View ----------------------------------- */
  return (
    <PageCard
      icon={Building}
      title='Issuer Management'
      description='Review, verify, and manage issuers.'
    >
      <div className='space-y-4 overflow-x-auto'>
        <AdminIssuersTable
          rows={rows}
          sort={sort}
          order={order as 'asc' | 'desc'}
          basePath='/admin/issuers'
          initialParams={initialParams}
          searchQuery={searchTerm}
        />

        <TablePagination
          page={page}
          hasNext={hasNext}
          basePath='/admin/issuers'
          initialParams={initialParams}
          pageSize={pageSize}
        />
      </div>
    </PageCard>
  )
}
