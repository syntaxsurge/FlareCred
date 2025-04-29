import { asc, desc, eq, ilike, or, and } from 'drizzle-orm'

import { db } from '../drizzle'
import { invitations, teams, users } from '../schema/core'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type InvitationRow = {
  id: number
  team: string
  role: string
  inviter: string | null
  status: string
  invitedAt: Date
}

/* -------------------------------------------------------------------------- */
/*                                Main helper                                 */
/* -------------------------------------------------------------------------- */

/**
 * Return a page of invitations addressed to the given email with optional
 * full‑text search, sorting and pagination.
 */
export async function getInvitationsPage(
  email: string,
  page: number,
  pageSize = 10,
  sortBy: 'team' | 'role' | 'inviter' | 'status' | 'invitedAt' = 'invitedAt',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ invitations: InvitationRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* ----------------------------- ORDER BY -------------------------------- */
  const orderBy =
    sortBy === 'team'
      ? order === 'asc'
        ? asc(teams.name)
        : desc(teams.name)
      : sortBy === 'role'
        ? order === 'asc'
          ? asc(invitations.role)
          : desc(invitations.role)
        : sortBy === 'inviter'
          ? order === 'asc'
            ? asc(users.email)
            : desc(users.email)
          : sortBy === 'status'
            ? order === 'asc'
              ? asc(invitations.status)
              : desc(invitations.status)
            : order === 'asc'
              ? asc(invitations.invitedAt)
              : desc(invitations.invitedAt)

  /* ------------------------------ WHERE ---------------------------------- */
  const baseWhere = eq(invitations.email, email)

  const whereClause =
    searchTerm.trim().length === 0
      ? baseWhere
      : and(
          baseWhere,
          or(
            ilike(teams.name, `%${searchTerm}%`),
            ilike(invitations.role, `%${searchTerm}%`),
            ilike(users.email, `%${searchTerm}%`),
            ilike(invitations.status, `%${searchTerm}%`),
          ),
        )

  /* ------------------------------ QUERY ---------------------------------- */
  const rows = await db
    .select({
      id: invitations.id,
      team: teams.name,
      role: invitations.role,
      inviter: users.email,
      status: invitations.status,
      invitedAt: invitations.invitedAt,
    })
    .from(invitations)
    .leftJoin(teams, eq(invitations.teamId, teams.id))
    .leftJoin(users, eq(invitations.invitedBy, users.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { invitations: rows as InvitationRow[], hasNext }
}
