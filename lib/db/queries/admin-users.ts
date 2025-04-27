import { asc, desc, ilike, or } from 'drizzle-orm'

import { db } from '../drizzle'
import { users } from '../schema/core'

export type AdminUserRow = {
  id: number
  name: string | null
  email: string
  role: string
  createdAt: Date
}

/**
 * Return a page of users with optional full‑text search, sorting and pagination.
 */
export async function getAdminUsersPage(
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'email' | 'role' | 'createdAt' = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ users: AdminUserRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* --------------------------- ORDER BY helper --------------------------- */
  const orderBy =
    sortBy === 'name'
      ? order === 'asc'
        ? asc(users.name)
        : desc(users.name)
      : sortBy === 'email'
        ? order === 'asc'
          ? asc(users.email)
          : desc(users.email)
        : sortBy === 'role'
          ? order === 'asc'
            ? asc(users.role)
            : desc(users.role)
          : order === 'asc'
            ? asc(users.createdAt)
            : desc(users.createdAt)

  /* ----------------------------- WHERE clause ---------------------------- */
  const whereClause =
    searchTerm.trim().length === 0
      ? null
      : or(ilike(users.name, `%${searchTerm}%`), ilike(users.email, `%${searchTerm}%`))

  /* ------------------------------ Query ---------------------------------- */
  let q = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)

  if (whereClause) q = q.where(whereClause)

  const rows = await q
    .orderBy(orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { users: rows, hasNext }
}
