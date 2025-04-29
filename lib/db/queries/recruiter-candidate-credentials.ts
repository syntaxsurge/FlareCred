import { eq, and, desc } from 'drizzle-orm'

import type { RecruiterCredentialRow } from '@/lib/types/table-rows'

import { db } from '../drizzle'
import { buildOrderExpr, buildSearchCondition, paginate } from './query-helpers'
import { candidateCredentials } from '../schema/candidate'
import { issuers } from '../schema/issuer'

/* -------------------------------------------------------------------------- */
/*                             Paginated fetch                                */
/* -------------------------------------------------------------------------- */

/**
 * Fetch a page of credentials for a candidate with optional search/sort.
 *
 * When `verifiedFirst` is true the result is additionally ordered with all
 * verified rows first (descending boolean), used for the default view.
 */
export async function getRecruiterCandidateCredentialsPage(
  candidateId: number,
  page: number,
  pageSize = 10,
  sortBy: 'title' | 'issuer' | 'status' | 'createdAt' | 'id' = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
  verifiedFirst = false,
): Promise<{ credentials: RecruiterCredentialRow[]; hasNext: boolean }> {
  /* --------------------------- ORDER BY helper --------------------------- */
  const sortMap = {
    title: candidateCredentials.title,
    issuer: issuers.name,
    status: candidateCredentials.status,
    createdAt: candidateCredentials.createdAt,
    id: candidateCredentials.id,
  } as const

  const secondary = buildOrderExpr(sortMap, sortBy, order)
  const orderByParts = verifiedFirst
    ? [desc(candidateCredentials.verified), secondary]
    : [secondary]

  /* ----------------------------- WHERE clause ---------------------------- */
  const searchCond = buildSearchCondition(searchTerm, [candidateCredentials.title])

  const where = searchCond
    ? and(eq(candidateCredentials.candidateId, candidateId), searchCond)
    : eq(candidateCredentials.candidateId, candidateId)

  /* ------------------------------ Query ---------------------------------- */
  const baseQuery = db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      category: candidateCredentials.category,
      issuer: issuers.name,
      status: candidateCredentials.status,
      verified: candidateCredentials.verified,
      fileUrl: candidateCredentials.fileUrl,
      proofType: candidateCredentials.proofType,
      proofData: candidateCredentials.proofData,
      createdAt: candidateCredentials.createdAt,
    })
    .from(candidateCredentials)
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
    .where(where as any)
    .orderBy(...(orderByParts as any))

  const { rows, hasNext } = await paginate<RecruiterCredentialRow>(baseQuery as any, page, pageSize)

  return { credentials: rows as RecruiterCredentialRow[], hasNext }
}
