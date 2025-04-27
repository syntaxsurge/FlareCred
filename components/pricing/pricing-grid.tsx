import { Suspense } from 'react'
import Link from 'next/link'
import { cache } from 'react'
import { Check } from 'lucide-react'

import { SubmitButton } from '@/app/(dashboard)/pricing/submit-button'
import { Button } from '@/components/ui/button'
import { PLAN_META } from '@/lib/constants/pricing'
import { getTeamForUser, getUser } from '@/lib/db/queries/queries'

/* -------------------------------------------------------------------------- */
/*                        F L R   /   U S D   P R I C E                       */
/* -------------------------------------------------------------------------- */

/**
 * Fetch the latest FLR → USD price (18 decimals) from Coingecko.
 * Result is cached for 5 minutes to avoid rate-limits.
 */
const getFlrUsdPrice = cache(async (): Promise<number | null> => {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=flare-networks&vs_currencies=usd',
      { next: { revalidate: 300 } },
    )
    const json = (await res.json()) as any
    return json['flare-networks']?.usd ?? null
  } catch {
    return null
  }
})

/* -------------------------------------------------------------------------- */
/*                               P U B L I C  A P I                           */
/* -------------------------------------------------------------------------- */

interface PricingGridProps {
  /** Team’s current plan (`Free` | `Base` | `Plus`) or null if anonymous. */
  currentPlanName?: string | null
}

/**
 * Pricing cards for all tiers, highlighting the active plan
 * and enabling on-chain subscription via the connected wallet.
 */
export async function PricingGrid({ currentPlanName }: PricingGridProps) {
  /* Resolve current plan on the server when not supplied */
  if (currentPlanName === undefined) {
    const user = await getUser()
    if (user) {
      const team = await getTeamForUser(user.id)
      currentPlanName = team?.planName ?? 'Free'
    } else {
      currentPlanName = null
    }
  }

  const usdPerFlr = await getFlrUsdPrice()

  return (
    <div className='grid gap-10 md:grid-cols-3'>
      {PLAN_META.map((meta) => {
        const priceFlr = Number(meta.priceWei) / 1e18
        const usdLabel =
          usdPerFlr && meta.priceWei > 0n
            ? ` (~$${(priceFlr * usdPerFlr).toFixed(0)})`
            : ''

        const isCurrent =
          !!currentPlanName && currentPlanName.toLowerCase() === meta.name.toLowerCase()

        return (
          <PricingCard
            key={meta.key}
            meta={meta}
            priceFlr={priceFlr}
            usdLabel={usdLabel}
            isCurrent={isCurrent}
          />
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              P R I C I N G  C A R D                        */
/* -------------------------------------------------------------------------- */

function PricingCard({
  meta,
  priceFlr,
  usdLabel,
  isCurrent,
}: {
  meta: (typeof PLAN_META)[number]
  priceFlr: number
  usdLabel: string
  isCurrent: boolean
}) {
  return (
    <div
      className={`border-border bg-background/70 rounded-3xl border p-8 shadow-sm backdrop-blur transition-shadow hover:shadow-xl ${
        meta.highlight ? 'ring-primary ring-2' : ''
      }`}
    >
      <h3 className='text-foreground mb-2 text-2xl font-semibold'>{meta.name}</h3>

      {meta.key === 'free' ? (
        <p className='text-foreground mb-6 text-3xl font-extrabold'>Forever Free</p>
      ) : (
        <p className='text-foreground mb-6 text-4xl font-extrabold'>
          {priceFlr}
          <span className='text-muted-foreground ml-1 text-xl font-medium'>FLR{usdLabel}</span>
        </p>
      )}

      <ul className='mb-8 space-y-4 text-left'>
        {meta.features.map((feat) => (
          <li key={feat} className='flex items-start'>
            <Check className='mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-orange-500' />
            <span className='text-muted-foreground'>{feat}</span>
          </li>
        ))}
      </ul>

      {/* Action button */}
      {isCurrent ? (
        <Button
          variant='secondary'
          disabled
          className='w-full cursor-default rounded-full opacity-60'
        >
          Current Plan
        </Button>
      ) : meta.key === 'free' ? (
        <Button asChild variant='secondary' className='w-full rounded-full'>
          <Link href='/sign-up'>Get Started</Link>
        </Button>
      ) : (
        /* Base / Plus plans → blockchain transaction */
        (() => {
          const planKey: 1 | 2 = meta.key === 'base' ? 1 : 2
          return (
            <Suspense fallback={<Button className='w-full'>Loading…</Button>}>
              <SubmitButton planKey={planKey} priceWei={meta.priceWei} />
            </Suspense>
          )
        })()
      )}
    </div>
  )
}