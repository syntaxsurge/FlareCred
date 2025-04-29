import { eq, ilike, and, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { candidateCredentials } from '@/lib/db/schema/candidate'
import { issuers } from '@/lib/db/schema/issuer'

import type { StatusCounts } from '@/lib/types/candidate'
import type { CandidateCredentialRow, PageResult } from '@/lib/types/table-rows'

import { buildOrderExpr, paginate } from './query-helpers'

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
): Promise<PageResult<CandidateCredentialRow> & { statusCounts: StatusCounts }> {
  const term = searchTerm.trim().toLowerCase()
  const hasSearch = term.length > 0

  /* ----------------------------- ORDER BY ------------------------------ */
  const sortCols = {
    title: candidateCredentials.title,
    issuer: issuers.name,
    status: candidateCredentials.status,
    createdAt: candidateCredentials.createdAt,
  } as const
  const orderBy = buildOrderExpr(sortCols, sort, order)

  /* -------------------------- WHERE clause ---------------------------- */
  const whereExpr =
    hasSearch
      ? and(
          eq(candidateCredentials.candidateId, candidateId),
          ilike(candidateCredentials.title, `%${term}%`),
        )
      : eq(candidateCredentials.candidateId, candidateId)

  /* ------------------------------ Rows -------------------------------- */
  const baseQuery = db
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
    .where(whereExpr as any)
    .orderBy(orderBy)

  const { rows, hasNext } = await paginate<CandidateCredentialRow>(
    baseQuery as any,
    page,
    pageSize,
  )

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
    rows: rows as CandidateCredentialRow[],
    hasNext,
    statusCounts,
  }
}