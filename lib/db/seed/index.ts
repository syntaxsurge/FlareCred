import { seedQuizzes } from './quiz'
import { seedStripe } from './stripe'
import { seedUserTeam } from './userTeam'

/**
 * Sequentially seed core user/team data (requires walletAddress column),
 * then parallel-seed Stripe products and quiz templates for faster execution.
 */
async function main() {
  try {
    /* Wallet-aware users & teams must exist before anything else */
    await seedUserTeam()

    /* The remaining seeds are independent — execute in parallel */
    await Promise.all([seedStripe(), seedQuizzes()])

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