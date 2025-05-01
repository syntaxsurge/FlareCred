import { redirect } from 'next/navigation'

import { KanbanSquare } from 'lucide-react'

import PipelinesTable from '@/components/dashboard/recruiter/pipelines-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { getUser } from '@/lib/db/queries/queries'
import { getRecruiterPipelinesPage } from '@/lib/db/queries/recruiter-pipelines'
import type { PipelineRow } from '@/lib/types/tables'
import {
  parsePagination,
  parseSort,
  getSearchTerm,
  pickParams,
  resolveSearchParams,
  type Query,
} from '@/lib/utils/query'

import NewPipelineDialog from './new-pipeline-dialog'

export const revalidate = 0

const ALLOWED_SORT_KEYS = ['name', 'createdAt'] as const

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function PipelinesPage({ searchParams }: { searchParams?: Promise<Query> }) {
  const params = await resolveSearchParams(searchParams)

  const user = await getUser()
  if (!user) redirect('/connect-wallet')
  if (user.role !== 'recruiter') redirect('/')

  const { page, pageSize } = parsePagination(params)
  const { sort, order } = parseSort(params, ALLOWED_SORT_KEYS, 'createdAt')
  const searchTerm = getSearchTerm(params)

  const { pipelines, hasNext } = await getRecruiterPipelinesPage(
    user.id,
    page,
    pageSize,
    sort as 'name' | 'createdAt',
    order,
    searchTerm,
  )

  const rows: PipelineRow[] = pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt,
  }))

  const initialParams = pickParams(params, ['size', 'sort', 'order', 'q'])

  return (
    <PageCard
      icon={KanbanSquare}
      title='Pipelines'
      description='Manage and track your hiring pipelines.'
      actions={<NewPipelineDialog />}
    >
      <PipelinesTable
        rows={rows}
        sort={sort}
        order={order}
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
    </PageCard>
  )
}
