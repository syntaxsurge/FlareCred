import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'
import { ListChecks } from 'lucide-react'

import RequireDidGate from '@/components/dashboard/require-did-gate'
import IssuerRequestsTable from '@/components/dashboard/issuer/requests-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { db } from '@/lib/db/drizzle'
import { getIssuerRequestsPage } from '@/lib/db/queries/issuer-requests'
import { getUser } from '@/lib/db/queries/queries'
import { issuers } from '@/lib/db/schema/issuer'
import type { IssuerRequestRow } from '@/lib/types/table-rows'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>
const BASE_PATH = '/issuer/requests'

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
  if (!user) redirect('/connect-wallet')

  /* Issuer ownership */
  const [issuer] = await db.select().from(issuers).where(eq(issuers.ownerUserId, user.id)).limit(1)
  if (!issuer) redirect('/issuer/onboard')

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(first(params, 'page') ?? '1'))
  const sizeRaw = Number(first(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10
  const sort = first(params, 'sort') ?? 'status'
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

  const rows: IssuerRequestRow[] = requests

  /* ------------------ Preserve existing query params --------------------- */
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
    <RequireDidGate createPath='/issuer/create-did'>
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
    </RequireDidGate>
  )
}