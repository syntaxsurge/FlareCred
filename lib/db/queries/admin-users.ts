import { db } from '../drizzle'
import { users } from '../schema/core'

import {
  buildOrderExpr,
  buildSearchCondition,
  paginate,
} from './query-helpers'
import type { AdminUserRow } from '@/lib/types/table-rows'

export async function getAdminUsersPage(
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'email' | 'role' | 'createdAt' = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ users: AdminUserRow[]; hasNext: boolean }> {
  /* ------------------- Column maps -------------------- */
  const sortMap = {
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  } as const

  const orderBy = buildOrderExpr(sortMap, sortBy, order)
  const searchCond = buildSearchCondition(searchTerm, [users.name, users.email])

  /* ------------------- Base SELECT -------------------- */
  let query = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(orderBy)

  if (searchCond) query = query.where(searchCond)

  /* ------------------ Pagination ---------------------- */
  const { rows, hasNext } = await paginate<AdminUserRow>(query as any, page, pageSize)
  return { users: rows, hasNext }
}