import { eq } from 'drizzle-orm'

import type { AdminIssuerRow } from '@/lib/types/tables'

import { db } from '../drizzle'
import { buildOrderExpr, buildSearchCondition, paginate } from './query-helpers'
import { users } from '../schema/core'
import { issuers } from '../schema/issuer'

/* -------------------------------------------------------------------------- */
/*                         A D M I N   I S S U E R S                          */
/* -------------------------------------------------------------------------- */

export async function getAdminIssuersPage(
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'domain' | 'owner' | 'category' | 'industry' | 'status' | 'id' = 'id',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ issuers: AdminIssuerRow[]; hasNext: boolean }> {
  /* --------------------------- ORDER BY -------------------------------- */
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

  /* ---------------------------- WHERE ---------------------------------- */
  const searchCond = buildSearchCondition(searchTerm, [issuers.name, issuers.domain, users.email])

  /* ----------------------------- QUERY --------------------------------- */
  const baseQuery = db
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

  const filteredQuery = searchCond ? baseQuery.where(searchCond) : baseQuery
  const orderedQuery = filteredQuery.orderBy(orderBy)

  /* --------------------------- PAGINATE ------------------------------- */
  const { rows, hasNext } = await paginate<AdminIssuerRow>(orderedQuery as any, page, pageSize)

  return { issuers: rows, hasNext }
}
