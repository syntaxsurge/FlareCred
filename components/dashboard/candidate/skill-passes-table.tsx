'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { Clipboard, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { TableRowActions, type TableRowAction } from '@/components/ui/tables/row-actions'
import { StatusBadge } from '@/components/ui/status-badge'
import { useBulkActions } from '@/lib/hooks/use-bulk-actions'
import { useTableNavigation } from '@/lib/hooks/use-table-navigation'
import type { SkillPassRow, TableProps } from '@/lib/types/tables'
import { copyToClipboard } from '@/lib/utils'
import { txUrl } from '@/lib/utils/explorer'

/* -------------------------------------------------------------------------- */
/*                              Skill Passes Table                            */
/* -------------------------------------------------------------------------- */

export default function SkillPassesTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: TableProps<SkillPassRow>) {
  const router = useRouter()

  /* ---------------------- Bulk-selection actions ------------------------ */
  const bulkActions = useBulkActions<SkillPassRow>([])

  /* -------------------- Centralised navigation helpers ------------------ */
  const { search, handleSearchChange, sortableHeader } = useTableNavigation({
    basePath,
    initialParams,
    sort,
    order,
    searchQuery,
    paramKeys: { sort: 'passSort', order: 'passOrder', search: 'passQ', page: 'passPage' },
  })

  /* --------------------------- Row actions ------------------------------ */
  const makeActions = React.useCallback(
    (row: SkillPassRow): TableRowAction<SkillPassRow>[] => {
      const actions: TableRowAction<SkillPassRow>[] = []

      if (row.vcJson) {
        actions.push({
          label: 'Copy VC JSON',
          icon: Clipboard,
          onClick: async () => {
            await copyToClipboard(row.vcJson!)
            toast.success('VC JSON copied to clipboard')
          },
        })
      }

      return actions
    },
    [],
  )

  /* ------------------------------ Columns ------------------------------- */
  const columns = React.useMemo<Column<SkillPassRow>[]>(() => {
    return [
      {
        key: 'quizTitle',
        header: sortableHeader('Quiz', 'quizTitle'),
        sortable: false,
        render: (v) => <span className='font-medium'>{v as string}</span>,
      },
      {
        key: 'score',
        header: sortableHeader('Score', 'score'),
        sortable: false,
        render: (v, row) =>
          row.maxScore ? `${v ?? '—'} / ${row.maxScore}` : (v ?? '—').toString(),
      },
      {
        key: 'txHash',
        header: 'Tx',
        sortable: false,
        render: (v) =>
          v ? (
            <a
              href={txUrl(v as string)}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary underline'
            >
              View <ExternalLink className='inline-block h-4 w-4' />
            </a>
          ) : (
            '—'
          ),
      },
      {
        key: 'createdAt',
        header: sortableHeader('Date', 'createdAt'),
        sortable: false,
        render: (v) => new Date(v as string).toLocaleString(),
      },
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => <TableRowActions row={row} actions={makeActions(row)} />,
      },
    ]
  }, [sortableHeader, makeActions])

  /* ------------------------------- View --------------------------------- */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='quizTitle'
      filterValue={search}
      onFilterChange={handleSearchChange}
      bulkActions={bulkActions}
      /* Disable client-side pagination to rely on server-side TablePagination */
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}