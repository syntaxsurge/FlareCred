import type { AdminUserRow } from '@/lib/types/tables'

import { db } from '../drizzle'
import { buildOrderExpr, buildSearchCondition, paginate } from './query-helpers'
import { users } from '../schema/core'

/* -------------------------------------------------------------------------- */
/*                        A D M I N   U S E R S                               */
/* -------------------------------------------------------------------------- */

export async function getAdminUsersPage(
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'email' | 'role' | 'createdAt' = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ users: AdminUserRow[]; hasNext: boolean }> {
  /* --------------------------- ORDER BY -------------------------------- */
  const sortMap = {
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  } as const

  const orderBy = buildOrderExpr(sortMap, sortBy, order)

  /* ---------------------------- WHERE ---------------------------------- */
  const searchCond = buildSearchCondition(searchTerm, [users.name, users.email])

  /* ----------------------------- QUERY --------------------------------- */
  const baseQuery = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)

  const filteredQuery = searchCond ? baseQuery.where(searchCond) : baseQuery
  const orderedQuery = filteredQuery.orderBy(orderBy)

  /* --------------------------- PAGINATE ------------------------------- */
  const { rows, hasNext } = await paginate<AdminUserRow>(orderedQuery as any, page, pageSize)

  return { users: rows, hasNext }
}
