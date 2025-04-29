import { asc, desc, ilike, or } from 'drizzle-orm'
import { sql } from 'drizzle-orm/sql'

/**
 * Build an ORDER BY expression from a keyed map of columns.
 */
export function buildOrderExpr<T extends Record<string, any>>(
  sortMap: T,
  sortKey: string,
  direction: 'asc' | 'desc' = 'asc',
) {
  const col = (sortMap as Record<string, any>)[sortKey] ?? Object.values(sortMap)[0]
  return direction === 'asc' ? asc(col) : desc(col)
}

/**
 * Build a full-text ILIKE search condition across multiple columns.
 */
export function buildSearchCondition(
  term: string,
  columns: any[],
): ReturnType<typeof ilike> | null {
  const t = term.trim()
  if (!t) return null
  const conds = columns.map((c) => ilike(c, `%${t}%`))
  return conds.reduce<ReturnType<typeof ilike> | null>((prev, cur) => (prev ? or(prev, cur) : cur))
}

/**
 * Apply LIMIT/OFFSET pagination and return rows + hasNext flag.
 */
export async function paginate<T>(
  q: ReturnType<typeof sql>,
  page: number,
  pageSize: number,
): Promise<{ rows: T[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize
  const rows: T[] = await q.limit(pageSize + 1).offset(offset)
  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()
  return { rows, hasNext }
}