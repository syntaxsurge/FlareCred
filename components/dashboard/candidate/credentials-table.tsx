'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Trash2, FileText, Clipboard } from 'lucide-react'
import { toast } from 'sonner'

import { deleteCredentialAction } from '@/app/(dashboard)/admin/credentials/actions'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { TableRowActions, type TableRowAction } from '@/components/ui/tables/row-actions'
import { useBulkActions } from '@/lib/hooks/use-bulk-actions'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import type { TableProps, CandidateCredentialRow } from '@/lib/types/tables'
import { getProofTx } from '@/lib/utils'
import { txUrl } from '@/lib/utils/explorer'
import { copyToClipboard } from '@/lib/utils'

export default function CandidateCredentialsTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: TableProps<CandidateCredentialRow>) {
  const router = useRouter()

  /* ------------------------ Bulk-selection actions ----------------------- */
  const bulkActions = useBulkActions<CandidateCredentialRow>([
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      handler: async (selected) => {
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

  /* ----------------------------- Row actions ------------------------------ */
  const makeActions = React.useCallback(
    (row: CandidateCredentialRow): TableRowAction<CandidateCredentialRow>[] => {
      const actions: TableRowAction<CandidateCredentialRow>[] = []

      /* View-file link ----------------------------------------------------- */
      if (row.fileUrl) {
        actions.push({
          label: 'View file',
          icon: FileText,
          href: row.fileUrl,
        })
      }

      /* Copy VC JSON ------------------------------------------------------- */
      if (row.vcJson) {
        actions.push({
          label: 'Copy VC JSON',
          icon: Clipboard,
          onClick: () => copyToClipboard(row.vcJson!),
        })
      }

      /* Delete ------------------------------------------------------------- */
      actions.push({
        label: 'Delete',
        icon: Trash2,
        variant: 'destructive',
        onClick: async (_row) => {
          const fd = new FormData()
          fd.append('credentialId', row.id.toString())
          const res = await deleteCredentialAction({}, fd)
          res?.error ? toast.error(res.error) : toast.success(res?.success ?? 'Credential deleted.')
          router.refresh()
        },
      })

      return actions
    },
    [router],
  )

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
        key: 'vcJson',
        header: 'Proof',
        sortable: false,
        render: (_v, row) => {
          const proofTx = getProofTx(row.vcJson)
          return proofTx && proofTx !== '0x0' ? (
            <a
              href={txUrl(proofTx)}
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