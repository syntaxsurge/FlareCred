'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { deleteCredentialAction } from '@/app/(dashboard)/admin/credentials/actions'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
import { RowActions, type TableRowAction } from '@/components/ui/tables/row-actions'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import { getProofTx } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  title: string
  candidate: string
  issuer: string | null
  status: string
  proofType: string | null
  vcJson?: string | null
}

interface CredentialsTableProps {
  rows: RowType[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  /** Current search term (from URL). */
  searchQuery: string
}

/* -------------------------------------------------------------------------- */
/*                             Bulk-selection                                 */
/* -------------------------------------------------------------------------- */

function buildBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
  const [isPending, startTransition] = React.useTransition()

  return [
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (selected) =>
        startTransition(async () => {
          await Promise.all(
            selected.map(async (row) => {
              const fd = new FormData()
              fd.append('credentialId', row.id.toString())
              return deleteCredentialAction({}, fd)
            }),
          )
          toast.success('Selected credentials deleted.')
          router.refresh()
        }),
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function AdminCredentialsTable({
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

  /* ----------------------- Re-usable row actions -------------------------- */
  const makeActions = React.useCallback(
    (row: RowType): TableRowAction<RowType>[] => [
      {
        label: 'Delete',
        icon: Trash2,
        variant: 'destructive',
        onClick: async () => {
          const fd = new FormData()
          fd.append('credentialId', row.id.toString())
          const res = await deleteCredentialAction({}, fd)
          res?.error
            ? toast.error(res.error)
            : toast.success(res?.success ?? 'Credential deleted.')
          router.refresh()
        },
      },
    ],
    [router],
  )

  /* ------------------------------ Columns --------------------------------- */
  const columns = React.useMemo<Column<RowType>[]>(() => {
    return [
      {
        key: 'title',
        header: sortableHeader('Title', 'title'),
        sortable: false,
        render: (v, row) => (
          <span className='flex items-center gap-2 font-medium'>
            {String(v)}
            {row.proofType && (
              <span className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] uppercase'>
                {row.proofType}
              </span>
            )}
          </span>
        ),
      },
      {
        key: 'candidate',
        header: sortableHeader('Candidate', 'candidate'),
        sortable: false,
        render: (v) => String(v),
      },
      {
        key: 'issuer',
        header: sortableHeader('Issuer', 'issuer'),
        sortable: false,
        render: (v) => (v ? String(v) : '—'),
      },
      {
        key: 'status',
        header: sortableHeader('Status', 'status'),
        sortable: false,
        render: (v) => <StatusBadge status={String(v)} />,
      },
      {
        key: 'proof',
        header: 'Proof',
        sortable: false,
        render: (_v, row) => {
          const proofTx = getProofTx((row as any).vcJson)
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
        render: (_v, row) => <RowActions row={row} actions={makeActions(row)} />,
      },
    ]
  }, [sortableHeader, makeActions])

  /* ------------------------------ Render ---------------------------------- */
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