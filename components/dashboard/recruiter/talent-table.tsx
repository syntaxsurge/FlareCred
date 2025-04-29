'use client'

import Link from 'next/link'
import * as React from 'react'

import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import type { TableProps } from '@/lib/types/table-props'
import type { TalentRow } from '@/lib/types/table-rows'

export default function TalentTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: TableProps<TalentRow>) {
  /* -------------------- Navigation helpers -------------------- */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* ------------------------ Column defs ----------------------- */
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

  /* --------------------------- UI ---------------------------- */
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
