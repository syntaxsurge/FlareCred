import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'
import { ListChecks } from 'lucide-react'

import IssuerRequestsTable, { type RowType } from '@/components/dashboard/issuer/requests-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { db } from '@/lib/db/drizzle'
import { getIssuerRequestsPage } from '@/lib/db/queries/issuer-requests'
import { getUser } from '@/lib/db/queries/queries'
import { issuers } from '@/lib/db/schema/issuer'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>
const BASE_PATH = '/issuer/requests'

/** Safely return first param value. */
function first(params: Query, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Query> | Query
}) {
  const params = (await searchParams) as Query

  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* --------------------- Validate issuer ownership ----------------------- */
  const [issuer] = await db.select().from(issuers).where(eq(issuers.ownerUserId, user.id)).limit(1)
  if (!issuer) redirect('/issuer/onboard')

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(first(params, 'page') ?? '1'))

  const sizeRaw = Number(first(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = first(params, 'sort') ?? 'status'
  // Default to ascending so that "pending” (alphabetically first) appears on top
  const order = first(params, 'order') === 'desc' ? 'desc' : 'asc'
  const searchTerm = (first(params, 'q') ?? '').trim()

  /* ------------------------------ Data ----------------------------------- */
  const { requests, hasNext } = await getIssuerRequestsPage(
    issuer.id,
    page,
    pageSize,
    sort as 'title' | 'type' | 'status' | 'candidate',
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: RowType[] = requests

  /* Build initialParams for pagination & headers */
  const initialParams: Record<string, string> = {}
  const add = (k: string) => {
    const val = first(params, k)
    if (val) initialParams[k] = val
  }
  add('size')
  add('sort')
  add('order')
  if (searchTerm) initialParams['q'] = searchTerm

  /* ------------------------------ View ----------------------------------- */
  return (
    <PageCard
      icon={ListChecks}
      title='Verification Requests'
      description='Review and manage credential verification requests submitted by candidates.'
    >
      <div className='space-y-4 overflow-x-auto'>
        <IssuerRequestsTable
          rows={rows}
          sort={sort}
          order={order as 'asc' | 'desc'}
          basePath={BASE_PATH}
          initialParams={initialParams}
          searchQuery={searchTerm}
        />

        <TablePagination
          page={page}
          hasNext={hasNext}
          basePath={BASE_PATH}
          initialParams={initialParams}
          pageSize={pageSize}
        />
      </div>
    </PageCard>
  )
}
