'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { deleteCredentialAction } from '@/app/(dashboard)/admin/credentials/actions'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { TableRowActions, type TableRowAction } from '@/components/ui/tables/row-actions'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import { useBulkActions } from '@/lib/hooks/use-bulk-actions'
import { getProofTx } from '@/lib/utils'
import type { AdminCredentialRow } from '@/lib/types/table-rows'
import type { TableProps } from '@/lib/types/table-props'


export default function AdminCredentialsTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: TableProps<AdminCredentialRow>) {
  const router = useRouter()

  /* ------------------------ Bulk-selection actions ----------------------- */
  const bulkActions = useBulkActions<AdminCredentialRow>([
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      handler: async (selected) => {
        const toastId = toast.loading('Deleting credentials…')
        await Promise.all(
          selected.map(async (row) => {
            const fd = new FormData()
            fd.append('credentialId', row.id.toString())
            return deleteCredentialAction({}, fd)
          }),
        )
        toast.success('Selected credentials deleted.', { id: toastId })
        router.refresh()
      },
    },
  ])

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
    (row: AdminCredentialRow): TableRowAction<AdminCredentialRow>[] => [
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

  /* ----------------------------- Columns ---------------------------------- */
  const columns = React.useMemo<Column<AdminCredentialRow>[]>(() => {
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
        key: 'vcJson',
        header: 'Proof',
        sortable: false,
        render: (v) => {
          const proofTx = getProofTx(v as string | null | undefined)
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
        render: (_v, row) => <TableRowActions row={row} actions={makeActions(row)} />,
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