import { redirect } from 'next/navigation'

import { Building } from 'lucide-react'

import AdminIssuersTable from '@/components/dashboard/admin/issuers-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getAdminIssuersPage } from '@/lib/db/queries/admin-issuers'
import { getUser } from '@/lib/db/queries/queries'
import type { AdminIssuerRow } from '@/lib/types/tables'
import { getParam, resolveSearchParams, type Query } from '@/lib/utils/query'

export const revalidate = 0

export default async function AdminIssuersPage({
  searchParams,
}: {
  searchParams?: Promise<Query>
}) {
  /* Resolve synchronous or async `searchParams` supplied by Next.js 15 */
  const params = await resolveSearchParams(searchParams)

  const currentUser = await getUser()
  if (!currentUser) redirect('/connect-wallet')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(getParam(params, 'page') ?? '1'))

  const sizeRaw = Number(getParam(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = getParam(params, 'sort') ?? 'id'
  const order = getParam(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (getParam(params, 'q') ?? '').trim()

  /* ---------------------------- Data fetch ------------------------------- */
  const { issuers, hasNext } = await getAdminIssuersPage(
    page,
    pageSize,
    sort as 'name' | 'domain' | 'owner' | 'category' | 'industry' | 'status' | 'id',
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: AdminIssuerRow[] = issuers.map((i) => ({
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
    const v = getParam(params, k)
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
