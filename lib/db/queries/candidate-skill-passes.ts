import { eq, ilike, and } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { quizAttempts, skillQuizzes } from '@/lib/db/schema/candidate'
import type { SkillPassRow, PageResult } from '@/lib/types/tables'

import { buildOrderExpr, paginate } from './query-helpers'

/* -------------------------------------------------------------------------- */
/*                            Skill Passes Section                            */
/* -------------------------------------------------------------------------- */

export async function getCandidateSkillPassesSection(
  candidateId: number,
  page: number,
  pageSize: number,
  sort: 'quizTitle' | 'score' | 'createdAt' = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<PageResult<SkillPassRow>> {
  /* --------------------------- ORDER BY ---------------------------------- */
  const sortMap = {
    quizTitle: skillQuizzes.title,
    score: quizAttempts.score,
    createdAt: quizAttempts.createdAt,
  } as const
  const orderBy = buildOrderExpr(sortMap, sort, order)

  /* ---------------------------- WHERE ----------------------------------- */
  const whereExpr =
    searchTerm.trim().length === 0
      ? eq(quizAttempts.candidateId, candidateId)
      : and(
          eq(quizAttempts.candidateId, candidateId),
          ilike(skillQuizzes.title, `%${searchTerm.trim()}%`),
        )

  /* ----------------------------- Query ---------------------------------- */
  const baseQuery = db
    .select({
      id: quizAttempts.id,
      quizTitle: skillQuizzes.title,
      score: quizAttempts.score,
      maxScore: quizAttempts.maxScore,
      txHash: quizAttempts.vcIssuedId,
      vcJson: quizAttempts.vcJson,
      createdAt: quizAttempts.createdAt,
    })
    .from(quizAttempts)
    .innerJoin(skillQuizzes, eq(quizAttempts.quizId, skillQuizzes.id))
    .where(whereExpr as any)
    .orderBy(orderBy)

  const { rows, hasNext } = await paginate<SkillPassRow>(baseQuery as any, page, pageSize)

  return {
    rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    hasNext,
  }
}