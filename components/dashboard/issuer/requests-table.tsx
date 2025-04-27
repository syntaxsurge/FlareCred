'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { ArrowUpDown, FileSignature, XCircle, type LucideProps } from 'lucide-react'
import { toast } from 'sonner'

import { rejectCredentialAction } from '@/app/(dashboard)/issuer/credentials/actions'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
import { CredentialStatus } from '@/lib/db/schema/candidate'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  title: string
  type: string
  candidate: string
  status: CredentialStatus
}

interface Props {
  rows: RowType[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  /** Current search term (from URL). */
  searchQuery: string
}

/* -------------------------------------------------------------------------- */
/*                                 Helpers                                    */
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
/*                                 Icons                                      */
/* -------------------------------------------------------------------------- */

const RejectIcon = (props: LucideProps) => (
  <XCircle {...props} className='mr-2 h-4 w-4 text-rose-600 dark:text-rose-400' />
)

/* -------------------------------------------------------------------------- */
/*                           Row‑level link                                   */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: RowType }) {
  return (
    <Link
      href={`/issuer/credentials/${row.id}`}
      className='text-primary hover:bg-muted hover:text-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium'
    >
      <FileSignature className='h-4 w-4' />
      <span className='hidden sm:inline'>Review &amp; Sign</span>
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/*                         Bulk‑selection actions                             */
/* -------------------------------------------------------------------------- */

function buildBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
  const [isPending, startTransition] = React.useTransition()

  async function bulkReject(rows: RowType[]) {
    const toastId = toast.loading('Rejecting…')
    const results = await Promise.all(
      rows.map(async (cred) => {
        const fd = new FormData()
        fd.append('credentialId', cred.id.toString())
        return rejectCredentialAction({}, fd)
      }),
    )
    const errors = results.filter((r) => r?.error).map((r) => r!.error)
    if (errors.length) {
      toast.error(errors.join('\n'), { id: toastId })
    } else {
      toast.success('Credentials rejected.', { id: toastId })
    }
    router.refresh()
  }

  return [
    {
      label: 'Reject',
      icon: RejectIcon as any,
      variant: 'destructive',
      onClick: (selected) => startTransition(() => bulkReject(selected)),
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function IssuerRequestsTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: Props) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)

  /* --------------------------- Search input ----------------------------- */
  const [search, setSearch] = React.useState(searchQuery)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const href = buildLink(basePath, initialParams, { q: value, page: 1 })
      router.push(href, { scroll: false })
    }, 400)
  }

  /* ------------------------- Sortable headers --------------------------- */
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

  /* ------------------------ Column definitions -------------------------- */
  const columns = React.useMemo<Column<RowType>[]>(() => {
    return [
      {
        key: 'title',
        header: sortableHeader('Title', 'title'),
        sortable: false,
        render: (v) => <span className='font-medium'>{v as string}</span>,
      },
      {
        key: 'type',
        header: sortableHeader('Type', 'type'),
        sortable: false,
        className: 'capitalize',
        render: (v) => v as string,
      },
      {
        key: 'candidate',
        header: sortableHeader('Candidate', 'candidate'),
        sortable: false,
        render: (v) => v as string,
      },
      {
        key: 'status',
        header: sortableHeader('Status', 'status'),
        sortable: false,
        render: (v) => <StatusBadge status={String(v)} />,
      },
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        render: (_v, row) => <RowActions row={row} />,
      },
    ]
  }, [sort, order, basePath, initialParams, search])

  /* ----------------------------- Render ---------------------------------- */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='title'
      filterValue={search}
      onFilterChange={handleSearchChange}
      bulkActions={bulkActions}
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}
