import { seedQuizzes } from './quiz'
import { seedUserTeam } from './userTeam'

/**
 * Seeds wallet-centric demo data.
 *
 * 1. Create base users and their personal teams (requires walletAddress).
 * 2. Populate auxiliary data sets in parallel once the core entities exist.
 */
async function main() {
  try {
    /* ------------------------------------------------------------------ */
    /*                    Core users and personal teams                    */
    /* ------------------------------------------------------------------ */
    await seedUserTeam()

    /* ------------------------------------------------------------------ */
    /*                        Independent demo seeds                       */
    /* ------------------------------------------------------------------ */
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
