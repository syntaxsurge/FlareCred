'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Briefcase } from 'lucide-react'

import { applyToJobAction } from '@/app/(tools)/jobs/actions'
import { ActionButton } from '@/components/ui/action-button'
import { DataTable } from '@/components/ui/tables/data-table'
import type { Column } from '@/lib/types/components'
import type { JobRow } from '@/lib/types/tables'

/* -------------------------------------------------------------------------- */
/*                                 P R O P S                                  */
/* -------------------------------------------------------------------------- */

interface JobsTableProps {
  rows: JobRow[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  searchQuery: string
}

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
}: JobsTableProps) {
  const router = useRouter()

  /* --------------------------- Filter callback --------------------------- */
  const onFilterChange = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(initialParams)
      if (value.trim()) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      params.delete('page') // always reset pagination on new search
      router.push(`${basePath}?${params.toString()}`)
    },
    [router, basePath, initialParams],
  )

  /* ------------------------------- Columns ------------------------------ */
  const columns = React.useMemo<Column<JobRow>[]>(() => {
    return [
      { key: 'name', header: 'Job Title', sortable: true },
      { key: 'recruiter', header: 'Recruiter', sortable: true },
      {
        key: 'createdAt',
        header: 'Posted',
        render: (v) => format(new Date(v as string), 'PPP'),
        sortable: true,
      },
      {
        key: 'description',
        header: 'Description',
        render: (v) => (
          <span className='line-clamp-2 max-w-xs text-muted-foreground'>{v}</span>
        ),
        enableHiding: true,
      },
      {
        key: 'id',
        header: 'Apply',
        render: (_v, row) => (
          <ApplyButton pipelineId={row.id} onDone={() => router.refresh()} />
        ),
        enableHiding: false, // prevent blank entry in columns dropdown
        sortable: false,
      },
    ]
  }, [router])

  /* ------------------------------- Render ------------------------------- */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      basePath={basePath}
      sort={sort}
      order={order}
      initialParams={initialParams}
      filterKey='name'
      filterValue={searchQuery}
      onFilterChange={onFilterChange}
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