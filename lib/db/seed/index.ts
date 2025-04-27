import { seedQuizzes } from './quiz'
import { seedUserTeam } from './userTeam'

/**
 * Sequentially seed core user/team data (requires walletAddress column),
 * then parallel-seed additional demo content.
 */
async function main() {
  try {
    /* Wallet-aware users & teams must exist before anything else */
    await seedUserTeam()

    /* Independent seeds (no Stripe) */
    await Promise.all([seedQuizzes()])

    console.log('All seeds completed successfully.')
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  } finally {
    console.log('Seed process finished. Exiting…')
    process.exit(0)
  }
}

main()