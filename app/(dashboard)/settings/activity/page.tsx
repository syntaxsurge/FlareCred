import { redirect } from 'next/navigation'

import { Activity as ActivityIcon } from 'lucide-react'

import ActivityLogsTable from '@/components/dashboard/settings/activity-logs-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getActivityLogsPage } from '@/lib/db/queries/activity'
import { getUser } from '@/lib/db/queries/queries'
import type { ActivityLogRow } from '@/lib/types/tables'
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

const ALLOWED_SORT_KEYS = ['timestamp'] as const

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function ActivityPage({
  searchParams,
}: {
  searchParams?: Promise<Query>
}) {
  const params = await resolveSearchParams(searchParams)

  const user = await getUser()
  if (!user) redirect('/connect-wallet')

  /* ---------------------- Pagination, sort, search ----------------------- */
  const { page, pageSize } = parsePagination(params)
  const { sort, order } = parseSort(params, ALLOWED_SORT_KEYS, 'timestamp')
  const searchTerm = getSearchTerm(params)

  /* ---------------------------- Data fetch ------------------------------- */
  const { logs, hasNext } = await getActivityLogsPage(
    user.id,
    page,
    pageSize,
    sort,
    order,
    searchTerm,
  )

  const rows: ActivityLogRow[] = logs

  /* ------------------------ Build initialParams -------------------------- */
  const initialParams = pickParams(params, ['size', 'sort', 'order', 'q'])

  /* ------------------------------ View ----------------------------------- */
  return (
    <PageCard
      icon={ActivityIcon}
      title='Activity Log'
      description='Review your recent account activity and wallet connections.'
    >
      <div className='space-y-4 overflow-x-auto'>
        <ActivityLogsTable
          rows={rows}
          sort={sort}
          order={order as 'asc' | 'desc'}
          basePath='/settings/activity'
          initialParams={initialParams}
          searchQuery={searchTerm}
        />

        <TablePagination
          page={page}
          hasNext={hasNext}
          basePath='/settings/activity'
          initialParams={initialParams}
          pageSize={pageSize}
        />
      </div>
    </PageCard>
  )
}