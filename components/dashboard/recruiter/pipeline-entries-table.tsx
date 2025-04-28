'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { MoreHorizontal, Trash2, FolderKanban, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { deletePipelineCandidateAction } from '@/app/(dashboard)/recruiter/pipelines/actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import StatusBadge from '@/components/ui/status-badge'
import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
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
/*                               Row actions                                  */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: RowType }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  function remove() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('pipelineCandidateId', String(row.id))
      const res = await deletePipelineCandidateAction({}, fd)
      res?.error ? toast.error(res.error) : toast.success(res?.success ?? 'Removed from pipeline.')
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-8 w-8' disabled={isPending}>
          {isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <MoreHorizontal className='h-4 w-4' />
          )}
          <span className='sr-only'>Open row actions</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='rounded-md p-1 shadow-lg'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/recruiter/pipelines/${row.pipelineId}`} className='cursor-pointer'>
            <FolderKanban className='mr-2 h-4 w-4' />
            View Pipeline
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={remove}
          disabled={isPending}
          className='cursor-pointer font-semibold text-rose-600 hover:bg-rose-500/10 focus:bg-rose-500/10 dark:text-rose-400'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Bulk actions                                  */
/* -------------------------------------------------------------------------- */

function buildBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
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
        render: (_v, row) => <RowActions row={row} />,
      },
    ]
  }, [sortableHeader])

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