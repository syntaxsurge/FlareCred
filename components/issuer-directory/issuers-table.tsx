'use client'

import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { MoreHorizontal, Copy as CopyIcon, Eye } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  name: string
  domain: string
  category: string
  industry: string
  status: string
  logoUrl?: string | null
  did?: string | null
  createdAt: string
}

interface Props {
  rows: RowType[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  searchQuery: string
}

/* -------------------------------------------------------------------------- */
/*                              Row actions                                   */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: RowType }) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  function copyDid() {
    if (!row.did) return
    navigator.clipboard.writeText(row.did).then(() => {
      toast.success('DID copied to clipboard')
    })
  }

  function openDialog() {
    /* Close dropdown first so trigger becomes clickable again after dialog closes */
    setMenuOpen(false)
    setTimeout(() => setDialogOpen(true), 0)
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Open actions</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' className='rounded-md p-1 shadow-lg'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem disabled={!row.did} onSelect={openDialog} className='cursor-pointer'>
            <Eye className='mr-2 h-4 w-4' />
            View DID
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issuer DID</DialogTitle>
          </DialogHeader>
          {row.did ? (
            <div className='flex flex-col gap-4'>
              <code className='bg-muted rounded-md px-3 py-2 text-sm break-all'>{row.did}</code>
              <Button variant='outline' size='sm' className='self-end' onClick={copyDid}>
                <CopyIcon className='mr-2 h-4 w-4' /> Copy
              </Button>
            </div>
          ) : (
            <p className='text-muted-foreground text-sm'>No DID available.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function IssuersTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: Props) {
  /* -------------------- Centralised navigation helpers -------------------- */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* ----------------------- Column definitions --------------------------- */
  const columns = React.useMemo<Column<RowType>[]>(() => {
    return [
      {
        key: 'logoUrl',
        header: '',
        enableHiding: false,
        sortable: false,
        className: 'w-[60px]',
        render: (v, row) =>
          v ? (
            <Image
              src={v as string}
              alt={`${row.name} logo`}
              width={40}
              height={40}
              className='h-10 w-10 rounded-md border object-contain'
            />
          ) : (
            <div className='bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md text-[10px]'>
              N/A
            </div>
          ),
      },
      {
        key: 'name',
        header: sortableHeader('Name', 'name'),
        sortable: false,
        render: (v) => <span className='font-medium'>{v as string}</span>,
      },
      {
        key: 'domain',
        header: sortableHeader('Domain', 'domain'),
        sortable: false,
        render: (v) => v as string,
      },
      {
        key: 'category',
        header: sortableHeader('Category', 'category'),
        sortable: false,
        className: 'capitalize',
        render: (v) => String(v),
      },
      {
        key: 'industry',
        header: sortableHeader('Industry', 'industry'),
        sortable: false,
        className: 'capitalize',
        render: (v) => String(v).toLowerCase(),
      },
      {
        key: 'status',
        header: sortableHeader('Status', 'status'),
        sortable: false,
        render: (v) => <StatusBadge status={String(v)} />,
      },
      {
        key: 'createdAt',
        header: sortableHeader('Created', 'createdAt'),
        sortable: false,
        render: (v) =>
          v
            ? new Date(v as string).toLocaleDateString(undefined, {
                dateStyle: 'medium',
              })
            : '—',
      },
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => <RowActions row={row} />,
      },
    ]
  }, [sortableHeader])

  /* ----------------------------- Render ---------------------------------- */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='name'
      filterValue={search}
      onFilterChange={handleSearchChange}
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}