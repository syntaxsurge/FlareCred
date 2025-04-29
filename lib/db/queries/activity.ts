import { eq, asc, desc, and, or, ilike } from 'drizzle-orm'

import { db } from '../drizzle'
import { activityLogs, ActivityType } from '../schema/core'
import type { ActivityLogRow } from '@/lib/types/table-rows'

/**
 * Fetch a page of activity logs with optional full-text search, pagination and sorting.
 */
export async function getActivityLogsPage(
  userId: number,
  page: number,
  pageSize = 10,
  sortBy: 'timestamp' | 'action' = 'timestamp',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ logs: ActivityLogRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* --------------------------- ORDER BY helper --------------------------- */
  const orderBy =
    sortBy === 'action'
      ? order === 'asc'
        ? asc(activityLogs.action)
        : desc(activityLogs.action)
      : order === 'asc'
        ? asc(activityLogs.timestamp)
        : desc(activityLogs.timestamp)

  /* ----------------------------- WHERE clause ---------------------------- */
  const baseWhere = eq(activityLogs.userId, userId)

  const whereClause =
    searchTerm.trim().length === 0
      ? baseWhere
      : and(
          baseWhere,
          or(
            ilike(activityLogs.action, `%${searchTerm}%`),
            ilike(activityLogs.ipAddress, `%${searchTerm}%`),
          ),
        )

  /* ------------------------------ Query ---------------------------------- */
  const rows = await db
    .select()
    .from(activityLogs)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize + 1) // fetch one extra to detect "next"
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  /* ------------------------- Shape conversion ---------------------------- */
  const logs: ActivityLogRow[] = rows.map((r) => ({
    id: r.id,
    type: r.action as ActivityType,
    ipAddress: r.ipAddress,
    timestamp:
      r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
  }))

  return { logs, hasNext }
}