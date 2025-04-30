import { seedQuizzes }      from './quiz'
import { seedUserTeam }     from './userTeam'
import { seedPlanFeatures } from './planFeatures'
import { seedDemoUsers }    from './demoUsers'

/**
 * Seeds wallet-centric demo data plus plan features.
 */
async function main() {
  try {
    /* Core users + teams -------------------------------------------------- */
    await seedUserTeam()

    /* Demo users with credentials ---------------------------------------- */
    await seedDemoUsers()

    /* Auxiliary demo data ------------------------------------------------- */
    await Promise.all([seedQuizzes(), seedPlanFeatures()])

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