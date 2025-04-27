import { redirect } from 'next/navigation'

import { KanbanSquare } from 'lucide-react'

import PipelinesTable, { RowType } from '@/components/dashboard/recruiter/pipelines-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getUser } from '@/lib/db/queries/queries'
import { getRecruiterPipelinesPage } from '@/lib/db/queries/recruiter-pipelines'

import NewPipelineDialog from './new-pipeline-dialog'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>

function getParam(params: Query, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function PipelinesPage({
  searchParams,
}: {
  searchParams: Query | Promise<Query>
}) {
  const params = (await searchParams) as Query

  /* ----------------------------- Auth guard ------------------------------ */
  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(getParam(params, 'page') ?? '1'))

  const sizeRaw = Number(getParam(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = getParam(params, 'sort') ?? 'createdAt'
  const order = getParam(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (getParam(params, 'q') ?? '').trim()

  /* ---------------------------- Data fetch ------------------------------- */
  const { pipelines, hasNext } = await getRecruiterPipelinesPage(
    user.id,
    page,
    pageSize,
    sort as 'name' | 'createdAt',
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows: RowType[] = pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt.toISOString(),
  }))

  /* ------------------------ Build initialParams -------------------------- */
  const initialParams: Record<string, string> = {}
  const add = (k: string) => {
    const val = getParam(params, k)
    if (val) initialParams[k] = val
  }
  add('size')
  add('sort')
  add('order')
  if (searchTerm) initialParams['q'] = searchTerm

  /* ------------------------------- View ---------------------------------- */
  return (
    <PageCard
      icon={KanbanSquare}
      title='Pipelines'
      description='Manage and track your hiring pipelines.'
      actions={<NewPipelineDialog />}
    >
      <div className='space-y-4 overflow-x-auto'>
        <PipelinesTable
          rows={rows}
          sort={sort}
          order={order as 'asc' | 'desc'}
          basePath='/recruiter/pipelines'
          initialParams={initialParams}
          searchQuery={searchTerm}
        />

        <TablePagination
          page={page}
          hasNext={hasNext}
          basePath='/recruiter/pipelines'
          initialParams={initialParams}
          pageSize={pageSize}
        />
      </div>
    </PageCard>
  )
}
