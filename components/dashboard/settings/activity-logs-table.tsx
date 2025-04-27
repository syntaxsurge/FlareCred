'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import {
  Settings,
  LogOut,
  UserPlus,
  UserCog,
  Lock,
  UserMinus,
  Mail,
  CheckCircle,
  ArrowUpDown,
  type LucideIcon,
} from 'lucide-react'

import { DataTable, type Column } from '@/components/ui/tables/data-table'
import { ActivityType } from '@/lib/db/schema'
import { relativeTime } from '@/lib/utils/time'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  type: ActivityType
  ipAddress?: string | null
  timestamp: string
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
/*                                Icons Map                                   */
/* -------------------------------------------------------------------------- */

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
}

/* -------------------------------------------------------------------------- */
/*                                    Util                                    */
/* -------------------------------------------------------------------------- */

function buildLink(basePath: string, init: Record<string, string>, overrides: Record<string, any>) {
  const sp = new URLSearchParams(init)
  Object.entries(overrides).forEach(([k, v]) => sp.set(k, String(v)))
  Array.from(sp.entries()).forEach(([k, v]) => {
    if (v === '') sp.delete(k) // tidy URL
  })
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'You signed up'
    case ActivityType.SIGN_IN:
      return 'You signed in'
    case ActivityType.SIGN_OUT:
      return 'You signed out'
    case ActivityType.UPDATE_PASSWORD:
      return 'You changed your password'
    case ActivityType.DELETE_ACCOUNT:
      return 'You deleted your account'
    case ActivityType.UPDATE_ACCOUNT:
      return 'You updated your account'
    case ActivityType.CREATE_TEAM:
      return 'You created a new team'
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'You removed a team member'
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'You invited a team member'
    case ActivityType.ACCEPT_INVITATION:
      return 'You accepted an invitation'
    default:
      return 'Unknown action'
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Table                                    */
/* -------------------------------------------------------------------------- */

export default function ActivityLogsTable({
  rows,
  sort,
  order,
  basePath,
  initialParams,
  searchQuery,
}: Props) {
  const router = useRouter()
  const [search, setSearch] = React.useState<string>(searchQuery)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  /* Trigger navigation (server‑side search) */
  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const href = buildLink(basePath, initialParams, { q: value, page: 1 })
      router.push(href, { scroll: false })
    }, 400)
  }

  /* Build sortable header link */
  const tsHeader = React.useMemo(() => {
    const nextOrder = sort === 'timestamp' && order === 'asc' ? 'desc' : 'asc'
    const href = buildLink(basePath, initialParams, {
      sort: 'timestamp',
      order: nextOrder,
      page: 1,
      q: search,
    })
    return (
      <Link href={href} scroll={false} className='flex items-center gap-1'>
        When <ArrowUpDown className='h-4 w-4' />
      </Link>
    )
  }, [basePath, initialParams, sort, order, search])

  const columns = React.useMemo<Column<RowType>[]>(() => {
    return [
      {
        key: 'id',
        header: '',
        enableHiding: false,
        sortable: false,
        className: 'w-[40px]',
        render: (_v, row) => {
          const Icon = iconMap[row.type] || Settings
          return (
            <div className='dark:bg-muted flex h-8 w-8 items-center justify-center rounded-full bg-orange-100'>
              <Icon className='dark:text-muted-foreground h-4 w-4 text-orange-500' />
            </div>
          )
        },
      },
      {
        key: 'type',
        header: 'Action',
        sortable: false,
        render: (_v, row) => (
          <p className='text-sm'>
            {formatAction(row.type)}
            {row.ipAddress && ` from IP ${row.ipAddress}`}
          </p>
        ),
      },
      {
        key: 'timestamp',
        header: tsHeader,
        sortable: false,
        className: 'min-w-[120px]',
        render: (v) => (
          <span className='text-muted-foreground text-xs'>
            {relativeTime(new Date(v as string))}
          </span>
        ),
      },
    ]
  }, [tsHeader])

  /* All rows fit on one client page; real paging handled server‑side */
  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='type'
      filterValue={search}
      onFilterChange={handleSearchChange}
      pageSize={rows.length}
      pageSizeOptions={[rows.length]}
      hidePagination
    />
  )
}
