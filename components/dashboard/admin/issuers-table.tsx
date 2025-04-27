'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import {
  ArrowUpDown,
  MoreHorizontal,
  ShieldCheck,
  ShieldX,
  XCircle,
  Trash2,
  Loader2,
  type LucideProps,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  updateIssuerStatusAction,
  deleteIssuerAction,
} from '@/app/(dashboard)/admin/issuers/actions'
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
import { IssuerStatus } from '@/lib/db/schema/issuer'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  name: string
  domain: string
  owner: string
  category: string
  industry: string
  status: string
}

interface IssuersTableProps {
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
  Array.from(sp.entries()).forEach(([k, v]) => {
    if (v === '') sp.delete(k) // tidy URL
  })
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

/* -------------------------------------------------------------------------- */
/*                            C O L O R  E D   I C O N S                      */
/* -------------------------------------------------------------------------- */

const VerifyIcon = ({ className, ...props }: LucideProps) => (
  <ShieldCheck
    {...props}
    className={cn('mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400', className)}
  />
)

const UnverifyIcon = ({ className, ...props }: LucideProps) => (
  <ShieldX
    {...props}
    className={cn('mr-2 h-4 w-4 text-amber-600 dark:text-amber-400', className)}
  />
)

const RejectIcon = ({ className, ...props }: LucideProps) => (
  <XCircle {...props} className={cn('mr-2 h-4 w-4 text-rose-600 dark:text-rose-400', className)} />
)

/* -------------------------------------------------------------------------- */
/*                               Row Actions                                  */
/* -------------------------------------------------------------------------- */

function RowActions({ id, status }: { id: number; status: string }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  async function mutate(next: keyof typeof IssuerStatus, reason?: string) {
    startTransition(async () => {
      const toastId = toast.loading('Updating issuer…')
      const fd = new FormData()
      fd.append('issuerId', id.toString())
      fd.append('status', next)
      if (reason) fd.append('rejectionReason', reason)
      const res = await updateIssuerStatusAction({}, fd)

      res?.error
        ? toast.error(res.error, { id: toastId })
        : toast.success(res?.success ?? 'Issuer updated.', { id: toastId })
      router.refresh()
    })
  }

  async function destroy() {
    startTransition(async () => {
      const toastId = toast.loading('Deleting issuer…')
      const fd = new FormData()
      fd.append('issuerId', id.toString())
      const res = await deleteIssuerAction({}, fd)

      res?.error
        ? toast.error(res.error, { id: toastId })
        : toast.success(res?.success ?? 'Issuer deleted.', { id: toastId })
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

        {status !== 'ACTIVE' && (
          <DropdownMenuItem
            onClick={() => mutate(IssuerStatus.ACTIVE)}
            disabled={isPending}
            className='hover:bg-emerald-500/10 focus:bg-emerald-500/10'
          >
            <VerifyIcon />
            Verify
          </DropdownMenuItem>
        )}

        {status === 'ACTIVE' && (
          <DropdownMenuItem
            onClick={() => mutate(IssuerStatus.PENDING)}
            disabled={isPending}
            className='hover:bg-amber-500/10 focus:bg-amber-500/10'
          >
            <UnverifyIcon />
            Unverify
          </DropdownMenuItem>
        )}

        {status !== 'REJECTED' && (
          <DropdownMenuItem
            onClick={() => mutate(IssuerStatus.REJECTED, 'Rejected by admin')}
            disabled={isPending}
            className='hover:bg-rose-500/10 focus:bg-rose-500/10'
          >
            <RejectIcon />
            Reject
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={destroy}
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
/*                           Bulk-Selection Actions                           */
/* -------------------------------------------------------------------------- */

function useBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
  const [isPending, _] = React.useTransition()

  async function bulkUpdate(
    selected: RowType[],
    status: keyof typeof IssuerStatus,
    reason?: string,
  ) {
    const toastId = toast.loading('Updating issuers…')
    await Promise.all(
      selected.map(async (row) => {
        const fd = new FormData()
        fd.append('issuerId', row.id.toString())
        fd.append('status', status)
        if (reason) fd.append('rejectionReason', reason)
        return updateIssuerStatusAction({}, fd)
      }),
    )
    toast.success('Issuers updated.', { id: toastId })
    router.refresh()
  }

  async function bulkDelete(selected: RowType[]) {
    const toastId = toast.loading('Deleting issuers…')
    await Promise.all(
      selected.map(async (row) => {
        const fd = new FormData()
        fd.append('issuerId', row.id.toString())
        return deleteIssuerAction({}, fd)
      }),
    )
    toast.success('Issuers deleted.', { id: toastId })
    router.refresh()
  }

  return [
    {
      label: 'Verify',
      icon: VerifyIcon as any,
      onClick: (sel) => bulkUpdate(sel, IssuerStatus.ACTIVE),
    },
    {
      label: 'Unverify',
      icon: UnverifyIcon as any,
      onClick: (sel) => bulkUpdate(sel, IssuerStatus.PENDING),
    },
    {
      label: 'Reject',
      icon: RejectIcon as any,
      onClick: (sel) => bulkUpdate(sel, IssuerStatus.REJECTED, 'Bulk reject'),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: bulkDelete,
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function AdminIssuersTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: IssuersTableProps) {
  const router = useRouter()
  const bulkActions = useBulkActions(router)

  /* ----------------------------- Search ----------------------------------- */
  const [search, setSearch] = React.useState<string>(searchQuery)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const href = buildLink(basePath, initialParams, { q: value, page: 1 })
      router.push(href, { scroll: false })
    }, 400)
  }

  /* ----------------------------- Headers ---------------------------------- */
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
        {label} <ArrowUpDown className='h-4 w-4' />
      </Link>
    )
  }

  /* ----------------------------- Columns ---------------------------------- */
  const columns = React.useMemo<Column<RowType>[]>(
    () => [
      {
        key: 'name',
        header: sortableHeader('Name / Domain', 'name'),
        sortable: false,
        render: (_v, row) => (
          <div className='min-w-[180px]'>
            <p className='truncate font-medium'>{row.name}</p>
            <p className='text-muted-foreground truncate text-xs'>{row.domain}</p>
          </div>
        ),
      },
      {
        key: 'owner',
        header: sortableHeader('Owner', 'owner'),
        sortable: false,
        className: 'truncate',
        render: (v) => <span className='break-all'>{(v && String(v).trim()) || '—'}</span>,
      },
      {
        key: 'category',
        header: sortableHeader('Category', 'category'),
        sortable: false,
        className: 'capitalize',
        render: (v) => (v as string).replaceAll('_', ' ').toLowerCase(),
      },
      {
        key: 'industry',
        header: sortableHeader('Industry', 'industry'),
        sortable: false,
        className: 'capitalize',
        render: (v) => (v as string).toLowerCase(),
      },
      {
        key: 'status',
        header: sortableHeader('Status', 'status'),
        sortable: false,
        render: (v) => <StatusBadge status={String(v)} />,
      },
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => <RowActions id={row.id} status={row.status} />,
      },
    ],
    [sort, order, basePath, initialParams, search],
  )

  /* All rows fit on one client page - paging handled server‑side */
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
