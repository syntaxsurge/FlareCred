import { asc, desc, eq, ilike, or } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  candidateCredentials as credsT,
  candidates as candT,
  CredentialStatus,
} from '../schema/candidate'
import { users as usersT } from '../schema/core'
import { issuers as issuersT } from '../schema/issuer'

export type AdminCredentialRow = {
  id: number
  title: string
  status: CredentialStatus
  candidate: string
  issuer: string | null
}

/**
 * Return a page of credentials with full‑text search, sorting and pagination.
 */
export async function getAdminCredentialsPage(
  page: number,
  pageSize = 10,
  sortBy: 'title' | 'candidate' | 'issuer' | 'status' | 'id' = 'id',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ credentials: AdminCredentialRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* ---------- order by ---------- */
  const orderBy =
    sortBy === 'title'
      ? order === 'asc'
        ? asc(credsT.title)
        : desc(credsT.title)
      : sortBy === 'candidate'
        ? order === 'asc'
          ? asc(usersT.email)
          : desc(usersT.email)
        : sortBy === 'issuer'
          ? order === 'asc'
            ? asc(issuersT.name)
            : desc(issuersT.name)
          : sortBy === 'status'
            ? order === 'asc'
              ? asc(credsT.status)
              : desc(credsT.status)
            : /* id fallback */ order === 'asc'
              ? asc(credsT.id)
              : desc(credsT.id)

  /* ---------- where ---------- */
  const where =
    searchTerm.trim().length === 0
      ? undefined
      : or(
          ilike(credsT.title, `%${searchTerm}%`),
          ilike(usersT.email, `%${searchTerm}%`),
          ilike(issuersT.name, `%${searchTerm}%`),
        )

  /* ---------- query ---------- */
  let q = db
    .select({
      id: credsT.id,
      title: credsT.title,
      status: credsT.status,
      candidate: usersT.email,
      issuer: issuersT.name,
    })
    .from(credsT)
    .leftJoin(candT, eq(credsT.candidateId, candT.id))
    .leftJoin(usersT, eq(candT.userId, usersT.id))
    .leftJoin(issuersT, eq(credsT.issuerId, issuersT.id))

  if (where) q = q.where(where)

  const rows = await q
    .orderBy(orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { credentials: rows, hasNext }
}
