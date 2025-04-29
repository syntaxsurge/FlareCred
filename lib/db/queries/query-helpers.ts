import { asc, desc, ilike, or, type SQL } from 'drizzle-orm'

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
 * Returns `null` when the search term is blank or when no valid columns are provided.
 *
 * By asserting the first condition we guarantee the accumulator is always a
 * defined SQL object, preventing the `SQL | undefined` union that triggered
 * TS2322.
 */
export function buildSearchCondition(
  term: string,
  columns: any[],
): SQL<unknown> | null {
  const t = term.trim()
  if (!t) return null

  const conditions: SQL<unknown>[] = columns
    .filter(Boolean)
    .map((c) => ilike(c, `%${t}%`))

  if (conditions.length === 0) return null

  let combined: SQL<unknown> = conditions[0]!
  for (let i = 1; i < conditions.length; i++) {
    combined = or(combined, conditions[i])
  }
  return combined
}

/**
 * Apply LIMIT/OFFSET pagination and return rows with a hasNext flag.
 * The query builder type is intentionally broad to stay compatible with Drizzle’s builders.
 */
export async function paginate<T>(
  q: any,
  page: number,
  pageSize: number,
): Promise<{ rows: T[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize
  const rows: T[] = await q.limit(pageSize + 1).offset(offset)
  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()
  return { rows, hasNext }
}