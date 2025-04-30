'use client'

import Link from 'next/link'
import * as React from 'react'

import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import type { TableProps, TalentRow } from '@/lib/types/tables'

/* -------------------------------------------------------------------------- */
/*                            R E C R U I T E R ─ T A L E N T                 */
/* -------------------------------------------------------------------------- */

export default function TalentTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: TableProps<TalentRow>) {
  /* ------------------------- Navigation helpers ------------------------- */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* --------------------------- Column config ---------------------------- */
  const columns = React.useMemo<Column<TalentRow>[]>(() => {
    return [
      {
        key: 'name',
        header: sortableHeader('Name', 'name'),
        sortable: false,
        render: (v, row) => (
          <Link href={`/candidates/${row.id}`} className='flex items-center gap-2'>
            <UserAvatar name={row.name} email={row.email} className='size-7' />
            <span className='font-medium underline-offset-4 hover:underline'>
              {v || 'Unnamed'}
            </span>
          </Link>
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
        header: sortableHeader('Verified Creds', 'verified'),
        sortable: false,
        render: (v) => ((v as number) > 0 ? v : '—'),
      },
      {
        key: 'topScore',
        header: sortableHeader('Top Score', 'topScore'),
        sortable: false,
        render: (v) => (v === null ? '—' : `${v}%`),
      },
    ]
  }, [sortableHeader])

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