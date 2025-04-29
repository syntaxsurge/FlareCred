import { asc, desc, ilike, or } from 'drizzle-orm'

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
 */
export function buildSearchCondition(
  term: string,
  columns: any[],
): ReturnType<typeof ilike> | null {
  const t = term.trim()
  if (!t) return null

  /* Filter out falsy column refs then map to ILIKE conditions */
  const conditions = columns
    .filter(Boolean)
    .map((c) => ilike(c, `%${t}%`))

  if (conditions.length === 0) return null

  /* Reduce the array into a single OR-chained SQL condition */
  return conditions.reduce((prev, cur) => or(prev, cur))
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