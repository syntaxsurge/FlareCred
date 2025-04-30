import { and, eq } from 'drizzle-orm'

import { db } from '../drizzle'
import { users, teams, teamMembers } from '../schema'
import {
  candidates,
  candidateCredentials,
  CredentialCategory,
  CredentialStatus,
} from '../schema/candidate'
import { recruiterPipelines } from '../schema/recruiter'

/**
 * Seed core demo users (admin, candidate, issuer, recruiter), create personal placeholder
 * teams for each, add everyone to a shared "Test Team", and now:
 *   • create a Candidate profile with <b>five</b> default unverified credentials
 *   • create <b>five</b> sample Pipelines for the Recruiter to surface public job listings
 *
 * Wallet-only authentication means no passwords are stored.
 */
export async function seedUserTeam() {
  console.log('Seeding users, teams, candidate profile, credentials, and pipelines…')

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

  /* ====================================================================== */
  /*                    N E W   D E M O   D A T A   B E L O W               */
  /* ====================================================================== */

  /* ---------- Candidate profile + credentials ---------- */
  const candidateUserId = ids.get('candidate@test.com')!
  let [cand] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.userId, candidateUserId))
    .limit(1)

  if (!cand) {
    ;[cand] = await db
      .insert(candidates)
      .values({ userId: candidateUserId, bio: 'Motivated developer seeking new challenges.' })
      .returning()
    console.log('✅ Created Candidate profile for Test Candidate')
  } else {
    console.log('ℹ️ Candidate profile already present')
  }

  const existingCreds = await db
    .select({ title: candidateCredentials.title })
    .from(candidateCredentials)
    .where(eq(candidateCredentials.candidateId, cand.id))

  const presentTitles = new Set(existingCreds.map((c) => c.title))

  const DEMO_CREDENTIALS = [
    {
      title: 'B.Sc. in Computer Science',
      category: CredentialCategory.EDUCATION,
      type: 'degree',
    },
    {
      title: 'Certified Kubernetes Administrator',
      category: CredentialCategory.CERTIFICATION,
      type: 'certification',
    },
    {
      title: '3 Years Experience as Backend Developer',
      category: CredentialCategory.EXPERIENCE,
      type: 'experience',
    },
    {
      title: 'Hackathon Winner: FlareCred 2024',
      category: CredentialCategory.AWARD,
      type: 'award',
    },
    {
      title: 'Open-Source Contribution: Awesome-Repo',
      category: CredentialCategory.PROJECT,
      type: 'github_repo',
    },
  ] as const

  const credInserts = DEMO_CREDENTIALS.filter((c) => !presentTitles.has(c.title)).map((c) => ({
    candidateId: cand.id,
    category: c.category,
    title: c.title,
    type: c.type,
    status: CredentialStatus.UNVERIFIED,
    verified: false,
    proofType: '',
    proofData: '',
  }))

  if (credInserts.length) {
    await db.insert(candidateCredentials).values(credInserts)
    console.log(`➕  Inserted ${credInserts.length} demo credential(s) for Test Candidate`)
  } else {
    console.log('ℹ️ Demo credentials already seeded for Candidate')
  }

  /* ---------- Recruiter pipelines (job openings) ---------- */
  const recruiterUserId = ids.get('recruiter@test.com')!
  const existingPipes = await db
    .select({ name: recruiterPipelines.name })
    .from(recruiterPipelines)
    .where(eq(recruiterPipelines.recruiterId, recruiterUserId))

  if (existingPipes.length === 0) {
    const PIPELINES = [
      {
        recruiterId: recruiterUserId,
        name: 'Backend Engineer – May 2025',
        description: 'Building scalable Node.js services on FlareCred.',
      },
      {
        recruiterId: recruiterUserId,
        name: 'Frontend Engineer – May 2025',
        description: 'React / Next.js role crafting modern UIs for credentialing.',
      },
      {
        recruiterId: recruiterUserId,
        name: 'Full-Stack Engineer – May 2025',
        description: 'End-to-end development across our TypeScript stack.',
      },
      {
        recruiterId: recruiterUserId,
        name: 'DevOps Engineer – May 2025',
        description: 'CI/CD, Kubernetes and cloud infrastructure automation.',
      },
      {
        recruiterId: recruiterUserId,
        name: 'QA Engineer – May 2025',
        description: 'Automated testing to ensure product quality and reliability.',
      },
    ]
    await db.insert(recruiterPipelines).values(PIPELINES)
    console.log(`✅ Seeded ${PIPELINES.length} recruiter pipelines for demo jobs`)
  } else {
    console.log('ℹ️ Recruiter pipelines already exist')
  }

  console.log('🎉 User/Team/Candidate/Pipeline seeding complete.')
}