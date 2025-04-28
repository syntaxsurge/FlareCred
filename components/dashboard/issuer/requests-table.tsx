'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import {
  FileSignature,
  XCircle,
  type LucideProps,
} from 'lucide-react'
import { toast } from 'sonner'

import { rejectCredentialAction } from '@/app/(dashboard)/issuer/credentials/actions'
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
import { CredentialStatus } from '@/lib/db/schema/candidate'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import { getProofTx } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  title: string
  type: string
  candidate: string
  status: CredentialStatus
  vcJson?: string | null
}

interface Props {
  rows: RowType[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  /** Current search term (from URL). */
  searchQuery: string
}

/* -------------------------------------------------------------------------- */
/*                                 Icons                                      */
/* -------------------------------------------------------------------------- */

const RejectIcon = (props: LucideProps) => (
  <XCircle {...props} className='mr-2 h-4 w-4 text-rose-600 dark:text-rose-400' />
)

/* -------------------------------------------------------------------------- */
/*                         Bulk-selection actions                             */
/* -------------------------------------------------------------------------- */

function buildBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
  const [isPending, startTransition] = React.useTransition()

  async function bulkReject(rows: RowType[]) {
    const toastId = toast.loading('Rejecting…')
    const results = await Promise.all(
      rows.map(async (cred) => {
        const fd = new FormData()
        fd.append('credentialId', cred.id.toString())
        return rejectCredentialAction({}, fd)
      }),
    )
    const errors = results.filter((r) => r?.error).map((r) => r!.error)
    errors.length
      ? toast.error(errors.join('\n'), { id: toastId })
      : toast.success('Credentials rejected.', { id: toastId })
    router.refresh()
  }

  return [
    {
      label: 'Reject',
      icon: RejectIcon as any,
      variant: 'destructive',
      onClick: (selected) => startTransition(() => bulkReject(selected)),
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                         Row-level action builder                           */
/* -------------------------------------------------------------------------- */

function useRowActions(): (row: RowType) => TableRowAction<RowType>[] {
  return React.useCallback(
    (row: RowType) => [
      {
        label: 'Review & Sign',
        icon: FileSignature,
        href: `/issuer/credentials/${row.id}`,
      },
    ],
    [],
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function IssuerRequestsTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: Props) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)
  const makeActions = useRowActions()

  /* -------------------- Centralised navigation helpers -------------------- */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* ------------------------ Column definitions --------------------------- */
  const columns = React.useMemo<Column<RowType>[]>(() => {
    return [
      {
        key: 'title',
        header: sortableHeader('Title', 'title'),
        sortable: false,
        render: (v) => <span className='font-medium'>{v as string}</span>,
      },
      {
        key: 'type',
        header: sortableHeader('Type', 'type'),
        sortable: false,
        className: 'capitalize',
        render: (v) => v as string,
      },
      {
        key: 'candidate',
        header: sortableHeader('Candidate', 'candidate'),
        sortable: false,
        render: (v) => v as string,
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
        render: (_v, row) => <TableRowActions row={row} actions={makeActions(row)} />,
      },
    ]
  }, [sortableHeader, makeActions])

  /* ----------------------------- Render ---------------------------------- */
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