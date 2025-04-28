import { and, eq } from 'drizzle-orm'

import { db } from '../drizzle'
import { users, teams, teamMembers } from '../schema'

/**
 * Seed core demo users (admin, candidate, issuer, recruiter), create personal placeholder
 * teams for each, and add everyone to a shared "Test Team” with the primary admin as owner.
 *
 * Wallet-only authentication means no passwords are stored.
 */
export async function seedUserTeam() {
  console.log('Seeding users and teams…')

  /* ---------- users to seed ---------- */
  const SEED = [
    {
      name: 'Platform Admin',
      email: 'admin@test.com',
      role: 'admin' as const,
      walletAddress: process.env.ADMIN_ADDRESS ?? '0x000000000000000000000000000000000000A001',
    },
    {
      name: 'Test Candidate',
      email: 'candidate@test.com',
      role: 'candidate' as const,
      walletAddress: '0x000000000000000000000000000000000000A002',
    },
    {
      name: 'Test Issuer',
      email: 'issuer@test.com',
      role: 'issuer' as const,
      walletAddress: '0x000000000000000000000000000000000000A003',
    },
    {
      name: 'Test Recruiter',
      email: 'recruiter@test.com',
      role: 'recruiter' as const,
      walletAddress: '0x000000000000000000000000000000000000A004',
    },
  ]

  const ids = new Map<string, number>() // email → id

  /* ---------- ensure users + placeholder teams (no membership) ---------- */
  for (const { name, email, role, walletAddress } of SEED) {
    const lowerEmail = email.toLowerCase()
    let [u] = await db.select().from(users).where(eq(users.email, lowerEmail)).limit(1)

    if (!u) {
      ;[u] = await db
        .insert(users)
        .values({ name, email: lowerEmail, role, walletAddress })
        .returning()
      console.log(`✅ Created user ${lowerEmail} (${name})`)
    } else {
      const updates: Partial<typeof users.$inferInsert> = {}
      if (u.name !== name) updates.name = name
      if (u.role !== role) updates.role = role
      if (u.walletAddress !== walletAddress) updates.walletAddress = walletAddress
      if (Object.keys(updates).length) {
        await db.update(users).set(updates).where(eq(users.id, u.id))
        console.log(`🔄 Updated user ${lowerEmail} →`, updates)
      } else {
        console.log(`ℹ️ User ${lowerEmail} exists`)
      }
    }
    ids.set(lowerEmail, u.id)

    const personalName = `${name}'s Team`
    const [existingTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.name, personalName))
      .limit(1)

    if (!existingTeam) {
      await db.insert(teams).values({ name: personalName, creatorUserId: u.id })
      console.log(`✅ Created placeholder team "${personalName}"`)
    } else {
      console.log(`ℹ️ Placeholder team for ${lowerEmail} exists`)
    }
  }

  /* ---------- shared Test Team ---------- */
  const adminId = ids.get('admin@test.com')!
  const sharedName = 'Test Team'

  let [shared] = await db.select().from(teams).where(eq(teams.name, sharedName)).limit(1)
  if (!shared) {
    ;[shared] = await db
      .insert(teams)
      .values({ name: sharedName, creatorUserId: adminId })
      .returning()
    console.log(`✅ Created shared team "${sharedName}"`)
  } else {
    console.log(`ℹ️ Shared team "${sharedName}" exists`)
  }

  /* ---------- add memberships ---------- */
  for (const { email } of SEED) {
    const userId = ids.get(email.toLowerCase())!
    const role = email.toLowerCase() === 'admin@test.com' ? 'owner' : 'member'

    const existing = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, shared.id), eq(teamMembers.userId, userId)))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(teamMembers).values({ teamId: shared.id, userId, role })
      console.log(`✅ Added ${email} to "${sharedName}" as ${role}`)
    }
  }

  console.log('🎉 Seed completed.')
}