import { subscriptionManager } from '@/lib/contracts'
import { PLAN_META } from '@/lib/constants/pricing'
import type { PlanMeta } from '@/lib/types/pricing'

/** Runtime-safe serialisable variant (priceWei as decimal string). */
export type PlanMetaSerialised = Omit<PlanMeta, 'priceWei'> & { priceWei: string }

/**
 * Reads the current Base (planKey 1) and Plus (planKey 2) prices from the
 * SubscriptionManager contract and merges them into the compile-time
 * PLAN_META feature table.
 *
 * The result only contains plain JSON values so it can be handed straight
 * from React Server Components to the client without `BigInt` serialisation
 * errors.
 */
export async function fetchPlanMeta(): Promise<PlanMetaSerialised[]> {
  const [baseWei, plusWei] = await Promise.all([
    subscriptionManager.planPriceWei(1),
    subscriptionManager.planPriceWei(2),
  ])

  return PLAN_META.map<PlanMetaSerialised>((p) => {
    if (p.key === 'base') return { ...p, priceWei: baseWei.toString() }
    if (p.key === 'plus') return { ...p, priceWei: plusWei.toString() }
    /* free tier never changes */
    return { ...p, priceWei: p.priceWei.toString() }
  })
}