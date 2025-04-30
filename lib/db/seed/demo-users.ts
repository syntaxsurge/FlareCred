import { db } from '../drizzle'
import { users, candidates, candidateCredentials } from '../schema'
import { CredentialCategory } from '../schema/candidate'

/* -------------------------------------------------------------------------- */
/*                              D E M O   U S E R S                           */
/* -------------------------------------------------------------------------- */

const DEMO_USERS = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    walletAddress: '0x0000000000000000000000000000000000000001',
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    walletAddress: '0x0000000000000000000000000000000000000002',
  },
  {
    name: 'Charlie Lee',
    email: 'charlie@example.com',
    walletAddress: '0x0000000000000000000000000000000000000003',
  },
  {
    name: 'Dana Carter',
    email: 'dana@example.com',
    walletAddress: '0x0000000000000000000000000000000000000004',
  },
  {
    name: 'Evan Martinez',
    email: 'evan@example.com',
    walletAddress: '0x0000000000000000000000000000000000000005',
  },
] as const

/* -------------------------------------------------------------------------- */
/*                  S A M P L E   C R E D E N T I A L S                       */
/* -------------------------------------------------------------------------- */

const SAMPLE_CREDENTIALS = [
  {
    title: 'B.Sc. in Computer Science',
    category: CredentialCategory.EDUCATION,
    type: 'degree',
  },
  {
    title: 'M.Sc. in Software Engineering',
    category: CredentialCategory.EDUCATION,
    type: 'degree',
  },
  {
    title: 'AWS Certified Solutions Architect',
    category: CredentialCategory.CERTIFICATION,
    type: 'certification',
  },
  {
    title: 'Google Professional Cloud Architect',
    category: CredentialCategory.CERTIFICATION,
    type: 'certification',
  },
  {
    title: '3 Years Backend Developer at TechCorp',
    category: CredentialCategory.EXPERIENCE,
    type: 'experience',
  },
  {
    title: 'Lead Developer at InnovateX',
    category: CredentialCategory.EXPERIENCE,
    type: 'experience',
  },
  {
    title: 'Open-Source Contribution: React Router',
    category: CredentialCategory.PROJECT,
    type: 'github_repo',
  },
  {
    title: 'Full-Stack E-commerce Web App',
    category: CredentialCategory.PROJECT,
    type: 'project',
  },
  {
    title: 'Winner – Hackathon Asia 2024',
    category: CredentialCategory.AWARD,
    type: 'award',
  },
  {
    title: 'Published Paper on AI Optimisation',
    category: CredentialCategory.AWARD,
    type: 'award',
  },
  {
    title: 'Docker Certified Associate',
    category: CredentialCategory.CERTIFICATION,
    type: 'certification',
  },
  {
    title: 'Certified Kubernetes Administrator',
    category: CredentialCategory.CERTIFICATION,
    type: 'certification',
  },
] as const

/* -------------------------------------------------------------------------- */
/*                                S E E D E R                                 */
/* -------------------------------------------------------------------------- */

/**
 * Insert five demo candidate users and attach twelve varied credentials
 * (education, certifications, experience, projects and awards) to each.
 */
export async function seedDemoUsers() {
  console.log('Seeding demo users and credentials…')

  for (const demo of DEMO_USERS) {
    /* ----------------------------- User row ----------------------------- */
    const [user] = await db
      .insert(users)
      .values({
        name: demo.name,
        email: demo.email.toLowerCase(),
        walletAddress: demo.walletAddress,
        role: 'candidate',
      })
      .onConflictDoNothing()
      .returning({ id: users.id })

    if (!user) {
      console.warn(`⚠️  User ${demo.email} already exists; skipping user creation.`)
      continue
    }

    /* --------------------------- Candidate row -------------------------- */
    const [cand] = await db
      .insert(candidates)
      .values({ userId: user.id })
      .onConflictDoNothing()
      .returning({ id: candidates.id })

    if (!cand) {
      console.warn(`⚠️  Candidate profile for ${demo.email} already exists; skipping.`)
      continue
    }

    /* ------------------------- Credential rows -------------------------- */
    const credRows = SAMPLE_CREDENTIALS.map((c) => ({
      candidateId: cand.id,
      category: c.category,
      title: c.title,
      type: c.type,
    }))

    await db.insert(candidateCredentials).values(credRows)

    console.log(
      `➕  Seeded "${demo.email}" with ${credRows.length} credentials (candidateId=${cand.id})`,
    )
  }

  console.log('✅  Demo-user seeding complete.')
}