'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import {
  ShieldCheck,
  ShieldX,
  XCircle,
  Trash2,
  type LucideProps,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  updateIssuerStatusAction,
  deleteIssuerAction,
} from '@/app/(dashboard)/admin/issuers/actions'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
import {
  TableRowActions,
  type TableRowAction,
} from '@/components/ui/tables/row-actions'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
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
/*                            C O L O R  E D   I C O N S                      */
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
/*                           Bulk-selection Actions                           */
/* -------------------------------------------------------------------------- */

function useBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
  const [isPending, startTransition] = React.useTransition()

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

  /* --------------------- Centralised navigation helpers ------------------- */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* ----------------------- Row-level actions builder ---------------------- */
  const makeActions = React.useCallback(
    (row: RowType): TableRowAction<RowType>[] => {
      const actions: TableRowAction<RowType>[] = []

      if (row.status !== 'ACTIVE') {
        actions.push({
          label: 'Verify',
          icon: VerifyIcon as any,
          onClick: async () => {
            const toastId = toast.loading('Updating issuer…')
            const fd = new FormData()
            fd.append('issuerId', row.id.toString())
            fd.append('status', IssuerStatus.ACTIVE)
            const res = await updateIssuerStatusAction({}, fd)
            res?.error
              ? toast.error(res.error, { id: toastId })
              : toast.success(res?.success ?? 'Issuer updated.', { id: toastId })
            router.refresh()
          },
        })
      }

      if (row.status === 'ACTIVE') {
        actions.push({
          label: 'Unverify',
          icon: UnverifyIcon as any,
          onClick: async () => {
            const toastId = toast.loading('Updating issuer…')
            const fd = new FormData()
            fd.append('issuerId', row.id.toString())
            fd.append('status', IssuerStatus.PENDING)
            const res = await updateIssuerStatusAction({}, fd)
            res?.error
              ? toast.error(res.error, { id: toastId })
              : toast.success(res?.success ?? 'Issuer updated.', { id: toastId })
            router.refresh()
          },
        })
      }

      if (row.status !== 'REJECTED') {
        actions.push({
          label: 'Reject',
          icon: RejectIcon as any,
          variant: 'destructive',
          onClick: async () => {
            const toastId = toast.loading('Updating issuer…')
            const fd = new FormData()
            fd.append('issuerId', row.id.toString())
            fd.append('status', IssuerStatus.REJECTED)
            fd.append('rejectionReason', 'Rejected by admin')
            const res = await updateIssuerStatusAction({}, fd)
            res?.error
              ? toast.error(res.error, { id: toastId })
              : toast.success(res?.success ?? 'Issuer updated.', { id: toastId })
            router.refresh()
          },
        })
      }

      actions.push({
        label: 'Delete',
        icon: Trash2,
        variant: 'destructive',
        onClick: async () => {
          const toastId = toast.loading('Deleting issuer…')
          const fd = new FormData()
          fd.append('issuerId', row.id.toString())
          const res = await deleteIssuerAction({}, fd)
          res?.error
            ? toast.error(res.error, { id: toastId })
            : toast.success(res?.success ?? 'Issuer deleted.', { id: toastId })
          router.refresh()
        },
      })

      return actions
    },
    [router],
  )

  /* ------------------------------- Columns -------------------------------- */
  const columns = React.useMemo<Column<RowType>[]>(() => {
    return [
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
        render: (_v, row) => <TableRowActions row={row} actions={makeActions(row)} />,
      },
    ]
  }, [sortableHeader, makeActions])

  /* ----------------------------- Render ----------------------------------- */
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