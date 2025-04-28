'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { formatDistanceToNow } from 'date-fns'
import { Trash2, MoreHorizontal, Loader2, FolderKanban } from 'lucide-react'
import { toast } from 'sonner'

import { deletePipelineAction } from '@/app/(dashboard)/recruiter/pipelines/actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
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
/*                             Row-level actions                              */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: PipelineRow }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  function destroy() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('pipelineId', row.id.toString())
      const res = await deletePipelineAction({}, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(res?.success ?? 'Pipeline deleted.')
        router.refresh()
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0' disabled={isPending}>
          {isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <MoreHorizontal className='h-4 w-4' />
          )}
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='rounded-md p-1 shadow-lg'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/recruiter/pipelines/${row.id}`} className='cursor-pointer'>
            <FolderKanban className='mr-2 h-4 w-4' />
            Open Board
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={destroy}
          disabled={isPending}
          className='cursor-pointer font-semibold text-rose-600 hover:bg-rose-500/10 focus:bg-rose-500/10 dark:text-rose-400'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
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
        render: (_v, row) => <RowActions row={row} />,
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