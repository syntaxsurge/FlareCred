import { asc, eq } from 'drizzle-orm'
import { Tag } from 'lucide-react'

import PageCard from '@/components/ui/page-card'
import { subscriptionManager } from '@/lib/contracts'
import { db } from '@/lib/db/drizzle'
import { planFeatures } from '@/lib/db/schema/pricing'

import UpdatePlanFeaturesForm from './update-plan-features-form'
import UpdatePlanPricesForm from './update-plan-prices-form'

export const revalidate = 0

/**
 * Admin → Subscription Plans page
 * Lets an admin edit on-chain prices and database-driven feature lists.
 */
export default async function AdminPlanPricesPage() {
  /* -------------------------- Prices (on-chain) ------------------------- */
  const baseWei: bigint = await subscriptionManager.planPriceWei(1)
  const plusWei: bigint = await subscriptionManager.planPriceWei(2)

  /* -------------------------- Feature lists ----------------------------- */
  const [freeRows, baseRows, plusRows] = await Promise.all([
    db
      .select({ feature: planFeatures.feature })
      .from(planFeatures)
      .where(eq(planFeatures.planKey, 'free'))
      .orderBy(asc(planFeatures.sortOrder)),
    db
      .select({ feature: planFeatures.feature })
      .from(planFeatures)
      .where(eq(planFeatures.planKey, 'base'))
      .orderBy(asc(planFeatures.sortOrder)),
    db
      .select({ feature: planFeatures.feature })
      .from(planFeatures)
      .where(eq(planFeatures.planKey, 'plus'))
      .orderBy(asc(planFeatures.sortOrder)),
  ])

  const defaultFeatures = {
    free: freeRows.map((r) => r.feature),
    base: baseRows.map((r) => r.feature),
    plus: plusRows.map((r) => r.feature),
  }

  /* ------------------------------- View --------------------------------- */
  return (
    <PageCard
      icon={Tag}
      title='Subscription Plans'
      description='Update on-chain FLR prices and marketing features for every tier.'
    >
      <UpdatePlanPricesForm
        defaultBaseWei={baseWei.toString()}
        defaultPlusWei={plusWei.toString()}
      />

      <hr className='my-8' />

      <UpdatePlanFeaturesForm defaultFeatures={defaultFeatures} />
    </PageCard>
  )
}
