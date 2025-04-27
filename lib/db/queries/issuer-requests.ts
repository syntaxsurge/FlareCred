import { asc, desc, eq, ilike, or, and, sql } from 'drizzle-orm'

import { db } from '../drizzle'
import { candidateCredentials, candidates, CredentialStatus } from '../schema/candidate'
import { users } from '../schema/core'

export interface IssuerRequestRow {
  id: number
  title: string
  type: string
  candidate: string
  status: CredentialStatus
}

/**
 * Fetch a paginated, searchable list of credential‑verification requests
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
  const offset = (page - 1) * pageSize

  /* --------------------------- ORDER BY helper --------------------------- */
  const sortMap = {
    title: candidateCredentials.title,
    type: candidateCredentials.type,
    status: candidateCredentials.status,
    candidate: sql`coalesce(${users.name}, ${users.email})`,
  } as const

  const orderExpr = order === 'asc' ? asc(sortMap[sortBy]) : desc(sortMap[sortBy])

  /* --------------------------- WHERE clause ------------------------------ */
  const baseWhere = eq(candidateCredentials.issuerId, issuerId)

  const whereClause =
    searchTerm.trim().length === 0
      ? baseWhere
      : and(
          baseWhere,
          or(
            ilike(candidateCredentials.title, `%${searchTerm}%`),
            ilike(candidateCredentials.type, `%${searchTerm}%`),
            ilike(users.name, `%${searchTerm}%`),
            ilike(users.email, `%${searchTerm}%`),
          ),
        )

  /* --------------------------- Query ------------------------------------ */
  const rows = await db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      type: candidateCredentials.type,
      status: candidateCredentials.status,
      candidateName: users.name,
      candidateEmail: users.email,
    })
    .from(candidateCredentials)
    .leftJoin(candidates, eq(candidateCredentials.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(whereClause)
    .orderBy(orderExpr)
    .limit(pageSize + 1) // Fetch one extra to detect next page
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  const requests: IssuerRequestRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    candidate: r.candidateName ?? r.candidateEmail ?? 'Unknown',
    status: r.status as CredentialStatus,
  }))

  return { requests, hasNext }
}
