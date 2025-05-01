import { redirect } from 'next/navigation'

import { Mail } from 'lucide-react'

import InvitationsTable from '@/components/dashboard/invitations-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getInvitationsPage } from '@/lib/db/queries/invitations'
import { getUser } from '@/lib/db/queries/queries'
import type { InvitationRow } from '@/lib/types/tables'
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
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams?: Promise<Query>
}) {
  const params = await resolveSearchParams(searchParams)

  const user = await getUser()
  if (!user) redirect('/connect-wallet')

  /* --------------------------- Query params ------------------------------ */
  const { page, pageSize } = parsePagination(params)
  const { sort, order } = parseSort(
    params,
    ['team', 'role', 'inviter', 'status', 'invitedAt'] as const,
    'invitedAt',
  )
  const searchTerm = getSearchTerm(params)

  /* -------------------------- Data fetching ------------------------------ */
  const { invitations, hasNext } = await getInvitationsPage(
    user.email,
    page,
    pageSize,
    sort as 'team' | 'role' | 'inviter' | 'status' | 'invitedAt',
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: InvitationRow[] = invitations.map((inv) => ({
    ...inv,
    invitedAt: new Date(inv.invitedAt),
  }))

  /* ------------------------ Build initialParams -------------------------- */
  const initialParams = pickParams(params, ['size', 'sort', 'order', 'q'])

  /* ------------------------------ View ----------------------------------- */
  return (
    <PageCard
      icon={Mail}
      title='Team Invitations'
      description='Review and manage the invitations sent to your email.'
    >
      <div className='space-y-4 overflow-x-auto'>
        <InvitationsTable
          rows={rows}
          sort={sort}
          order={order as 'asc' | 'desc'}
          basePath='/invitations'
          initialParams={initialParams}
          searchQuery={searchTerm}
        />

        <TablePagination
          page={page}
          hasNext={hasNext}
          basePath='/invitations'
          initialParams={initialParams}
          pageSize={pageSize}
        />
      </div>
    </PageCard>
  )
}