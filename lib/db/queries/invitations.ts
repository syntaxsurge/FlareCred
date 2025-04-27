import { asc, desc, eq, ilike, or, and } from 'drizzle-orm'

import { db } from '../drizzle'
import { invitations as invT, teams as teamsT, users as usersT } from '../schema/core'

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
        ? asc(teamsT.name)
        : desc(teamsT.name)
      : sortBy === 'role'
        ? order === 'asc'
          ? asc(invT.role)
          : desc(invT.role)
        : sortBy === 'inviter'
          ? order === 'asc'
            ? asc(usersT.email)
            : desc(usersT.email)
          : sortBy === 'status'
            ? order === 'asc'
              ? asc(invT.status)
              : desc(invT.status)
            : order === 'asc'
              ? asc(invT.invitedAt)
              : desc(invT.invitedAt)

  /* ------------------------------ WHERE ---------------------------------- */
  const baseWhere = eq(invT.email, email)

  const whereClause =
    searchTerm.trim().length === 0
      ? baseWhere
      : and(
          baseWhere,
          or(
            ilike(teamsT.name, `%${searchTerm}%`),
            ilike(invT.role, `%${searchTerm}%`),
            ilike(usersT.email, `%${searchTerm}%`),
            ilike(invT.status, `%${searchTerm}%`),
          ),
        )

  /* ------------------------------ QUERY ---------------------------------- */
  const rows = await db
    .select({
      id: invT.id,
      team: teamsT.name,
      role: invT.role,
      inviter: usersT.email,
      status: invT.status,
      invitedAt: invT.invitedAt,
    })
    .from(invT)
    .leftJoin(teamsT, eq(invT.teamId, teamsT.id))
    .leftJoin(usersT, eq(invT.invitedBy, usersT.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { invitations: rows as InvitationRow[], hasNext }
}
