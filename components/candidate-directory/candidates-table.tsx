'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { UserAvatar } from '@/components/ui/user-avatar'

/* -------------------------------------------------------------------------- */
/*                                 T Y P E S                                  */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  name: string | null
  email: string
  verified: number
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
/*                               H E L P E R S                                */
/* -------------------------------------------------------------------------- */

function buildLink(base: string, init: Record<string, string>, overrides: Record<string, any>) {
  const sp = new URLSearchParams(init)
  Object.entries(overrides).forEach(([k, v]) => sp.set(k, String(v)))
  Array.from(sp.entries()).forEach(([k, v]) => !v && sp.delete(k))
  const qs = sp.toString()
  return `${base}${qs ? `?${qs}` : ''}`
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function CandidatesTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: Props) {
  const router = useRouter()
  const [search, setSearch] = React.useState(searchQuery)
  const debounce = React.useRef<NodeJS.Timeout | null>(null)

  /* --------------------------- Server-side search ------------------------ */
  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      router.push(buildLink(basePath, initialParams, { q: value, page: 1 }), { scroll: false })
    }, 400)
  }

  /* --------------------------- Sortable headers ------------------------- */
  function sortableHeader(label: string, key: string) {
    const next = sort === key && order === 'asc' ? 'desc' : 'asc'
    const href = buildLink(basePath, initialParams, {
      sort: key,
      order: next,
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

  /* ------------------------------- Columns ------------------------------ */
  const columns = React.useMemo<Column<RowType>[]>(
    () => [
      {
        key: 'name',
        header: sortableHeader('Name', 'name'),
        sortable: false,
        render: (v, row) => (
          <div className='flex items-center gap-2'>
            <UserAvatar name={row.name} email={row.email} className='size-7' />
            <span className='font-medium'>{v || 'Unnamed'}</span>
          </div>
        ),
      },
      {
        key: 'email',
        header: sortableHeader('Email', 'email'),
        sortable: false,
        render: (v) => v as string,
        className: 'break-all',
      },
      {
        key: 'verified',
        header: sortableHeader('Verified', 'verified'),
        sortable: false,
        render: (v) => ((v as number) > 0 ? v : '—'),
      },
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => (
          <Button asChild variant='link' size='sm' className='text-primary'>
            <Link href={`/candidates/${row.id}`}>View Profile</Link>
          </Button>
        ),
      },
    ],
    [sort, order, basePath, initialParams, search],
  )

  /* ------------------------------- View --------------------------------- */
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
