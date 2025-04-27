import { asc, desc, eq, ilike, or, and } from 'drizzle-orm'

import { db } from '../drizzle'
import { teamMembers, users } from '../schema/core'

export type TeamMemberRow = {
  id: number
  name: string | null
  email: string
  role: string
  joinedAt: Date
}

/**
 * Return a single page of team members with optional search, sorting and pagination.
 */
export async function getTeamMembersPage(
  teamId: number,
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'email' | 'role' | 'joinedAt' = 'joinedAt',
  order: 'asc' | 'desc' = 'asc',
  searchTerm = '',
): Promise<{ members: TeamMemberRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* ----------------------------- ORDER BY -------------------------------- */
  const orderBy =
    sortBy === 'name'
      ? order === 'asc'
        ? asc(users.name)
        : desc(users.name)
      : sortBy === 'email'
        ? order === 'asc'
          ? asc(users.email)
          : desc(users.email)
        : sortBy === 'role'
          ? order === 'asc'
            ? asc(teamMembers.role)
            : desc(teamMembers.role)
          : order === 'asc'
            ? asc(teamMembers.joinedAt)
            : desc(teamMembers.joinedAt)

  /* ------------------------------ WHERE ---------------------------------- */
  const baseWhere = eq(teamMembers.teamId, teamId)

  const whereClause =
    searchTerm.trim().length === 0
      ? baseWhere
      : and(
          baseWhere,
          or(
            ilike(users.name, `%${searchTerm}%`),
            ilike(users.email, `%${searchTerm}%`),
            ilike(teamMembers.role, `%${searchTerm}%`),
          ),
        )

  /* ------------------------------ QUERY ---------------------------------- */
  const rows = await db
    .select({
      id: teamMembers.id,
      name: users.name,
      email: users.email,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
    })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize + 1) // one extra row for hasNext detection
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { members: rows, hasNext }
}
