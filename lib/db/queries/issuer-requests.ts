import { eq, and, sql } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  candidateCredentials,
  candidates,
  CredentialStatus,
} from '../schema/candidate'
import { users } from '../schema/core'

import {
  buildOrderExpr,
  buildSearchCondition,
  paginate,
} from './query-helpers'
import type { IssuerRequestRow } from '@/lib/types/table-rows'

/**
 * Fetch a paginated, searchable list of credential-verification requests
 * for a given issuer.
 */
export async function getIssuerRequestsPage(
  issuerId: number,
  page: number,
  pageSize = 10,
  sortBy: 'title' | 'type' | 'status' | 'candidate' = 'status',
  order: 'asc' | 'desc' = 'asc',
  searchTerm = '',
): Promise<{ requests: IssuerRequestRow[]; hasNext: boolean }> {
  /* --------------------------- ORDER BY -------------------------------- */
  const sortMap = {
    title: candidateCredentials.title,
    type: candidateCredentials.type,
    status: candidateCredentials.status,
    candidate: sql`coalesce(${users.name}, ${users.email})`,
  } as const

  const orderBy = buildOrderExpr(sortMap, sortBy, order)

  /* ---------------------------- WHERE ---------------------------------- */
  const searchCond = buildSearchCondition(searchTerm, [
    candidateCredentials.title,
    candidateCredentials.type,
    users.name,
    users.email,
  ])

  const whereClause = searchCond
    ? and(eq(candidateCredentials.issuerId, issuerId), searchCond)
    : eq(candidateCredentials.issuerId, issuerId)

  /* ----------------------------- QUERY --------------------------------- */
  const baseQuery = db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      type: candidateCredentials.type,
      status: candidateCredentials.status,
      candidateName: users.name,
      candidateEmail: users.email,
      proofType: candidateCredentials.proofType,
    })
    .from(candidateCredentials)
    .leftJoin(candidates, eq(candidateCredentials.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(whereClause as any)
    .orderBy(orderBy)

  const { rows, hasNext } = await paginate<any>(baseQuery as any, page, pageSize)

  const requests: IssuerRequestRow[] = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    candidate: r.candidateName ?? r.candidateEmail ?? 'Unknown',
    status: r.status as CredentialStatus,
    proofType: r.proofType,
  }))

  return { requests, hasNext }
}