'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowUpDown,
  MoreHorizontal,
  Loader2,
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
import type { InvitationRow } from '@/lib/types/table-rows'
import { buildLink } from '@/lib/utils'

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
/*                              ROW ACTIONS                                   */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: InvitationRow }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const isAwaiting = row.status === 'pending'

  function runAction(
    fn:
      | typeof acceptInvitationAction
      | typeof declineInvitationAction
      | typeof deleteInvitationAction,
    successMsg: string,
  ) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('invitationId', String(row.id))
      const res = await fn({}, fd)
      res?.error ? toast.error(res.error) : toast.success(res?.success ?? successMsg)
      router.refresh()
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

        {isAwaiting && (
          <>
            <DropdownMenuItem
              onClick={() => runAction(acceptInvitationAction, 'Invitation accepted.')}
              disabled={isPending}
            >
              <AcceptIcon />
              Accept
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => runAction(declineInvitationAction, 'Invitation declined.')}
              disabled={isPending}
            >
              <DeclineIcon />
              Decline
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={() => runAction(deleteInvitationAction, 'Invitation deleted.')}
          disabled={isPending}
          className='font-semibold text-rose-600 hover:bg-rose-500/10 focus:bg-rose-500/10 dark:text-rose-400'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* -------------------------------------------------------------------------- */
/*                             BULK ACTIONS                                   */
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

  const canDecline = (rows: InvitationRow[]) => rows.length > 0 && rows.every((r) => r.status === 'pending')

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

  /* ------------------------------ Search ---------------------------------- */
  const [search, setSearch] = React.useState<string>(searchQuery)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildLink(basePath, initialParams, { q: value, page: 1 }), { scroll: false })
    }, 400)
  }

  /* -------------------------- Sortable headers ---------------------------- */
  function sortableHeader(label: string, key: string) {
    const nextOrder = sort === key && order === 'asc' ? 'desc' : 'asc'
    const href = buildLink(basePath, initialParams, {
      sort: key,
      order: nextOrder,
      page: 1,
      q: search,
    })
    return (
      <Link href={href} scroll={false} className='flex items-center gap-1'>
        {label}
        <ArrowUpDown className='h-4 w-4' />
      </Link>
    )
  }

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
        render: (v) =>
          <span>{formatDistanceToNow(new Date(v as Date), { addSuffix: true })}</span>,
      },
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => <RowActions row={row} />,
      },
    ]
  }, [sort, order, basePath, initialParams, search])

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