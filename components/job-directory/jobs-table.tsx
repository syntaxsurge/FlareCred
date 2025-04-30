'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Briefcase } from 'lucide-react'
import React from 'react'

import { applyToJobAction } from '@/app/(tools)/jobs/actions'
import { ActionButton } from '@/components/ui/action-button'
import { DataTable } from '@/components/ui/tables/data-table'
import type { Column } from '@/lib/types/components'
import type { JobRow } from '@/lib/types/tables'

interface JobsTableProps {
  rows: JobRow[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  searchQuery: string
}

export default function JobsTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: JobsTableProps) {
  const router = useRouter()

  /* ----------------------------- Columns --------------------------------- */
  const columns = React.useMemo<Column<JobRow>[]>(() => {
    const applyButton = (row: JobRow) => (
      <ApplyButton pipelineId={row.id} onDone={() => router.refresh()} />
    )

    return [
      { key: 'name', header: 'Job Title' },
      { key: 'recruiter', header: 'Recruiter' },
      {
        key: 'createdAt',
        header: 'Posted',
        render: (v) => format(new Date(v as string), 'PPP'),
        sortable: true,
      },
      {
        key: 'description',
        header: 'Description',
        render: (v) => <span className='line-clamp-2 max-w-xs text-muted-foreground'>{v}</span>,
        enableHiding: true,
      },
      {
        key: 'id',
        header: '',
        render: (_v, row) => applyButton(row),
      },
    ]
  }, [router])

  /* ----------------------------- Render ---------------------------------- */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='name'
      filterValue={searchQuery}
      basePath={basePath}
      sort={sort}
      order={order}
      initialParams={initialParams}
    />
  )
}

/* ------------------------------------------------------------------------ */
/*                          Apply-button helper                             */
/* ------------------------------------------------------------------------ */

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