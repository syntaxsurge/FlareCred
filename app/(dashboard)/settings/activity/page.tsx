import { redirect } from 'next/navigation'

import { Activity as ActivityIcon } from 'lucide-react'

import ActivityLogsTable from '@/components/dashboard/settings/activity-logs-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getActivityLogsPage } from '@/lib/db/queries/activity'
import { getUser } from '@/lib/db/queries/queries'
import type { ActivityLogRow } from '@/lib/types/tables'
import { getParam, resolveSearchParams, type Query } from '@/lib/utils/query'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function ActivityPage({
  searchParams,
}: {
  searchParams?: Promise<Query>
}) {
  /* Normalise Next.js `searchParams` (object or Promise) */
  const params = await resolveSearchParams(searchParams)

  const user = await getUser()
  if (!user) redirect('/connect-wallet')

  /* ---------------------- Query parameters ---------------------- */
  const page = Math.max(1, Number(getParam(params, 'page') ?? '1'))
  const sizeRaw = Number(getParam(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  /* Only timestamp sorting is supported */
  const sort = 'timestamp'
  const order = getParam(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (getParam(params, 'q') ?? '').trim()

  /* ------------------------- Data fetch ------------------------- */
  const { logs, hasNext } = await getActivityLogsPage(
    user.id,
    page,
    pageSize,
    sort,
    order,
    searchTerm,
  )

  const rows: ActivityLogRow[] = logs

  /* -------------------- Preserve query state -------------------- */
  const initialParams: Record<string, string> = {}
  const add = (k: string) => {
    const val = getParam(params, k)
    if (val) initialParams[k] = val
  }
  add('size')
  add('order')
  if (searchTerm) initialParams.q = searchTerm

  /* ---------------------------- View ---------------------------- */
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