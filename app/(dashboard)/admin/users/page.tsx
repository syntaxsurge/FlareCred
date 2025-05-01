import { redirect } from 'next/navigation'

import { Users } from 'lucide-react'

import AdminUsersTable from '@/components/dashboard/admin/users-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getAdminUsersPage } from '@/lib/db/queries/admin-users'
import { getUser } from '@/lib/db/queries/queries'
import type { AdminUserRow } from '@/lib/types/tables'
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
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const ALLOWED_SORT_KEYS = ['name', 'email', 'role', 'createdAt'] as const

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function AdminUsersPage({ searchParams }: { searchParams?: Promise<Query> }) {
  const params = await resolveSearchParams(searchParams)

  const currentUser = await getUser()
  if (!currentUser) redirect('/connect-wallet')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  /* ---------------------- Pagination, sort, search ----------------------- */
  const { page, pageSize } = parsePagination(params)
  const { sort, order } = parseSort(params, ALLOWED_SORT_KEYS, 'createdAt')
  const searchTerm = getSearchTerm(params)

  /* ---------------------------- Data fetch ------------------------------- */
  const { users, hasNext } = await getAdminUsersPage(
    page,
    pageSize,
    sort as (typeof ALLOWED_SORT_KEYS)[number],
    order,
    searchTerm,
  )

  const rows: AdminUserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: new Date(u.createdAt as any).toISOString(),
  }))

  /* ------------------------ Build initialParams -------------------------- */
  const initialParams = pickParams(params, ['size', 'sort', 'order', 'q'])

  /* ------------------------------ View ----------------------------------- */
  return (
    <PageCard
      icon={Users}
      title='All Users'
      description='Manage all user accounts across the platform.'
    >
      <div className='space-y-4 overflow-x-auto'>
        <AdminUsersTable
          rows={rows}
          sort={sort}
          order={order as 'asc' | 'desc'}
          basePath='/admin/users'
          initialParams={initialParams}
          searchQuery={searchTerm}
        />

        <TablePagination
          page={page}
          hasNext={hasNext}
          basePath='/admin/users'
          initialParams={initialParams}
          pageSize={pageSize}
        />
      </div>
    </PageCard>
  )
}
