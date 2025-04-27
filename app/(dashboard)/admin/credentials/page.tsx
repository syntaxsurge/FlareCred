import { redirect } from 'next/navigation'

import { FileText } from 'lucide-react'

import AdminCredentialsTable, { type RowType } from '@/components/dashboard/admin/credentials-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getAdminCredentialsPage } from '@/lib/db/queries/admin-credentials'
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

export default async function AdminCredentialsPage({
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
  const { credentials, hasNext } = await getAdminCredentialsPage(
    page,
    pageSize,
    sort as 'title' | 'candidate' | 'issuer' | 'status' | 'id',
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: RowType[] = credentials.map((c) => ({
    id: c.id,
    title: c.title,
    candidate: c.candidate,
    issuer: c.issuer,
    status: c.status as any,
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
      icon={FileText}
      title='All Credentials'
      description='View and manage all candidate credentials.'
    >
      <div className='space-y-4 overflow-x-auto'>
        <AdminCredentialsTable
          rows={rows}
          sort={sort}
          order={order as 'asc' | 'desc'}
          basePath='/admin/credentials'
          initialParams={initialParams}
          searchQuery={searchTerm}
        />

        <TablePagination
          page={page}
          hasNext={hasNext}
          basePath='/admin/credentials'
          initialParams={initialParams}
          pageSize={pageSize}
        />
      </div>
    </PageCard>
  )
}
