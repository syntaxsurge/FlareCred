import { eq, ilike, and, asc, desc } from 'drizzle-orm'

import { db } from '../drizzle'
import { candidateCredentials as credsT, CredentialStatus } from '../schema/candidate'
import { issuers as issuersT } from '../schema/issuer'

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
  createdAt: Date
}

/* -------------------------------------------------------------------------- */
/*                             Paginated fetch                                */
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

  /* --------------------------- ORDER BY helper --------------------------- */
  const secondary =
    sortBy === 'title'
      ? order === 'asc'
        ? asc(credsT.title)
        : desc(credsT.title)
      : sortBy === 'issuer'
        ? order === 'asc'
          ? asc(issuersT.name)
          : desc(issuersT.name)
        : sortBy === 'status'
          ? order === 'asc'
            ? asc(credsT.status)
            : desc(credsT.status)
          : sortBy === 'createdAt'
            ? order === 'asc'
              ? asc(credsT.createdAt)
              : desc(credsT.createdAt)
            : order === 'asc'
              ? asc(credsT.id)
              : desc(credsT.id)

  const orderByParts = verifiedFirst ? [desc(credsT.verified), secondary] : [secondary]

  /* ----------------------------- WHERE clause ---------------------------- */
  const where =
    searchTerm.trim().length === 0
      ? eq(credsT.candidateId, candidateId)
      : and(eq(credsT.candidateId, candidateId), ilike(credsT.title, `%${searchTerm}%`))

  /* ------------------------------ Query ---------------------------------- */
  const rows = await db
    .select({
      id: credsT.id,
      title: credsT.title,
      issuer: issuersT.name,
      status: credsT.status,
      verified: credsT.verified,
      fileUrl: credsT.fileUrl,
      createdAt: credsT.createdAt,
    })
    .from(credsT)
    .leftJoin(issuersT, eq(credsT.issuerId, issuersT.id))
    .where(where as any)
    .orderBy(...orderByParts)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { credentials: rows as RecruiterCredentialRow[], hasNext }
}
