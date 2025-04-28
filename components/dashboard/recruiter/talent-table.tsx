'use client'

import Link from 'next/link'
import * as React from 'react'

import { DataTable, type Column } from '@/components/ui/tables/data-table'
import type { TalentRow } from '@/lib/types/table-rows'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface TalentTableProps {
  rows: TalentRow[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  searchQuery: string
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
  /* -------------------- Centralised navigation helpers -------------------- */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* ----------------------------- Columns ---------------------------------- */
  const columns = React.useMemo<Column<TalentRow>[]>(() => {
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
  }, [sortableHeader])

  /* ------------------------------- View ---------------------------------- */
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