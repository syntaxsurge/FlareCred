'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { formatDistanceToNow } from 'date-fns'
import {
  CheckCircle2,
  XCircle,
  Trash2,
  type LucideProps,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  acceptInvitationAction,
  declineInvitationAction,
  deleteInvitationAction,
} from '@/app/(dashboard)/invitations/actions'
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
import type { InvitationRow } from '@/lib/types/table-rows'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'

/* -------------------------------------------------------------------------- */
/*                                 PROPS                                      */
/* -------------------------------------------------------------------------- */
interface InvitationsTableProps {
  rows: InvitationRow[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  searchQuery: string
}

/* -------------------------------------------------------------------------- */
/*                         COLOURED ICON COMPONENTS                           */
/* -------------------------------------------------------------------------- */

const AcceptIcon = (props: LucideProps) => (
  <CheckCircle2 {...props} className='mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400' />
)
const DeclineIcon = (props: LucideProps) => (
  <XCircle {...props} className='mr-2 h-4 w-4 text-amber-600 dark:text-amber-400' />
)

/* -------------------------------------------------------------------------- */
/*                             Bulk actions                                   */
/* -------------------------------------------------------------------------- */

function buildBulkActions(router: ReturnType<typeof useRouter>): BulkAction<InvitationRow>[] {
  const [isPending, startTransition] = React.useTransition()

  async function runBulk(
    rows: InvitationRow[],
    fn:
      | typeof acceptInvitationAction
      | typeof declineInvitationAction
      | typeof deleteInvitationAction,
    loadingMsg: string,
    successMsg: string,
  ) {
    const toastId = toast.loading(loadingMsg)
    const results = await Promise.all(
      rows.map(async (inv) => {
        const fd = new FormData()
        fd.append('invitationId', String(inv.id))
        return fn({}, fd)
      }),
    )
    const errors = results.filter((r) => r?.error).map((r) => r!.error)
    errors.length
      ? toast.error(errors.join('\n'), { id: toastId })
      : toast.success(successMsg, { id: toastId })
    router.refresh()
  }

  const canAccept = (rows: InvitationRow[]) =>
    rows.length > 0 &&
    rows.every((r) => r.status === 'pending') &&
    new Set(rows.map((r) => r.role)).size === 1

  const canDecline = (rows: InvitationRow[]) =>
    rows.length > 0 && rows.every((r) => r.status === 'pending')

  return [
    {
      label: 'Accept',
      icon: AcceptIcon as any,
      onClick: (selected) =>
        startTransition(() => runBulk(selected, acceptInvitationAction, 'Accepting…', 'Invitations accepted.')),
      isAvailable: canAccept,
      isDisabled: (rows) => !canAccept(rows) || isPending,
    },
    {
      label: 'Decline',
      icon: DeclineIcon as any,
      onClick: (selected) =>
        startTransition(() => runBulk(selected, declineInvitationAction, 'Declining…', 'Invitations declined.')),
      isAvailable: canDecline,
      isDisabled: (rows) => !canDecline(rows) || isPending,
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (selected) =>
        startTransition(() => runBulk(selected, deleteInvitationAction, 'Deleting…', 'Invitations deleted.')),
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                         Row actions builder                                */
/* -------------------------------------------------------------------------- */

function useRowActions(
  router: ReturnType<typeof useRouter>,
): (row: InvitationRow) => TableRowAction<InvitationRow>[] {
  return React.useCallback(
    (row: InvitationRow) => {
      const actions: TableRowAction<InvitationRow>[] = []
      const isAwaiting = row.status === 'pending'

      async function runAction(
        fn:
          | typeof acceptInvitationAction
          | typeof declineInvitationAction
          | typeof deleteInvitationAction,
        successMsg: string,
      ) {
        const fd = new FormData()
        fd.append('invitationId', String(row.id))
        const res = await fn({}, fd)
        res?.error ? toast.error(res.error) : toast.success(res?.success ?? successMsg)
        router.refresh()
      }

      if (isAwaiting) {
        actions.push({
          label: 'Accept',
          icon: AcceptIcon as any,
          onClick: () => runAction(acceptInvitationAction, 'Invitation accepted.'),
        })
        actions.push({
          label: 'Decline',
          icon: DeclineIcon as any,
          onClick: () => runAction(declineInvitationAction, 'Invitation declined.'),
        })
      }

      actions.push({
        label: 'Delete',
        icon: Trash2,
        variant: 'destructive',
        onClick: () => runAction(deleteInvitationAction, 'Invitation deleted.'),
      })

      return actions
    },
    [router],
  )
}

/* -------------------------------------------------------------------------- */
/*                              TABLE COMPONENT                               */
/* -------------------------------------------------------------------------- */

export default function InvitationsTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: InvitationsTableProps) {
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
  const columns = React.useMemo<Column<InvitationRow>[]>(() => {
    return [
      {
        key: 'team',
        header: sortableHeader('Team', 'team'),
        sortable: false,
        render: (v) => <span className='font-medium'>{String(v)}</span>,
      },
      {
        key: 'role',
        header: sortableHeader('Role', 'role'),
        sortable: false,
        className: 'capitalize',
        render: (v) => <span>{String(v)}</span>,
      },
      {
        key: 'inviter',
        header: sortableHeader('Invited By', 'inviter'),
        sortable: false,
        className: 'break-all',
        render: (v) => <span>{v ? String(v) : '—'}</span>,
      },
      {
        key: 'status',
        header: sortableHeader('Status', 'status'),
        sortable: false,
        render: (v) => <StatusBadge status={String(v)} />,
      },
      {
        key: 'invitedAt',
        header: sortableHeader('Invited', 'invitedAt'),
        sortable: false,
        render: (v) => (
          <span>{formatDistanceToNow(new Date(v as Date), { addSuffix: true })}</span>
        ),
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

  /* ------------------------------ View ------------------------------------ */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='team'
      filterValue={search}
      onFilterChange={handleSearchChange}
      bulkActions={bulkActions}
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}