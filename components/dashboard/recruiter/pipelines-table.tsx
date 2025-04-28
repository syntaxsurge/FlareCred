'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, FolderKanban } from 'lucide-react'
import { toast } from 'sonner'

import { deletePipelineAction } from '@/app/(dashboard)/recruiter/pipelines/actions'
import {
  DataTable,
  type Column,
  type BulkAction,
} from '@/components/ui/tables/data-table'
import {
  TableRowActions,
  type TableRowAction,
} from '@/components/ui/tables/row-actions'
import type { PipelineRow } from '@/lib/types/table-rows'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface PipelinesTableProps {
  rows: PipelineRow[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  searchQuery: string
}

/* -------------------------------------------------------------------------- */
/*                            Bulk delete helper                              */
/* -------------------------------------------------------------------------- */

function makeBulkActions(router: ReturnType<typeof useRouter>): BulkAction<PipelineRow>[] {
  const [isPending, startTransition] = React.useTransition()

  return [
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (selected) =>
        startTransition(async () => {
          const toastId = toast.loading('Deleting pipelines…')
          await Promise.all(
            selected.map(async (p) => {
              const fd = new FormData()
              fd.append('pipelineId', p.id.toString())
              return deletePipelineAction({}, fd)
            }),
          )
          toast.success('Selected pipelines deleted.', { id: toastId })
          router.refresh()
        }),
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                           Row-level actions UI                             */
/* -------------------------------------------------------------------------- */

function PipelineRowActions({ row }: { row: PipelineRow }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const actions = React.useMemo<TableRowAction<PipelineRow>[]>(
    () => [
      {
        label: 'Open Board',
        icon: FolderKanban,
        href: `/recruiter/pipelines/${row.id}`,
      },
      {
        label: 'Delete',
        icon: Trash2,
        variant: 'destructive',
        onClick: () =>
          startTransition(async () => {
            const fd = new FormData()
            fd.append('pipelineId', row.id.toString())
            const res = await deletePipelineAction({}, fd)
            res?.error
              ? toast.error(res.error)
              : toast.success(res?.success ?? 'Pipeline deleted.')
            router.refresh()
          }),
        disabled: () => isPending,
      },
    ],
    [isPending, row.id, router],
  )

  return <TableRowActions row={row} actions={actions} />
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function PipelinesTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: PipelinesTableProps) {
  const router = useRouter()
  const bulkActions = makeBulkActions(router)

  /* -------------------- Centralised navigation helpers -------------------- */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* ----------------------------- Columns ---------------------------------- */
  const columns = React.useMemo<Column<PipelineRow>[]>(() => {
    return [
      {
        key: 'name',
        header: sortableHeader('Name', 'name'),
        sortable: false,
        render: (v) => <span className='font-medium'>{v as string}</span>,
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
        render: (v) => <span className='line-clamp-2 max-w-[480px]'>{(v as string) || '—'}</span>,
      },
      {
        key: 'createdAt',
        header: sortableHeader('Created', 'createdAt'),
        sortable: false,
        render: (v) =>
          formatDistanceToNow(new Date(v as string), { addSuffix: true }),
      },
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => <PipelineRowActions row={row} />,
      },
    ]
  }, [sortableHeader])

  /* ------------------------------- View ---------------------------------- */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='name'
      filterValue={search}
      onFilterChange={handleSearchChange}
      bulkActions={bulkActions}
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}