'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Trash2, FolderKanban } from 'lucide-react'
import { toast } from 'sonner'

import { deletePipelineCandidateAction } from '@/app/(dashboard)/recruiter/pipelines/actions'
import { Button } from '@/components/ui/button'
import {
  DataTable,
  type Column,
  type BulkAction,
} from '@/components/ui/tables/data-table'
import {
  TableRowActions,
  type TableRowAction,
} from '@/components/ui/tables/row-actions'
import StatusBadge from '@/components/ui/status-badge'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  pipelineId: number
  pipelineName: string
  stage: string
}

interface PipelineEntriesTableProps {
  rows: RowType[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  searchQuery: string
}

/* -------------------------------------------------------------------------- */
/*                              Bulk actions                                  */
/* -------------------------------------------------------------------------- */

function buildBulkActions(
  router: ReturnType<typeof useRouter>,
): BulkAction<RowType>[] {
  const [isPending, startTransition] = React.useTransition()

  return [
    {
      label: 'Remove',
      icon: Trash2,
      variant: 'destructive',
      onClick: (selected) =>
        startTransition(async () => {
          const toastId = toast.loading('Removing…')
          await Promise.all(
            selected.map(async (r) => {
              const fd = new FormData()
              fd.append('pipelineCandidateId', String(r.id))
              return deletePipelineCandidateAction({}, fd)
            }),
          )
          toast.success('Selected entries removed.', { id: toastId })
          router.refresh()
        }),
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function PipelineEntriesTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: PipelineEntriesTableProps) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)
  const [isPending, startTransition] = React.useTransition()

  /* -------------------- Centralised navigation helpers -------------------- */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
    paramKeys: {
      sort: 'pipeSort',
      order: 'pipeOrder',
      search: 'pipeQ',
      page: 'pipePage',
    },
  })

  /* -------------------------- Row-action builder -------------------------- */
  const makeActions = React.useCallback(
    (row: RowType): TableRowAction<RowType>[] => [
      {
        label: 'View Pipeline',
        icon: FolderKanban,
        href: `/recruiter/pipelines/${row.pipelineId}`,
      },
      {
        label: 'Remove',
        icon: Trash2,
        variant: 'destructive',
        onClick: () =>
          startTransition(async () => {
            const fd = new FormData()
            fd.append('pipelineCandidateId', String(row.id))
            const res = await deletePipelineCandidateAction({}, fd)
            res?.error
              ? toast.error(res.error)
              : toast.success(res?.success ?? 'Removed from pipeline.')
            router.refresh()
          }),
        disabled: () => isPending,
      },
    ],
    [router, startTransition, isPending],
  )

  /* ----------------------------- Columns ---------------------------------- */
  const columns = React.useMemo<Column<RowType>[]>(() => {
    return [
      {
        key: 'pipelineName',
        header: sortableHeader('Pipeline', 'pipelineName'),
        sortable: false,
        render: (v) => <span className='font-medium'>{v as string}</span>,
      },
      {
        key: 'stage',
        header: sortableHeader('Stage', 'stage'),
        sortable: false,
        render: (v) => <StatusBadge status={v as string} />,
      },
      {
        key: 'id', // actions column
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => (
          <TableRowActions row={row} actions={makeActions(row)} />
        ),
      },
    ]
  }, [sortableHeader, makeActions])

  /* ------------------------------- View ---------------------------------- */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='pipelineName'
      filterValue={search}
      onFilterChange={handleSearchChange}
      bulkActions={bulkActions}
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}