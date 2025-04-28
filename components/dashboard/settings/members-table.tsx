'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
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

function RowActions({ row, isOwner }: { row: RowType; isOwner: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)

  function openEditDialog() {
    setMenuOpen(false)
    setTimeout(() => setEditOpen(true), 0)
  }

  function destroy() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('memberId', row.id.toString())
      const res = await removeTeamMember({}, fd)
      res?.error ? toast.error(res.error) : toast.success(res?.success ?? 'Member removed.')
      router.refresh()
    })
  }

  if (!isOwner) return null

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
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
          <DropdownMenuItem onSelect={openEditDialog} className='cursor-pointer'>
            <Pencil className='mr-2 h-4 w-4' /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={destroy}
            disabled={isPending}
            className='cursor-pointer font-semibold text-rose-600 hover:bg-rose-500/10 focus:bg-rose-500/10 dark:text-rose-400'
          >
            <Trash2 className='mr-2 h-4 w-4' /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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

  /* -------------------- Centralised navigation helpers -------------------- */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* --------------------------- Column definitions ------------------------- */
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
        render: (_v, row) => <RowActions row={row} isOwner={isOwner} />,
      })
    }

    return base
  }, [sortableHeader, isOwner])

  /* ------------------------------- View ---------------------------------- */
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