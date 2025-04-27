// same imports ─ unchanged
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getAddress } from 'ethers'

import { validatedAction, validatedActionWithUser } from '@/lib/auth/middleware'
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { getUser, getUserWithTeam } from '@/lib/db/queries/queries'
import {
  User,
  users,
  teams,
  teamMembers,
  activityLogs,
  type NewUser,
  type NewTeam,
  type NewTeamMember,
  type NewActivityLog,
  ActivityType,
  invitations,
} from '@/lib/db/schema'
import { createCheckoutSession } from '@/lib/payments/stripe'

/* -------------------------------------------------------------------------- */
/*                               H E L P E R S                                */
/* -------------------------------------------------------------------------- */

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/* -------------------------------------------------------------------------- */
/*                               A C T I V I T Y                              */
/* -------------------------------------------------------------------------- */

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string,
) {
  if (teamId === null || teamId === undefined) return
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || '',
  }
  await db.insert(activityLogs).values(newActivity)
}

/* -------------------------------------------------------------------------- */
/*                               S I G N  I N                                 */
/* -------------------------------------------------------------------------- */

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
})

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { password } = data
  const email = normalizeEmail(data.email)

  const userWithTeam = await db
    .select({ user: users, team: teams })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(users.email, email))
    .limit(1)

  if (userWithTeam.length === 0) {
    return { error: 'No account found for this email.', email }
  }

  const { user: foundUser, team: foundTeam } = userWithTeam[0]
  const isPasswordValid = await comparePasswords(password, foundUser.passwordHash)

  if (!isPasswordValid) {
    return { error: 'Invalid password. Please try again.', email }
  }

  await Promise.all([
    setSession(foundUser),
    logActivity(foundTeam?.id, foundUser.id, ActivityType.SIGN_IN),
  ])

  const redirectTo = formData.get('redirect') as string | null
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string
    return createCheckoutSession({ team: foundTeam, priceId })
  }

  redirect('/dashboard')
})

/* -------------------------------------------------------------------------- */
/*                               S I G N  U P                                 */
/* -------------------------------------------------------------------------- */

const signUpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  walletAddress: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid wallet address')
    .transform((addr) => getAddress(addr)), // checksum
  inviteId: z.string().optional(),
  role: z.enum(['candidate', 'recruiter', 'issuer']).optional(),
})

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { name, password, inviteId } = data
  const email = normalizeEmail(data.email)
  const walletAddress = data.walletAddress

  /* ------------------------------------------------------------------ */
  /*              E-Mail & Wallet duplication checks                    */
  /* ------------------------------------------------------------------ */
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existingUser.length > 0) {
    return { error: 'Email already registered.', email, password }
  }

  const existingWallet = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress))
    .limit(1)
  if (existingWallet.length > 0) {
    return { error: 'Wallet address already registered.', email, password }
  }

  /* ------------------------------------------------------------------ */
  /*                   Create user & personal team                       */
  /* ------------------------------------------------------------------ */
  const passwordHash = await hashPassword(password)
  const desiredRole = (data.role as 'candidate' | 'recruiter' | 'issuer' | undefined) ?? 'candidate'

  const newUser: NewUser = {
    name: name.trim(),
    email,
    passwordHash,
    role: desiredRole,
    walletAddress,
  }
  const [createdUser] = await db.insert(users).values(newUser).returning()
  if (!createdUser) {
    return { error: 'Failed to create user. Please try again.', email, password }
  }

  const personalTeamData: NewTeam = {
    name: `${email}'s Team`,
    creatorUserId: createdUser.id,
  }
  const [personalTeam] = await db.insert(teams).values(personalTeamData).returning()
  await db.insert(teamMembers).values({
    userId: createdUser.id,
    teamId: personalTeam.id,
    role: 'owner',
  } as NewTeamMember)
  await logActivity(personalTeam.id, createdUser.id, ActivityType.CREATE_TEAM)

  /* ------------------------------------------------------------------ */
  /*                 Handle invitation (optional)                       */
  /* ------------------------------------------------------------------ */
  if (inviteId) {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, parseInt(inviteId)),
          eq(invitations.email, email),
          eq(invitations.status, 'pending'),
        ),
      )
      .limit(1)

    if (!invitation) {
      return { error: 'Invalid or expired invitation.', email, password }
    }

    await db.insert(teamMembers).values({
      userId: createdUser.id,
      teamId: invitation.teamId,
      role: invitation.role,
    } as NewTeamMember)

    await Promise.all([
      db.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, invitation.id)),
      logActivity(invitation.teamId, createdUser.id, ActivityType.ACCEPT_INVITATION),
    ])
  }

  /* ------------------------------------------------------------------ */
  /*                     Session + conditional redirect                 */
  /* ------------------------------------------------------------------ */
  await setSession(createdUser)
  await logActivity(personalTeam.id, createdUser.id, ActivityType.SIGN_UP)

  const redirectTo = formData.get('redirect') as string | null
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string
    return createCheckoutSession({ team: personalTeam, priceId })
  }

  redirect('/dashboard')
})

/* -------------------------------------------------------------------------- */
/*                               S I G N  O U T                               */
/* -------------------------------------------------------------------------- */

export async function signOut() {
  const user = (await getUser()) as User
  const userWithTeam = await getUserWithTeam(user.id)
  await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_OUT)
  ;(await cookies()).delete('session')
}

/* -------------------------------------------------------------------------- */
/*                         A C C O U N T  S E T T I N G S                     */
/* -------------------------------------------------------------------------- */

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(100),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword } = data
    const isPasswordValid = await comparePasswords(currentPassword, user.passwordHash)

    if (!isPasswordValid) return { error: 'Current password is incorrect.' }
    if (currentPassword === newPassword) {
      return { error: 'New password must be different from the current password.' }
    }

    const newPasswordHash = await hashPassword(newPassword)
    const userWithTeam = await getUserWithTeam(user.id)

    await Promise.all([
      db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD),
    ])

    return { success: 'Password updated successfully.' }
  },
)

const deleteAccountSchema = z.object({ password: z.string().min(8).max(100) })

export const deleteAccount = validatedActionWithUser(deleteAccountSchema, async (data, _, user) => {
  const { password } = data
  const isPasswordValid = await comparePasswords(password, user.passwordHash)
  if (!isPasswordValid) return { error: 'Incorrect password. Account deletion failed.' }

  const userWithTeam = await getUserWithTeam(user.id)
  await logActivity(userWithTeam?.teamId, user.id, ActivityType.DELETE_ACCOUNT)

  // Soft-delete
  await db
    .update(users)
    .set({
      deletedAt: sql`CURRENT_TIMESTAMP`,
      email: sql`CONCAT(email, '-', id, '-deleted')`,
    })
    .where(eq(users.id, user.id))

  if (userWithTeam?.teamId) {
    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, userWithTeam.teamId)))
  }

  ;(await cookies()).delete('session')
  redirect('/sign-in')
})

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
})

export const updateAccount = validatedActionWithUser(updateAccountSchema, async (data, _, user) => {
  const { name, email } = data
  const userWithTeam = await getUserWithTeam(user.id)

  await Promise.all([
    db.update(users).set({ name, email }).where(eq(users.id, user.id)),
    logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT),
  ])

  return { success: 'Account updated successfully.' }
})

/* -------------------------------------------------------------------------- */
/*                         T E A M  M A N A G E M E N T                       */
/* -------------------------------------------------------------------------- */

const removeTeamMemberSchema = z.object({ memberId: z.coerce.number() })

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { memberId } = data
    const userWithTeam = await getUserWithTeam(user.id)
    if (!userWithTeam?.teamId) return { error: 'User is not part of a team' }

    const teamId = userWithTeam.teamId

    await db.transaction(async (tx) => {
      /* -------------------------------------------------------------- */
      /* Load the membership row to find the kicked user's ID           */
      /* -------------------------------------------------------------- */
      const [membership] = await tx
        .select()
        .from(teamMembers)
        .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, teamId)))
        .limit(1)

      if (!membership) throw new Error('Member not found or not in your team.')

      const kickedUserId = membership.userId

      /* -------------------------------------------------------------- */
      /* Remove the membership from the current team                    */
      /* -------------------------------------------------------------- */
      await tx.delete(teamMembers).where(eq(teamMembers.id, membership.id))

      /* -------------------------------------------------------------- */
      /* Ensure fallback personal team membership                       */
      /* -------------------------------------------------------------- */
      const [personalTeam] = await tx
        .select()
        .from(teams)
        .where(eq(teams.creatorUserId, kickedUserId))
        .limit(1)

      if (personalTeam) {
        const existingPersonal = await tx
          .select()
          .from(teamMembers)
          .where(and(eq(teamMembers.teamId, personalTeam.id), eq(teamMembers.userId, kickedUserId)))
          .limit(1)

        if (existingPersonal.length === 0) {
          await tx.insert(teamMembers).values({
            userId: kickedUserId,
            teamId: personalTeam.id,
            role: 'owner',
          })
        }
      }
    })

    await logActivity(teamId, user.id, ActivityType.REMOVE_TEAM_MEMBER)
    return { success: 'Team member removed successfully.' }
  },
)

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner']),
})

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data
    const userWithTeam = await getUserWithTeam(user.id)
    if (!userWithTeam?.teamId) return { error: 'User is not part of a team' }

    const existingMember = await db
      .select()
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(and(eq(users.email, email), eq(teamMembers.teamId, userWithTeam.teamId)))
      .limit(1)

    if (existingMember.length > 0) return { error: 'User is already a member of this team' }

    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.teamId, userWithTeam.teamId),
          eq(invitations.status, 'pending'),
        ),
      )
      .limit(1)

    if (existingInvitation.length > 0) return { error: 'An invitation has already been sent.' }

    await db.insert(invitations).values({
      teamId: userWithTeam.teamId,
      email,
      role,
      invitedBy: user.id,
      status: 'pending',
    })

    await logActivity(userWithTeam.teamId, user.id, ActivityType.INVITE_TEAM_MEMBER)

    // TODO: send invitation email
    return { success: 'Invitation sent successfully' }
  },
)