'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Trash2, FileText, Clipboard } from 'lucide-react'
import { toast } from 'sonner'

import { deleteCredentialAction } from '@/app/(dashboard)/admin/credentials/actions'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  DataTable,
  type Column,
  type BulkAction,
} from '@/components/ui/tables/data-table'
import {
  TableRowActions,
  type TableRowAction,
} from '@/components/ui/tables/row-actions'
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
/*                               Row actions                                  */
/* -------------------------------------------------------------------------- */

function useRowActions(
  router: ReturnType<typeof useRouter>,
): (row: CandidateCredentialRow) => TableRowAction<CandidateCredentialRow>[] {
  return React.useCallback(
    (row: CandidateCredentialRow) => {
      const actions: TableRowAction<CandidateCredentialRow>[] = []

      if (row.fileUrl) {
        actions.push({
          label: 'View file',
          icon: FileText,
          href: row.fileUrl,
        })
      }

      if (row.vcJson) {
        actions.push({
          label: 'Copy VC JSON',
          icon: Clipboard,
          onClick: () =>
            navigator.clipboard
              .writeText(row.vcJson!)
              .then(() => toast.success('VC JSON copied to clipboard'))
              .catch(() => toast.error('Copy failed')),
        })
      }

      actions.push({
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
      })

      return actions
    },
    [router],
  )
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
  const makeActions = useRowActions(router)

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