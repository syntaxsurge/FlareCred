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
/*                                C O M P O N E N T                           */
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

  /* ---------------------------------------------------------------------- */
  /* Centralised navigation helpers                                         */
  /* ---------------------------------------------------------------------- */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
  })

  /* ---------------------------------------------------------------------- */
  /* Column definitions                                                     */
  /* ---------------------------------------------------------------------- */
  const columns = React.useMemo<Column<JobRow>[]>(() => {
    return [
      {
        key: 'name',
        header: sortableHeader('Job Title', 'name'),
        sortable: false,
      },
      {
        key: 'recruiter',
        header: sortableHeader('Recruiter', 'recruiter'),
        sortable: false,
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
        render: (v) => (
          <span className='line-clamp-2 max-w-xs text-muted-foreground'>{v as string}</span>
        ),
      },
      {
        key: 'id',
        header: 'Apply',
        enableHiding: false, // prevent blank entry in columns dropdown
        sortable: false,
        render: (_v, row) => (
          <ApplyButton pipelineId={row.id} onDone={() => router.refresh()} />
        ),
      },
    ]
  }, [sortableHeader, router])

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */
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
/*                             A P P L Y  B U T T O N                         */
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