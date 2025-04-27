'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { ArrowUpDown, MoreHorizontal, Copy as CopyIcon, Eye } from 'lucide-react'
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
  /** Current search term (from URL). */
  searchQuery: string
}

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

function buildLink(basePath: string, init: Record<string, string>, overrides: Record<string, any>) {
  const sp = new URLSearchParams(init)
  Object.entries(overrides).forEach(([k, v]) => sp.set(k, String(v)))
  Array.from(sp.entries()).forEach(([k, v]) => {
    if (v === '') sp.delete(k)
  })
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

function prettify(text: string) {
  return text.replaceAll('_', ' ').toLowerCase()
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
  const router = useRouter()

  /* -------------------------- Search handling --------------------------- */
  const [search, setSearch] = React.useState(searchQuery)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const href = buildLink(basePath, initialParams, { q: value, page: 1 })
      router.push(href, { scroll: false })
    }, 400)
  }

  /* ------------------------ Sortable headers ---------------------------- */
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
        render: (v) => prettify(String(v)),
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
  }, [sort, order, basePath, initialParams, search])

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
