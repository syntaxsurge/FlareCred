'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Briefcase } from 'lucide-react'

import { applyToJobAction } from '@/app/(tools)/jobs/actions'
import { ActionButton } from '@/components/ui/action-button'
import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import type { TableProps, JobRow } from '@/lib/types/tables'

/* -------------------------------------------------------------------------- */
/*                              J O B S   T A B L E                           */
/* -------------------------------------------------------------------------- */

export default function JobsTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: TableProps<JobRow>) {
  const router = useRouter()

  /* Centralised table-navigation helpers */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* Column configuration */
  const columns = React.useMemo<Column<JobRow>[]>(() => {
    return [
      {
        key: 'name',
        header: sortableHeader('Job Title', 'name'),
        sortable: false,
        render: (v) => <span className='font-medium'>{v as string}</span>,
      },
      {
        key: 'recruiter',
        header: sortableHeader('Recruiter', 'recruiter'),
        sortable: false,
        render: (v) => (v ? (v as string) : '—'),
      },
      {
        key: 'createdAt',
        header: sortableHeader('Posted', 'createdAt'),
        sortable: false,
        render: (v) => format(new Date(v as string), 'PPP'),
      },
      {
        key: 'description',
        header: 'Description',
        enableHiding: true,
        sortable: false,
        /* Show full description – no truncation */
        render: (v) => <span className='text-muted-foreground'>{v as string}</span>,
      },
      {
        key: 'id',
        header: 'Apply',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => (
          <ApplyButton pipelineId={row.id} onDone={() => router.refresh()} />
        ),
      },
    ]
  }, [sortableHeader, router])

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

/* -------------------------------------------------------------------------- */
/*                                 A P P L Y                                  */
/* -------------------------------------------------------------------------- */

function ApplyButton({ pipelineId, onDone }: { pipelineId: number; onDone: () => void }) {
  async function handleApply() {
    const fd = new FormData()
    fd.append('pipelineId', String(pipelineId))
    const res = await applyToJobAction({}, fd)
    if (res?.success) onDone()
    return res
  }

  return (
    <ActionButton
      onAction={handleApply}
      pendingLabel='Applying…'
      size='sm'
      className='rounded-full'
    >
      <Briefcase className='mr-2 h-4 w-4' strokeWidth={1.5} />
      Apply
    </ActionButton>
  )
}