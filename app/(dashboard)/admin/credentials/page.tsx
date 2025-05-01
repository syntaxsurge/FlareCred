import { redirect } from 'next/navigation'

import { FileText } from 'lucide-react'

import AdminCredentialsTable from '@/components/dashboard/admin/credentials-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getAdminCredentialsPage } from '@/lib/db/queries/admin-credentials'
import { getUser } from '@/lib/db/queries/queries'
import type { AdminCredentialRow } from '@/lib/types/tables'
import { getParam, resolveSearchParams, type Query } from '@/lib/utils/query'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function AdminCredentialsPage({
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
  const { credentials, hasNext } = await getAdminCredentialsPage(
    page,
    pageSize,
    sort as 'title' | 'candidate' | 'issuer' | 'status' | 'id',
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: AdminCredentialRow[] = credentials.map((c) => ({
    id: c.id,
    title: c.title,
    candidate: c.candidate,
    issuer: c.issuer,
    status: c.status,
    proofType: c.proofType,
    vcJson: c.vcJson,
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
