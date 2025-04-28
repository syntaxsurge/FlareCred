'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { removeTeamMember } from '@/app/(auth)/actions'
import { updateTeamMemberRoleAction } from '@/app/(dashboard)/settings/team/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
import { RowActions, type TableRowAction } from '@/components/ui/tables/row-actions'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import { truncateAddress } from '@/lib/utils/address'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  name: string
  email: string
  walletAddress?: string | null
  role: string
  joinedAt: string
}

interface MembersTableProps {
  rows: RowType[]
  isOwner: boolean
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  searchQuery: string
}

/* -------------------------------------------------------------------------- */
/*                             Edit member dialog                             */
/* -------------------------------------------------------------------------- */

const ROLES = ['member', 'owner'] as const

function EditMemberForm({ row, onDone }: { row: RowType; onDone: () => void }) {
  const [role, setRole] = React.useState<RowType['role']>(row.role)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.append('memberId', row.id.toString())
      fd.append('role', role)
      const res = await updateTeamMemberRoleAction({}, fd)
      res?.error ? toast.error(res.error) : toast.success(res?.success ?? 'Member updated.')
      onDone()
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className='space-y-4'>
      <div>
        <Label htmlFor='role'>Role</Label>
        <select
          id='role'
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className='h-10 w-full rounded-md border px-2 capitalize'
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <Button type='submit' className='w-full' disabled={pending}>
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Saving…
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Row actions                                  */
/* -------------------------------------------------------------------------- */

function MemberRowActions({ row, isOwner }: { row: RowType; isOwner: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [editOpen, setEditOpen] = React.useState(false)

  if (!isOwner) return null

  const actions = React.useMemo<TableRowAction<RowType>[]>(
    () => [
      {
        label: 'Edit',
        icon: Pencil,
        onClick: () => setEditOpen(true),
        disabled: () => isPending,
      },
      {
        label: 'Remove',
        icon: Trash2,
        variant: 'destructive',
        onClick: () =>
          startTransition(async () => {
            const fd = new FormData()
            fd.append('memberId', row.id.toString())
            const res = await removeTeamMember({}, fd)
            res?.error
              ? toast.error(res.error)
              : toast.success(res?.success ?? 'Member removed.')
            router.refresh()
          }),
        disabled: () => isPending,
      },
    ],
    [isPending, row.id, router, startTransition],
  )

  return (
    <>
      <RowActions row={row} actions={actions} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Modify the member’s role, then save your changes.
            </DialogDescription>
          </DialogHeader>
          <EditMemberForm row={row} onDone={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Bulk actions                                 */
/* -------------------------------------------------------------------------- */

function buildBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
  const [isPending, startTransition] = React.useTransition()

  return [
    {
      label: 'Remove',
      icon: Trash2,
      variant: 'destructive',
      onClick: (selected) =>
        startTransition(async () => {
          const toastId = toast.loading('Removing members…')
          await Promise.all(
            selected.map(async (m) => {
              const fd = new FormData()
              fd.append('memberId', m.id.toString())
              return removeTeamMember({}, fd)
            }),
          )
          toast.success('Selected members removed.', { id: toastId })
          router.refresh()
        }),
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function MembersTable({
  rows,
  isOwner,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: MembersTableProps) {
  const router = useRouter()
  const bulkActions = isOwner ? buildBulkActions(router) : []

  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  const columns = React.useMemo<Column<RowType>[]>(() => {
    const base: Column<RowType>[] = [
      {
        key: 'name',
        header: sortableHeader('Name', 'name'),
        sortable: false,
        render: (v) => <span className='font-medium'>{v as string}</span>,
      },
      {
        key: 'email',
        header: sortableHeader('Email', 'email'),
        sortable: false,
        render: (v) => v as string,
      },
      {
        key: 'walletAddress',
        header: 'Wallet',
        sortable: false,
        render: (v) => (
          <span className='font-mono text-xs'>{truncateAddress(v as string)}</span>
        ),
      },
      {
        key: 'role',
        header: sortableHeader('Role', 'role'),
        sortable: false,
        className: 'capitalize',
        render: (v) => v as string,
      },
      {
        key: 'joinedAt',
        header: sortableHeader('Joined', 'joinedAt'),
        sortable: false,
        render: (v) => formatDistanceToNow(new Date(v as string), { addSuffix: true }),
      },
    ]

    if (isOwner) {
      base.push({
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => <MemberRowActions row={row} isOwner={isOwner} />,
      })
    }

    return base
  }, [sortableHeader, isOwner])

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