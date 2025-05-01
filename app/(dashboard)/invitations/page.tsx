import { redirect } from 'next/navigation'

import { Mail } from 'lucide-react'

import InvitationsTable from '@/components/dashboard/invitations-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getInvitationsPage } from '@/lib/db/queries/invitations'
import { getUser } from '@/lib/db/queries/queries'
import type { InvitationRow } from '@/lib/types/tables'
import { getParam, type Query } from '@/lib/utils/query'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<Query> | Query
}) {
  const params = (await searchParams) as Query

  const user = await getUser()
  if (!user) redirect('/connect-wallet')

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(getParam(params, 'page') ?? '1'))
  const sizeRaw = Number(getParam(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10
  const sort = getParam(params, 'sort') ?? 'invitedAt'
  const order = getParam(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (getParam(params, 'q') ?? '').trim()

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
  const initialParams: Record<string, string> = {}
  const copy = (k: string) => {
    const v = getParam(params, k)
    if (v) initialParams[k] = v
  }
  copy('size')
  copy('sort')
  copy('order')
  if (searchTerm) initialParams['q'] = searchTerm

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