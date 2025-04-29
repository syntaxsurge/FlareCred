import { asc, desc, eq, ilike, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { candidateCredentials, type CredentialStatus } from '@/lib/db/schema/candidate'
import { issuers } from '@/lib/db/schema/issuer'

import type { StatusCounts } from '@/lib/types/candidate'
import type { CandidateCredentialRow, PageResult } from '@/lib/types/table-rows'

/* -------------------------------------------------------------------------- */
/*                               Return Type                                  */
/* -------------------------------------------------------------------------- */

export interface CandidateCredentialsSection
  extends PageResult<CandidateCredentialRow> {
  statusCounts: StatusCounts
}

/* -------------------------------------------------------------------------- */
/*                                  Query                                     */
/* -------------------------------------------------------------------------- */

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

  /* ----------------------------- ORDER BY ------------------------------ */
  const sortCols = {
    title: candidateCredentials.title,
    issuer: issuers.name,
    status: candidateCredentials.status,
    createdAt: candidateCredentials.createdAt,
  } as const
  const sortCol = sortCols[sort] ?? candidateCredentials.status
  const orderExpr = order === 'asc' ? asc(sortCol) : desc(sortCol)

  /* -------------------------- WHERE clause ---------------------------- */
  const whereExpr = hasSearch
    ? ilike(candidateCredentials.title, `%${term}%`)
    : sql`TRUE`

  /* ------------------------------ Rows -------------------------------- */
  const rowsRaw = await db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      issuer: issuers.name,
      status: candidateCredentials.status,
      fileUrl: candidateCredentials.fileUrl,
      proofType: candidateCredentials.proofType,
      proofData: candidateCredentials.proofData,
    })
    .from(candidateCredentials)
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
    .where(
      sql`${eq(candidateCredentials.candidateId, candidateId)} AND ${whereExpr}`,
    )
    .orderBy(orderExpr)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rowsRaw.length > pageSize
  if (hasNext) rowsRaw.pop()

  /* ------------------------- Status counts --------------------------- */
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
  countsRaw.forEach(
    (r) => (statusCounts[r.status as keyof StatusCounts] = Number(r.count)),
  )

  return {
    rows: rowsRaw as CandidateCredentialRow[],
    hasNext,
    statusCounts,
  }
}