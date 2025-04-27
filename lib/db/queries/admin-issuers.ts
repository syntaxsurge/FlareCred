import { asc, desc, eq, ilike, or } from 'drizzle-orm'

import { db } from '../drizzle'
import { users as usersT } from '../schema/core'
import { issuers as issuersT } from '../schema/issuer'

export type AdminIssuerRow = {
  id: number
  name: string
  domain: string
  owner: string
  category: string
  industry: string
  status: string
}

/**
 * Return a page of issuers with full‑text search, sorting and pagination.
 */
export async function getAdminIssuersPage(
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'domain' | 'owner' | 'category' | 'industry' | 'status' | 'id' = 'id',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ issuers: AdminIssuerRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* --------------------------- ORDER BY helper --------------------------- */
  const orderBy =
    sortBy === 'name'
      ? order === 'asc'
        ? asc(issuersT.name)
        : desc(issuersT.name)
      : sortBy === 'domain'
        ? order === 'asc'
          ? asc(issuersT.domain)
          : desc(issuersT.domain)
        : sortBy === 'owner'
          ? order === 'asc'
            ? asc(usersT.email)
            : desc(usersT.email)
          : sortBy === 'category'
            ? order === 'asc'
              ? asc(issuersT.category)
              : desc(issuersT.category)
            : sortBy === 'industry'
              ? order === 'asc'
                ? asc(issuersT.industry)
                : desc(issuersT.industry)
              : sortBy === 'status'
                ? order === 'asc'
                  ? asc(issuersT.status)
                  : desc(issuersT.status)
                : order === 'asc'
                  ? asc(issuersT.id)
                  : desc(issuersT.id)

  /* ----------------------------- WHERE clause ---------------------------- */
  const where =
    searchTerm.trim().length === 0
      ? undefined
      : or(
          ilike(issuersT.name, `%${searchTerm}%`),
          ilike(issuersT.domain, `%${searchTerm}%`),
          ilike(usersT.email, `%${searchTerm}%`),
        )

  /* ------------------------------ Query ---------------------------------- */
  let q = db
    .select({
      id: issuersT.id,
      name: issuersT.name,
      domain: issuersT.domain,
      owner: usersT.email,
      category: issuersT.category,
      industry: issuersT.industry,
      status: issuersT.status,
    })
    .from(issuersT)
    .leftJoin(usersT, eq(issuersT.ownerUserId, usersT.id))

  if (where) q = q.where(where)

  const rows = await q
    .orderBy(orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { issuers: rows, hasNext }
}
