'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { ArrowUpDown, MoreHorizontal, Trash2, FolderKanban, Loader2 } from 'lucide-react'
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
import { DataTable, type BulkAction, type Column } from '@/components/ui/tables/data-table'

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
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

function buildLink(basePath: string, init: Record<string, string>, overrides: Record<string, any>) {
  const sp = new URLSearchParams(init)
  Object.entries(overrides).forEach(([k, v]) => sp.set(k, String(v)))
  Array.from(sp.entries()).forEach(([k, v]) => !v && sp.delete(k))
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

/* ------------------------------- Row actions ------------------------------ */

function RowActions({ row }: { row: RowType }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  function remove() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('pipelineCandidateId', String(row.id))
      const res = await deletePipelineCandidateAction({}, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(res?.success ?? 'Removed from pipeline.')
        router.refresh()
      }
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

/* ------------------------------ Bulk remove ------------------------------ */

function makeBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
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
  const bulkActions = makeBulkActions(router)

  /* --------------------------- Server search ---------------------------- */
  const [search, setSearch] = React.useState(searchQuery)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const href = buildLink(basePath, initialParams, { pipeQ: value, pipePage: 1 })
      router.push(href, { scroll: false })
    }, 400)
  }

  /* ----------------------------- Sorting -------------------------------- */
  function sortableHeader(label: string, key: string) {
    const nextOrder = sort === key && order === 'asc' ? 'desc' : 'asc'
    const href = buildLink(basePath, initialParams, {
      pipeSort: key,
      pipeOrder: nextOrder,
      pipePage: 1,
      pipeQ: search,
    })
    return (
      <Link href={href} scroll={false} className='flex items-center gap-1'>
        {label} <ArrowUpDown className='h-4 w-4' />
      </Link>
    )
  }

  /* ----------------------------- Columns -------------------------------- */
  const columns = React.useMemo<Column<RowType>[]>(
    () => [
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
    ],
    [sort, order, basePath, initialParams, search],
  )

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
