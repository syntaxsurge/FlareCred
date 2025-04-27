import { PricingGrid } from '@/components/pricing/pricing-grid'
import { getUser, getTeamForUser } from '@/lib/db/queries/queries'

export const revalidate = 3600

export default async function PricingPage() {
  /* --------------------------------------------------------------- */
  /* Determine the current team plan (if signed in)                  */
  /* --------------------------------------------------------------- */
  const user = await getUser()
  let currentPlanName: string | null = null

  if (user) {
    const team = await getTeamForUser(user.id)
    currentPlanName = team?.planName ?? 'Free'
  }

  return (
    <main className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
      <PricingGrid currentPlanName={currentPlanName} />
    </main>
  )
}
