import { asc, desc, eq, ilike, or } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  candidateCredentials,
  candidates,
  CredentialStatus,
} from '../schema/candidate'
import { users } from '../schema/core'
import { issuers } from '../schema/issuer'

export type AdminCredentialRow = {
  id: number
  title: string
  status: CredentialStatus
  candidate: string
  issuer: string | null
  proofType: string | null
  proofData: string | null
}

/**
 * Return a page of credentials with full-text search, sorting and pagination.
 */
export async function getAdminCredentialsPage(
  page: number,
  pageSize = 10,
  sortBy: 'title' | 'candidate' | 'issuer' | 'status' | 'id' = 'id',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ credentials: AdminCredentialRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* ---------------------------- ORDER BY ---------------------------- */
  const orderBy =
    sortBy === 'title'
      ? order === 'asc'
        ? asc(candidateCredentials.title)
        : desc(candidateCredentials.title)
      : sortBy === 'candidate'
        ? order === 'asc'
          ? asc(users.email)
          : desc(users.email)
        : sortBy === 'issuer'
          ? order === 'asc'
            ? asc(issuers.name)
            : desc(issuers.name)
          : sortBy === 'status'
            ? order === 'asc'
              ? asc(candidateCredentials.status)
              : desc(candidateCredentials.status)
            : /* id fallback */ order === 'asc'
              ? asc(candidateCredentials.id)
              : desc(candidateCredentials.id)

  /* ----------------------------- WHERE ----------------------------- */
  const whereExpr =
    searchTerm.trim().length === 0
      ? undefined
      : or(
          ilike(candidateCredentials.title, `%${searchTerm}%`),
          ilike(users.email, `%${searchTerm}%`),
          ilike(issuers.name, `%${searchTerm}%`),
        )

  /* --------------------------- BASE QUERY --------------------------- */
  const baseQuery = db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      status: candidateCredentials.status,
      candidate: users.email,
      issuer: issuers.name,
      proofType: candidateCredentials.proofType,
      proofData: candidateCredentials.proofData,
    })
    .from(candidateCredentials)
    .leftJoin(candidates, eq(candidateCredentials.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))

  /* Apply WHERE only when needed to preserve correct builder types */
  const query = whereExpr ? baseQuery.where(whereExpr) : baseQuery

  /* ------------------------------ RUN ------------------------------ */
  const rows = await query.orderBy(orderBy).limit(pageSize + 1).offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { credentials: rows as AdminCredentialRow[], hasNext }
}