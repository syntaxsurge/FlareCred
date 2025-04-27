import { asc, desc, eq, ilike, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { candidateCredentials, type CredentialStatus } from '@/lib/db/schema/candidate'
import { issuers } from '@/lib/db/schema/issuer'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface CandidateCredentialRow {
  id: number
  title: string
  issuer: string | null
  status: CredentialStatus
  fileUrl: string | null
}

export interface StatusCounts {
  verified: number
  pending: number
  rejected: number
  unverified: number
}

export interface CandidateCredentialsSection {
  rows: CandidateCredentialRow[]
  hasNext: boolean
  statusCounts: StatusCounts
}

/* -------------------------------------------------------------------------- */
/*                                 Helper                                     */
/* -------------------------------------------------------------------------- */

/**
 * Fetch a page of credentials for a candidate, default-sorted so that
 * ‘verified’ rows appear first (status DESC), and return a status summary.
 */
export async function getCandidateCredentialsSection(
  candidateId: number,
  page: number,
  pageSize: number,
  sort: 'title' | 'status' | 'createdAt' | 'issuer' = 'status',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<CandidateCredentialsSection> {
  const offset = (page - 1) * pageSize
  const term = searchTerm.trim().toLowerCase()
  const hasSearch = term.length > 0

  /* --------------------------- ORDER BY --------------------------------- */
  const sortCols = {
    title: candidateCredentials.title,
    issuer: issuers.name,
    status: candidateCredentials.status,
    createdAt: candidateCredentials.createdAt,
  } as const
  const sortCol = sortCols[sort] ?? candidateCredentials.status
  const orderExpr = order === 'asc' ? asc(sortCol) : desc(sortCol)

  /* --------------------------- WHERE CLAUSE ----------------------------- */
  const whereExpr = hasSearch ? ilike(candidateCredentials.title, `%${term}%`) : sql`TRUE`

  /* ------------------------------ Rows ---------------------------------- */
  const rowsRaw = await db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      issuer: issuers.name,
      status: candidateCredentials.status,
      fileUrl: candidateCredentials.fileUrl,
    })
    .from(candidateCredentials)
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
    .where(sql`${eq(candidateCredentials.candidateId, candidateId)} AND ${whereExpr}`)
    .orderBy(orderExpr)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rowsRaw.length > pageSize
  if (hasNext) rowsRaw.pop()

  /* -------------------------- Status counts ----------------------------- */
  const countsRaw = await db
    .select({
      status: candidateCredentials.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(candidateCredentials)
    .where(eq(candidateCredentials.candidateId, candidateId))
    .groupBy(candidateCredentials.status)

  const statusCounts: StatusCounts = {
    verified: 0,
    pending: 0,
    rejected: 0,
    unverified: 0,
  }
  countsRaw.forEach((r) => (statusCounts[r.status as keyof StatusCounts] = Number(r.count)))

  return {
    rows: rowsRaw as CandidateCredentialRow[],
    hasNext,
    statusCounts,
  }
}
