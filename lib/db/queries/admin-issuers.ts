import { eq } from 'drizzle-orm'

import { db } from '../drizzle'
import { users } from '../schema/core'
import { issuers } from '../schema/issuer'

import {
  buildOrderExpr,
  buildSearchCondition,
  paginate,
} from './query-helpers'
import type { AdminIssuerRow } from '@/lib/types/table-rows'

export async function getAdminIssuersPage(
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'domain' | 'owner' | 'category' | 'industry' | 'status' | 'id' = 'id',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ issuers: AdminIssuerRow[]; hasNext: boolean }> {
  /* ------------------- Column maps -------------------- */
  const sortMap = {
    name: issuers.name,
    domain: issuers.domain,
    owner: users.email,
    category: issuers.category,
    industry: issuers.industry,
    status: issuers.status,
    id: issuers.id,
  } as const

  const orderBy = buildOrderExpr(sortMap, sortBy, order)
  const searchCond = buildSearchCondition(searchTerm, [
    issuers.name,
    issuers.domain,
    users.email,
  ])

  /* ------------------- Base SELECT -------------------- */
  let query = db
    .select({
      id: issuers.id,
      name: issuers.name,
      domain: issuers.domain,
      owner: users.email,
      category: issuers.category,
      industry: issuers.industry,
      status: issuers.status,
    })
    .from(issuers)
    .leftJoin(users, eq(issuers.ownerUserId, users.id))
    .orderBy(orderBy)

  if (searchCond) query = query.where(searchCond)

  /* ------------------ Pagination ---------------------- */
  const { rows, hasNext } = await paginate<AdminIssuerRow>(query as any, page, pageSize)
  return { issuers: rows, hasNext }
}