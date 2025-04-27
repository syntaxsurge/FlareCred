'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { ArrowUpDown } from 'lucide-react'

import { DataTable, type Column } from '@/components/ui/tables/data-table'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  name: string | null
  email: string
  bio: string | null
  verified: number
  topScore: number | null
}

interface TalentTableProps {
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
    if (v === '') sp.delete(k)
  })
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function TalentTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: TalentTableProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState<string>(searchQuery)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  /* --------------------------- Search (server) --------------------------- */
  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const href = buildLink(basePath, initialParams, { q: value, page: 1 })
      router.push(href, { scroll: false })
    }, 400)
  }

  /* --------------------------- Sort helpers ----------------------------- */
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

  /* --------------------------- Column defs ------------------------------ */
  const columns = React.useMemo<Column<RowType>[]>(() => {
    return [
      {
        key: 'name',
        header: sortableHeader('Name', 'name'),
        sortable: false,
        render: (v) => <span className='font-medium'>{v || '—'}</span>,
      },
      {
        key: 'email',
        header: sortableHeader('Email', 'email'),
        sortable: false,
        render: (v) => v as string,
      },
      {
        key: 'verified',
        header: 'Verified Credentials',
        sortable: false,
        render: (v) => v as number,
      },
      {
        key: 'topScore',
        header: 'Top Skill Score',
        sortable: false,
        render: (v) => (v === null ? '—' : v),
      },
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => (
          <Link href={`/recruiter/talent/${row.id}`} className='text-primary underline'>
            View Profile
          </Link>
        ),
      },
    ]
  }, [sort, order, basePath, initialParams, search])

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
