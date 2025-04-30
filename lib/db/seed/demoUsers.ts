import { db } from '../drizzle'
import { users, candidates, candidateCredentials } from '../schema'
import { CredentialCategory } from '../schema/candidate'

/* -------------------------------------------------------------------------- */
/*                            S A M P L E   D A T A                           */
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
/*                                S E E D E R                                 */
/* -------------------------------------------------------------------------- */

/**
 * Insert five demo candidate users and attach twelve placeholder credentials
 * to each profile for development / testing purposes.
 */
export async function seedDemoUsers() {
  console.log('Seeding demo users and credentials…')

  for (const demo of DEMO_USERS) {
    /* ----------------------------- User row ------------------------------ */
    const [user] = await db
      .insert(users)
      .values({
        name: demo.name,
        email: demo.email,
        walletAddress: demo.walletAddress,
        role: 'candidate',
      })
      .returning({ id: users.id })

    if (!user) {
      console.warn(`⚠️  Failed to insert user ${demo.email}; skipping…`)
      continue
    }

    /* --------------------------- Candidate row --------------------------- */
    const [cand] = await db
      .insert(candidates)
      .values({ userId: user.id })
      .returning({ id: candidates.id })

    if (!cand) {
      console.warn(`⚠️  Failed to create candidate for ${demo.email}; skipping…`)
      continue
    }

    /* ------------------------- Credential rows --------------------------- */
    const credentialRows = Array.from({ length: 12 }, (_, i) => ({
      candidateId: cand.id,
      category: CredentialCategory.OTHER,
      title: `Sample Credential ${i + 1}`,
      type: 'github_repo',
    }))

    await db.insert(candidateCredentials).values(credentialRows)

    console.log(
      `➕  Seeded user "${demo.email}" with ${credentialRows.length} credentials (id=${user.id})`,
    )
  }

  console.log('✅  Demo-user seeding complete.')
}