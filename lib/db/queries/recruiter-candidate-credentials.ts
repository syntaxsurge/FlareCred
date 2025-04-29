import { eq, ilike, and, asc, desc } from 'drizzle-orm'

import { db } from '../drizzle'
import { candidateCredentials, CredentialStatus } from '../schema/candidate'
import { issuers } from '../schema/issuer'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type RecruiterCredentialRow = {
  id: number
  title: string
  issuer: string | null
  status: CredentialStatus
  verified: boolean
  fileUrl: string | null
  proofType: string | null
  proofData: string | null
  createdAt: Date
}

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
  const offset = (page - 1) * pageSize

  /* --------------------------- ORDER BY helper --------------------------- */
  const secondary =
    sortBy === 'title'
      ? order === 'asc'
        ? asc(candidateCredentials.title)
        : desc(candidateCredentials.title)
      : sortBy === 'issuer'
        ? order === 'asc'
          ? asc(issuers.name)
          : desc(issuers.name)
        : sortBy === 'status'
          ? order === 'asc'
            ? asc(candidateCredentials.status)
            : desc(candidateCredentials.status)
          : sortBy === 'createdAt'
            ? order === 'asc'
              ? asc(candidateCredentials.createdAt)
              : desc(candidateCredentials.createdAt)
            : order === 'asc'
              ? asc(candidateCredentials.id)
              : desc(candidateCredentials.id)

  const orderByParts = verifiedFirst ? [desc(candidateCredentials.verified), secondary] : [secondary]

  /* ----------------------------- WHERE clause ---------------------------- */
  const where =
    searchTerm.trim().length === 0
      ? eq(candidateCredentials.candidateId, candidateId)
      : and(eq(candidateCredentials.candidateId, candidateId), ilike(candidateCredentials.title, `%${searchTerm}%`))

  /* ------------------------------ Query ---------------------------------- */
  const rows = await db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
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
    .orderBy(...orderByParts)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { credentials: rows as RecruiterCredentialRow[], hasNext }
}