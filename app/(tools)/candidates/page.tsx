import { asc, desc, ilike, sql } from 'drizzle-orm'

import CandidatesTable, { type RowType } from '@/components/candidate-directory/candidates-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { db } from '@/lib/db/drizzle'
import {
  candidates as candT,
  candidateCredentials as credT,
  users as usersT,
} from '@/lib/db/schema'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                               P A R A M S                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>
const BASE_PATH = '/candidates'

function first(p: Query, k: string) {
  return Array.isArray(p[k]) ? p[k]?.[0] : p[k]
}

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default async function CandidateDirectoryPage({
  searchParams,
}: {
  searchParams: Query | Promise<Query>
}) {
  /* ----------------------------- Read params ---------------------------- */
  const params = (await searchParams) as Query
  const page = Math.max(1, Number(first(params, 'page') ?? '1'))
  const sizeRaw = Number(first(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10
  const sort = first(params, 'sort') ?? 'name'
  const order = first(params, 'order') === 'desc' ? 'desc' : 'asc'
  const searchTerm = (first(params, 'q') ?? '').trim().toLowerCase()

  /* ----------------------------- Sort map ------------------------------- */
  const sortMap = {
    name: usersT.name,
    email: usersT.email,
    verified: sql<number>`verified_count`,
  } as const
  const orderExpr =
    order === 'asc'
      ? asc(sortMap[sort as keyof typeof sortMap])
      : desc(sortMap[sort as keyof typeof sortMap])

  /* ----------------------------- Base where ----------------------------- */
  let whereExpr: any = sql`TRUE`
  if (searchTerm.length > 0) {
    whereExpr = ilike(usersT.name, `%${searchTerm}%`)
    whereExpr = sql`${whereExpr} OR ${ilike(usersT.email, `%${searchTerm}%`)}`
  }

  /* ----------------------------- Fetch rows ----------------------------- */
  const offset = (page - 1) * pageSize
  const rowsRaw = await db
    .select({
      id: candT.id,
      name: usersT.name,
      email: usersT.email,
      verified: sql<number>`COUNT(CASE WHEN ${credT.status} = 'verified' THEN 1 END)`.as(
        'verified_count',
      ),
    })
    .from(candT)
    .innerJoin(usersT, sql`${candT.userId} = ${usersT.id}`)
    .leftJoin(credT, sql`${credT.candidateId} = ${candT.id}`)
    .where(whereExpr)
    .groupBy(candT.id, usersT.name, usersT.email)
    .orderBy(orderExpr)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rowsRaw.length > pageSize
  if (hasNext) rowsRaw.pop()

  const rows: RowType[] = rowsRaw.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    verified: Number(r.verified),
  }))

  /* ---------------------------- initialParams --------------------------- */
  const initialParams: Record<string, string> = {}
  const keep = (k: string) => {
    const v = first(params, k)
    if (v) initialParams[k] = v
  }
  keep('size')
  keep('sort')
  keep('order')
  if (searchTerm) initialParams['q'] = searchTerm

  /* ------------------------------- View --------------------------------- */
  return (
    <section className='mx-auto max-w-7xl space-y-10'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-extrabold tracking-tight'>Candidate Directory</h1>
        <p className='text-muted-foreground max-w-2xl text-sm'>
          Browse public candidate profiles. Use the search box, sortable headers and pagination
          controls to find talent quickly.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Candidates</CardTitle>
        </CardHeader>

        <CardContent className='overflow-x-auto'>
          <CandidatesTable
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
        </CardContent>
      </Card>
    </section>
  )
}
