import { eq } from 'drizzle-orm'

import type { AdminCredentialRow } from '@/lib/types/table-rows'

import { db } from '../drizzle'
import { buildOrderExpr, buildSearchCondition, paginate } from './query-helpers'
import { candidateCredentials, candidates } from '../schema/candidate'
import { users } from '../schema/core'
import { issuers } from '../schema/issuer'

/* -------------------------------------------------------------------------- */
/*                      A D M I N   C R E D E N T I A L S                     */
/* -------------------------------------------------------------------------- */

/**
 * Return a paginated, searchable slice of all candidate credentials for the admin
 * dashboard with flexible sorting.
 */
export async function getAdminCredentialsPage(
  page: number,
  pageSize = 10,
  sortBy: 'title' | 'candidate' | 'issuer' | 'status' | 'id' = 'id',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ credentials: AdminCredentialRow[]; hasNext: boolean }> {
  /* --------------------------- ORDER BY -------------------------------- */
  const sortMap = {
    title: candidateCredentials.title,
    candidate: users.email,
    issuer: issuers.name,
    status: candidateCredentials.status,
    id: candidateCredentials.id,
  } as const

  const orderBy = buildOrderExpr(sortMap, sortBy, order)

  /* ---------------------------- WHERE ---------------------------------- */
  const searchCond = buildSearchCondition(searchTerm, [
    candidateCredentials.title,
    users.email,
    issuers.name,
  ])

  /* ----------------------------- QUERY --------------------------------- */
  const baseQuery = db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      status: candidateCredentials.status,
      candidate: users.email,
      issuer: issuers.name,
      proofType: candidateCredentials.proofType,
      vcJson: candidateCredentials.vcJson,
    })
    .from(candidateCredentials)
    .leftJoin(candidates, eq(candidateCredentials.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))

  const filteredQuery = searchCond ? baseQuery.where(searchCond) : baseQuery
  const orderedQuery = filteredQuery.orderBy(orderBy)

  /* --------------------------- PAGINATE -------------------------------- */
  const { rows, hasNext } = await paginate<AdminCredentialRow>(orderedQuery as any, page, pageSize)

  return { credentials: rows, hasNext }
}
