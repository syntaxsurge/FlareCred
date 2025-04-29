import { eq } from 'drizzle-orm'

import { db } from '../drizzle'
import { candidateCredentials, candidates } from '../schema/candidate'
import { users } from '../schema/core'
import { issuers } from '../schema/issuer'

import {
  buildOrderExpr,
  buildSearchCondition,
  paginate,
} from './query-helpers'
import type { AdminCredentialRow } from '@/lib/types/table-rows'

export async function getAdminCredentialsPage(
  page: number,
  pageSize = 10,
  sortBy: 'title' | 'candidate' | 'issuer' | 'status' | 'id' = 'id',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ credentials: AdminCredentialRow[]; hasNext: boolean }> {
  /* ------------------- Column maps -------------------- */
  const sortMap = {
    title: candidateCredentials.title,
    candidate: users.email,
    issuer: issuers.name,
    status: candidateCredentials.status,
    id: candidateCredentials.id,
  } as const

  const orderBy = buildOrderExpr(sortMap, sortBy, order)
  const searchCond = buildSearchCondition(searchTerm, [
    candidateCredentials.title,
    users.email,
    issuers.name,
  ])

  /* ------------------- Base SELECT -------------------- */
  let query = db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      status: candidateCredentials.status,
      candidate: users.email,
      issuer: issuers.name,
      proofType: candidateCredentials.proofType,
      proofData: candidateCredentials.proofData,
      vcJson: candidateCredentials.vcJson,
    })
    .from(candidateCredentials)
    .leftJoin(candidates, eq(candidateCredentials.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))

  if (searchCond) query = query.where(searchCond as any)

  query = query.orderBy(orderBy)

  /* ------------------ Pagination ---------------------- */
  const { rows, hasNext } = await paginate<AdminCredentialRow>(query as any, page, pageSize)
  return { credentials: rows, hasNext }
}