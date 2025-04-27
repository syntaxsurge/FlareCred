import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { getTeamMembersPage } from '@/lib/db/queries/team-members'
import { teamMembers, teams } from '@/lib/db/schema/core'

import { Settings } from './settings'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Query = Record<string, string | string[] | undefined>

function getParam(params: Query, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default async function TeamSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Query> | Query
}) {
  const params = (await searchParams) as Query

  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* --------------------------- Locate team -------------------------------- */
  const [membership] = await db
    .select({ teamId: teamMembers.teamId, role: teamMembers.role })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1)

  let teamId = membership?.teamId
  if (!teamId) {
    const [personal] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.creatorUserId, user.id))
      .limit(1)
    teamId = personal?.id
  }
  if (!teamId) throw new Error('Team not found')

  const [team] = await db
    .select({
      id: teams.id,
      planName: teams.planName,
      subscriptionPaidUntil: teams.subscriptionPaidUntil,
      did: teams.did,
    })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1)

  /* --------------------------- Query params ------------------------------ */
  const page = Math.max(1, Number(getParam(params, 'page') ?? '1'))

  const sizeRaw = Number(getParam(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const sort = getParam(params, 'sort') ?? 'joinedAt'
  const order = getParam(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (getParam(params, 'q') ?? '').trim()

  /* ---------------------------- Data fetch -------------------------------- */
  const { members, hasNext } = await getTeamMembersPage(
    teamId,
    page,
    pageSize,
    sort as 'name' | 'email' | 'role' | 'joinedAt',
    order as 'asc' | 'desc',
    searchTerm,
  )

  const rows = members.map((m) => ({
    id: m.id,
    name: m.name ?? '—',
    email: m.email,
    walletAddress: (m as any).walletAddress ?? null,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
  }))

  /* ------------------------ Build initialParams -------------------------- */
  const initialParams: Record<string, string> = {}
  const add = (k: string) => {
    const val = getParam(params, k)
    if (val) initialParams[k] = val
  }
  add('size')
  add('sort')
  add('order')
  if (searchTerm) initialParams['q'] = searchTerm

  const isOwner = membership?.role === 'owner'

  /* ------------------------------ View ----------------------------------- */
  return (
    <Settings
      team={team}
      rows={rows}
      isOwner={!!isOwner}
      page={page}
      hasNext={hasNext}
      pageSize={pageSize}
      sort={sort}
      order={order as 'asc' | 'desc'}
      searchQuery={searchTerm}
      basePath='/settings/team'
      initialParams={initialParams}
    />
  )
}