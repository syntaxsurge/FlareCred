import { asc, desc, eq, ilike, sql, and } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import {
  candidateCredentials,
  CredentialStatus,
  candidates,
} from '@/lib/db/schema/candidate'
import { issuers } from '@/lib/db/schema/issuer'

import type { StatusCounts } from '@/lib/types/candidate'
import type {
  PageResult,
  CandidateCredentialRow,
} from '@/lib/types/table-rows'

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

function buildOrderExpr(
  sort: 'title' | 'category' | 'status' | 'createdAt',
  order: 'asc' | 'desc',
) {
  const sortMap = {
    title: candidateCredentials.title,
    category: candidateCredentials.category,
    status: candidateCredentials.status,
    createdAt: candidateCredentials.createdAt,
  } as const
  const col = sortMap[sort] ?? candidateCredentials.createdAt
  return order === 'asc' ? asc(col) : desc(col)
}

/* -------------------------------------------------------------------------- */
/*                       Public Query Helpers                                 */
/* -------------------------------------------------------------------------- */

/**
 * Paginate the caller’s own credentials (candidate dashboard).
 */
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

  return getCandidateCredentialsSection(
    cand.id,
    page,
    pageSize,
    sort,
    order,
    searchTerm,
  )
}

/**
 * Paginate credentials by candidateId (used by recruiter & public profiles).
 */
export async function getCandidateCredentialsSection(
  candidateId: number,
  page: number,
  pageSize: number,
  sort: 'title' | 'category' | 'status' | 'createdAt',
  order: 'asc' | 'desc',
  searchTerm: string,
): Promise<PageResult<CandidateCredentialRow> & { statusCounts: StatusCounts }> {
  /* -------------------------- Status counts --------------------------- */
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

  /* -------------------------- WHERE clause ---------------------------- */
  let whereExpr: any = eq(candidateCredentials.candidateId, candidateId)
  if (searchTerm) {
    whereExpr = and(
      whereExpr,
      ilike(candidateCredentials.title, `%${searchTerm}%`),
    )
  }

  /* ------------------------------ Rows -------------------------------- */
  const offset = (page - 1) * pageSize
  const rowsRaw = await db
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
      vcJson: candidateCredentials.vcJson,
    })
    .from(candidateCredentials)
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
    .where(whereExpr)
    .orderBy(buildOrderExpr(sort, order))
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rowsRaw.length > pageSize
  if (hasNext) rowsRaw.pop()

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
    vcJson: r.vcJson ?? null,
  }))

  return { rows, hasNext, statusCounts: counts as StatusCounts }
}