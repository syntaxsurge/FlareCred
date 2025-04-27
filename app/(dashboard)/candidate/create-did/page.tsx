import { redirect } from 'next/navigation'

import { eq, sql } from 'drizzle-orm'
import { KeyRound } from 'lucide-react'

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import PageCard from '@/components/ui/page-card'
import { UserAvatar } from '@/components/ui/user-avatar'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { teamMembers, users as usersT } from '@/lib/db/schema/core'

import { CreateDidButton } from './create-did-button'

export const revalidate = 0

type Member = {
  id: number
  name: string | null
  email: string
}

const MAX_DISPLAY = 5

export default async function CreateDIDPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* ---------------- Membership & team ---------------- */
  const [membership] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1)

  let displayMembers: Member[] = []
  let teamSize = 1

  if (membership?.teamId) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, membership.teamId))
    teamSize = count

    const rows = await db
      .select({
        id: usersT.id,
        name: usersT.name,
        email: usersT.email,
      })
      .from(teamMembers)
      .innerJoin(usersT, eq(teamMembers.userId, usersT.id))
      .where(eq(teamMembers.teamId, membership.teamId))
      .limit(MAX_DISPLAY)

    displayMembers = rows.map((r) => ({ id: r.id, name: r.name, email: r.email }))
  }

  if (!displayMembers.some((m) => m.id === user.id)) {
    displayMembers.unshift({ id: user.id, name: user.name, email: user.email })
    displayMembers = displayMembers.slice(0, MAX_DISPLAY)
  }

  const overflow = Math.max(teamSize - displayMembers.length, 0)

  /* --------------------------- UI --------------------------- */
  return (
    <PageCard
      icon={KeyRound}
      title='Create your Team DID'
      description='Unlock verifiable credentials and sign them as a team.'
    >
      <div className='space-y-6'>
        {/* Avatars */}
        <div className='flex -space-x-3'>
          {displayMembers.map((member) => (
            <HoverCard key={member.id}>
              <HoverCardTrigger asChild>
                <UserAvatar
                  name={member.name}
                  email={member.email}
                  className='border-background ring-background size-10 cursor-pointer rounded-full border-2 shadow'
                />
              </HoverCardTrigger>
              <HoverCardContent className='w-48 text-sm'>
                {member.name ?? 'Unnamed'}
                <br />
                <span className='text-muted-foreground text-xs break-all'>{member.email}</span>
              </HoverCardContent>
            </HoverCard>
          ))}

          {overflow > 0 && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className='border-background bg-muted text-muted-foreground flex size-10 cursor-pointer items-center justify-center rounded-full border-2 text-xs font-medium'>
                  +{overflow}
                </div>
              </HoverCardTrigger>
              <HoverCardContent className='w-48 text-sm'>
                {overflow} more member{overflow > 1 ? 's' : ''}
              </HoverCardContent>
            </HoverCard>
          )}
        </div>

        <p className='text-sm leading-relaxed'>
          A Decentralised Identifier (DID) acts like a verified username for your company. Once
          created, your team can issue <span className='font-semibold'>signed</span> credentials
          that employers, clients, and platforms can trust instantly.
        </p>

        <CreateDidButton />
      </div>
    </PageCard>
  )
}
