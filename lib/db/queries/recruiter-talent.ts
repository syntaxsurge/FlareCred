import { and, asc, desc, ilike, or, sql } from 'drizzle-orm'

import { db } from '../drizzle'
import { candidates } from '../schema/candidate'
import { users } from '../schema/core'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type TalentRow = {
  id: number
  name: string | null
  email: string
  bio: string | null
  verified: number
  topScore: number | null
}

/* -------------------------------------------------------------------------- */
/*                             Paginated fetch                                */
/* -------------------------------------------------------------------------- */

export async function getTalentSearchPage(
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'email' | 'id' = 'name',
  order: 'asc' | 'desc' = 'asc',
  searchTerm = '',
  verifiedOnly = false,
  skillMin = 0,
  skillMax = 100,
): Promise<{ candidates: TalentRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* --------------------------- ORDER BY helper --------------------------- */
  const orderBy =
    sortBy === 'email'
      ? order === 'asc'
        ? asc(users.email)
        : desc(users.email)
      : sortBy === 'id'
        ? order === 'asc'
          ? asc(candidates.id)
          : desc(candidates.id)
        : /* default — name */
          order === 'asc'
          ? asc(users.name)
          : desc(users.name)

  /* ----------------------------- WHERE clause ---------------------------- */
  const filters: any[] = []

  if (searchTerm.trim().length > 0) {
    filters.push(
      or(
        ilike(users.name, `%${searchTerm}%`),
        ilike(users.email, `%${searchTerm}%`),
        ilike(candidates.bio, `%${searchTerm}%`),
      ),
    )
  }

  if (verifiedOnly) {
    filters.push(
      sql`EXISTS (
        SELECT 1
        FROM candidate_credentials cc
        WHERE cc.candidate_id = ${candidates.id}
          AND cc.verified
      )`,
    )
  }

  /* Skill‑score range */
  if (skillMin > 0) {
    filters.push(
      sql`${skillMin} <= (
        SELECT COALESCE(MAX(score), 0)
        FROM quiz_attempts qa
        WHERE qa.candidate_id = ${candidates.id}
          AND qa.pass = 1
      )`,
    )
  }
  if (skillMax < 100) {
    filters.push(
      sql`${skillMax} >= (
        SELECT COALESCE(MAX(score), 0)
        FROM quiz_attempts qa
        WHERE qa.candidate_id = ${candidates.id}
          AND qa.pass = 1
      )`,
    )
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined

  /* ------------------------------ Query ---------------------------------- */
  const rows = await db
    .select({
      id: candidates.id,
      name: users.name,
      email: users.email,
      bio: candidates.bio,
      verified: sql<number>`(
        SELECT COUNT(*)
        FROM candidate_credentials cc
        WHERE cc.candidate_id = ${candidates.id}
          AND cc.verified
      )`.as('verified'),
      topScore: sql<number | null>`(
        SELECT MAX(score)
        FROM quiz_attempts qa
        WHERE qa.candidate_id = ${candidates.id}
          AND qa.pass = 1
      )`.as('topScore'),
    })
    .from(candidates)
    .leftJoin(users, sql`${users.id} = ${candidates.userId}`)
    .where(whereClause as any)
    .orderBy(orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { candidates: rows as TalentRow[], hasNext }
}
