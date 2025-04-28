'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { MoreHorizontal, Trash2, FileText, Clipboard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { deleteCredentialAction } from '@/app/(dashboard)/admin/credentials/actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import type { CandidateCredentialRow } from '@/lib/types/table-rows'
import { getProofTx } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                 PROPS                                      */
/* -------------------------------------------------------------------------- */

interface CredentialsTableProps {
  rows: CandidateCredentialRow[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  searchQuery: string
}

/* -------------------------------------------------------------------------- */
/*                               Row actions                                  */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: CandidateCredentialRow }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  async function destroy() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('credentialId', row.id.toString())
      const res = await deleteCredentialAction({}, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(res?.success ?? 'Credential deleted.')
        router.refresh()
      }
    })
  }

  function copyVc() {
    if (!row.vcJson) return
    navigator.clipboard.writeText(row.vcJson).then(
      () => toast.success('VC JSON copied to clipboard'),
      () => toast.error('Copy failed'),
    )
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

        {row.fileUrl && (
          <DropdownMenuItem asChild>
            <a
              href={row.fileUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='flex cursor-pointer items-center'
            >
              <FileText className='mr-2 h-4 w-4 text-sky-600 dark:text-sky-400' />
              View file
            </a>
          </DropdownMenuItem>
        )}

        {row.vcJson && (
          <DropdownMenuItem onClick={copyVc} className='cursor-pointer'>
            <Clipboard className='mr-2 h-4 w-4' />
            Copy VC JSON
          </DropdownMenuItem>
        )}

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
/*                               Bulk actions                                 */
/* -------------------------------------------------------------------------- */

function buildBulkActions(
  router: ReturnType<typeof useRouter>,
): BulkAction<CandidateCredentialRow>[] {
  const [isPending, startTransition] = React.useTransition()

  return [
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (selected) =>
        startTransition(async () => {
          const toastId = toast.loading('Deleting credentials…')
          await Promise.all(
            selected.map(async (cred) => {
              const fd = new FormData()
              fd.append('credentialId', cred.id.toString())
              return deleteCredentialAction({}, fd)
            }),
          )
          toast.success('Selected credentials deleted.', { id: toastId })
          router.refresh()
        }),
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function CandidateCredentialsTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: CredentialsTableProps) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)

  /* -------------------- Centralised navigation helpers -------------------- */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* ----------------------------- Columns ---------------------------------- */
  const columns = React.useMemo<Column<CandidateCredentialRow>[]>(() => {
    return [
      {
        key: 'title',
        header: sortableHeader('Title', 'title'),
        sortable: false,
        render: (v) => <span className='font-medium'>{v as string}</span>,
      },
      {
        key: 'category',
        header: sortableHeader('Category', 'category'),
        sortable: false,
        className: 'capitalize',
        render: (v) => v as string,
      },
      {
        key: 'type',
        header: sortableHeader('Type', 'type'),
        sortable: false,
        className: 'capitalize',
        render: (v) => v as string,
      },
      {
        key: 'issuer',
        header: sortableHeader('Issuer', 'issuer'),
        sortable: false,
        render: (v) => (v as string | null) || '—',
      },
      {
        key: 'status',
        header: sortableHeader('Status', 'status'),
        sortable: false,
        render: (v) => <StatusBadge status={String(v)} />,
      },
      {
        /* Use existing vcJson key to satisfy Column typing while presenting Proof UI */
        key: 'vcJson',
        header: 'Proof',
        sortable: false,
        render: (_v, row) => {
          const proofTx = getProofTx(row.vcJson)
          return proofTx ? (
            <a
              href={`https://flarescan.com/tx/${proofTx}`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary underline'
            >
              Verify on Flare
            </a>
          ) : (
            '—'
          )
        },
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
      filterKey='title'
      filterValue={search}
      onFilterChange={handleSearchChange}
      bulkActions={bulkActions}
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}