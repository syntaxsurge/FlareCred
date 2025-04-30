import { redirect } from 'next/navigation'

import { Tag } from 'lucide-react'

import PageCard from '@/components/ui/page-card'
import { subscriptionManager } from '@/lib/contracts'
import { getUser } from '@/lib/db/queries/queries'

import UpdatePlanPricesForm from './update-plan-prices-form'

export const revalidate = 0

/**
 * Admin → Plan Prices page
 * Displays the current Base & Plus plan prices and lets an admin update them
 * via SubscriptionManager.setPlanPrice.
 */
export default async function AdminPlanPricesPage() {
  const user = await getUser()
  if (!user) redirect('/connect-wallet')
  if (user.role !== 'admin') redirect('/dashboard')

  /* ---------------------------------------------------------------------- */
  /*                   Fetch current on-chain plan prices                   */
  /* ---------------------------------------------------------------------- */
  const baseWei: bigint = await subscriptionManager.planPriceWei(1)
  const plusWei: bigint = await subscriptionManager.planPriceWei(2)

  return (
    <PageCard
      icon={Tag}
      title='Subscription Plan Prices'
      description='Update the on-chain FLR cost for each subscription tier.'
    >
      <UpdatePlanPricesForm
        /* bigint → string to avoid loss of precision across the wire */
        defaultBaseWei={baseWei.toString()}
        defaultPlusWei={plusWei.toString()}
      />
    </PageCard>
  )
}