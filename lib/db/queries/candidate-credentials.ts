import { eq, ilike, and, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { candidateCredentials, CredentialStatus, candidates } from '@/lib/db/schema/candidate'
import { issuers } from '@/lib/db/schema/issuer'
import type { StatusCounts } from '@/lib/types/candidate'
import type { PageResult, CandidateCredentialRow } from '@/lib/types/tables'

import { buildOrderExpr, paginate } from './query-helpers'

/* -------------------------------------------------------------------------- */
/*                       Public Query Helpers                                 */
/* -------------------------------------------------------------------------- */

export async function getCandidateCredentialsPage(
  userId: number,
  page: number,
  pageSize: number,
  sort: 'title' | 'category' | 'status' | 'createdAt',
  order: 'asc' | 'desc',
  searchTerm: string,
): Promise<PageResult<CandidateCredentialRow> & { statusCounts: StatusCounts }> {
  const [cand] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(eq(candidates.userId, userId))
    .limit(1)

  if (!cand)
    return {
      rows: [],
      hasNext: false,
      statusCounts: {
        verified: 0,
        pending: 0,
        rejected: 0,
        unverified: 0,
      },
    }

  return getCandidateCredentialsSection(cand.id, page, pageSize, sort, order, searchTerm)
}

export async function getCandidateCredentialsSection(
  candidateId: number,
  page: number,
  pageSize: number,
  sort: 'title' | 'category' | 'status' | 'createdAt',
  order: 'asc' | 'desc',
  searchTerm: string,
): Promise<PageResult<CandidateCredentialRow> & { statusCounts: StatusCounts }> {
  const [counts] = await db
    .select({
      verified:
        sql<number>`SUM(CASE WHEN ${candidateCredentials.status} = 'verified' THEN 1 ELSE 0 END)`.as(
          'verified',
        ),
      pending:
        sql<number>`SUM(CASE WHEN ${candidateCredentials.status} = 'pending' THEN 1 ELSE 0 END)`.as(
          'pending',
        ),
      rejected:
        sql<number>`SUM(CASE WHEN ${candidateCredentials.status} = 'rejected' THEN 1 ELSE 0 END)`.as(
          'rejected',
        ),
      unverified:
        sql<number>`SUM(CASE WHEN ${candidateCredentials.status} = 'unverified' THEN 1 ELSE 0 END)`.as(
          'unverified',
        ),
    })
    .from(candidateCredentials)
    .where(eq(candidateCredentials.candidateId, candidateId))

  const sortMap = {
    title: candidateCredentials.title,
    category: candidateCredentials.category,
    status: candidateCredentials.status,
    createdAt: candidateCredentials.createdAt,
  } as const
  const orderBy = buildOrderExpr(sortMap, sort, order)

  const whereExpr =
    searchTerm.trim().length === 0
      ? eq(candidateCredentials.candidateId, candidateId)
      : and(
          eq(candidateCredentials.candidateId, candidateId),
          ilike(candidateCredentials.title, `%${searchTerm}%`),
        )

  const baseQuery = db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      category: candidateCredentials.category,
      type: candidateCredentials.type,
      issuer: issuers.name,
      status: candidateCredentials.status,
      fileUrl: candidateCredentials.fileUrl,
      proofType: candidateCredentials.proofType,
      proofData: candidateCredentials.proofData,
      txHash: candidateCredentials.txHash,
      vcJson: candidateCredentials.vcJson,
    })
    .from(candidateCredentials)
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
    .where(whereExpr as any)
    .orderBy(orderBy)

  const { rows: rowsRaw, hasNext } = await paginate<CandidateCredentialRow>(
    baseQuery as any,
    page,
    pageSize,
  )

  const rows: CandidateCredentialRow[] = rowsRaw.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    type: r.type,
    issuer: r.issuer ?? null,
    status: r.status as CredentialStatus,
    fileUrl: r.fileUrl ?? null,
    proofType: r.proofType ?? null,
    proofData: r.proofData ?? null,
    txHash: r.txHash ?? null,
    vcJson: r.vcJson ?? null,
  }))

  return { rows, hasNext, statusCounts: counts as StatusCounts }
}