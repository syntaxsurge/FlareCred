import { asc, desc, eq, ilike, or } from 'drizzle-orm'

import { db } from '../drizzle'
import { users } from '../schema/core'
import { issuers } from '../schema/issuer'

export type AdminIssuerRow = {
  id: number
  name: string
  domain: string
  owner: string | null
  category: string
  industry: string
  status: string
}

/**
 * Return a page of issuers with full-text search, sorting and pagination.
 */
export async function getAdminIssuersPage(
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'domain' | 'owner' | 'category' | 'industry' | 'status' | 'id' = 'id',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ issuers: AdminIssuerRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* --------------------------- ORDER BY helper --------------------------- */
  const orderBy =
    sortBy === 'name'
      ? order === 'asc'
        ? asc(issuers.name)
        : desc(issuers.name)
      : sortBy === 'domain'
        ? order === 'asc'
          ? asc(issuers.domain)
          : desc(issuers.domain)
        : sortBy === 'owner'
          ? order === 'asc'
            ? asc(users.email)
            : desc(users.email)
          : sortBy === 'category'
            ? order === 'asc'
              ? asc(issuers.category)
              : desc(issuers.category)
            : sortBy === 'industry'
              ? order === 'asc'
                ? asc(issuers.industry)
                : desc(issuers.industry)
              : sortBy === 'status'
                ? order === 'asc'
                  ? asc(issuers.status)
                  : desc(issuers.status)
                : /* id fallback */ order === 'asc'
                  ? asc(issuers.id)
                  : desc(issuers.id)

  /* ----------------------------- WHERE clause ---------------------------- */
  const whereClause =
    searchTerm.trim().length === 0
      ? undefined
      : or(
          ilike(issuers.name, `%${searchTerm}%`),
          ilike(issuers.domain, `%${searchTerm}%`),
          ilike(users.email, `%${searchTerm}%`),
        )

  /* --------------------------- BASE SELECT ------------------------------- */
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

  /* Apply WHERE only when necessary to preserve accurate builder typing */
  const query = whereClause ? baseQuery.where(whereClause) : baseQuery

  /* ------------------------------ Query ---------------------------------- */
  const rows = await query.orderBy(orderBy).limit(pageSize + 1).offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { issuers: rows as AdminIssuerRow[], hasNext }
}