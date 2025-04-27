import { asc, desc, eq, ilike, sql, and } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { candidateCredentials, CredentialStatus, candidates } from '@/lib/db/schema/candidate'
import { issuers } from '@/lib/db/schema/issuer'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

/** Row shape consumed by recruiter & candidate credential tables */
export interface CredentialRow {
  id: number
  title: string
  category: string
  /** Fine-grained credential sub-type (e.g. 'bachelor', 'github_repo') */
  type: string
  issuer: string | null
  status: CredentialStatus
  fileUrl: string | null
  /** VC JSON is not required by all consumers but kept for completeness. */
  vcJson?: string | null
}

export interface PageResult<T> {
  rows: T[]
  hasNext: boolean
}

/* Status counter object expected by profile views */
export interface StatusCounts {
  verified: number
  pending: number
  rejected: number
  unverified: number
}

/* -------------------------------------------------------------------------- */
/*                          H E L P E R   F U N C T I O N S                   */
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
/*                   P U B L I C   Q U E R Y   H E L P E R S                  */
/* -------------------------------------------------------------------------- */

/**
 * Paginate the caller’s own credentials (candidate dashboard)
 */
export async function getCandidateCredentialsPage(
  userId: number,
  page: number,
  pageSize: number,
  sort: 'title' | 'category' | 'status' | 'createdAt',
  order: 'asc' | 'desc',
  searchTerm: string,
): Promise<PageResult<CredentialRow>> {
  /* Resolve candidate id first */
  const [cand] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(eq(candidates.userId, userId))
    .limit(1)

  if (!cand) return { rows: [], hasNext: false }

  return getCandidateCredentialsSection(cand.id, page, pageSize, sort, order, searchTerm)
}

/**
 * Paginate credentials by candidateId (used by recruiter & public profiles)
 */
export async function getCandidateCredentialsSection(
  candidateId: number,
  page: number,
  pageSize: number,
  sort: 'title' | 'category' | 'status' | 'createdAt',
  order: 'asc' | 'desc',
  searchTerm: string,
): Promise<PageResult<CredentialRow> & { statusCounts: StatusCounts }> {
  /* ----------------------------- Status counts --------------------------- */
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

  /* ----------------------------- Base where ------------------------------ */
  let whereExpr: any = eq(candidateCredentials.candidateId, candidateId)
  if (searchTerm) {
    whereExpr = and(whereExpr, ilike(candidateCredentials.title, `%${searchTerm}%`))
  }

  /* ----------------------------- Fetch rows ----------------------------- */
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

  const rows: CredentialRow[] = rowsRaw.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    type: r.type,
    issuer: r.issuer ?? null,
    status: r.status as CredentialStatus,
    fileUrl: r.fileUrl ?? null,
    vcJson: r.vcJson ?? null,
  }))

  return { rows, hasNext, statusCounts: counts }
}
