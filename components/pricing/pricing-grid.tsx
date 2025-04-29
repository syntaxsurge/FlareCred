'use client'

import Link from 'next/link'
import { Suspense } from 'react'

import { formatUnits } from 'ethers'
import { Check } from 'lucide-react'

import { SubmitButton } from '@/app/(dashboard)/pricing/submit-button'
import { Button } from '@/components/ui/button'
import { PLAN_META, FLR_DECIMALS } from '@/lib/constants/pricing'
import { useFlareUsdPrice } from '@/lib/hooks/use-flare-usd-price'
import type { PricingGridProps } from '@/lib/types/ui'

/* -------------------------------------------------------------------------- */
/*                         P R I C I N G   G R I D                            */
/* -------------------------------------------------------------------------- */

export function PricingGrid({ currentPlanName }: PricingGridProps) {
  const { usd, stale } = useFlareUsdPrice()

  return (
    <>
      {stale && (
        <div className='mb-6 rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-700'>
          Oracle data stale – retry later
        </div>
      )}

      <div className='grid gap-10 md:grid-cols-3'>
        {PLAN_META.map((meta) => {
          const priceFlr = Number(formatUnits(meta.priceWei, FLR_DECIMALS))
          const usdLabel = usd ? ` ≈ $${(priceFlr * usd).toFixed(2)}` : ''

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
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                           P R I C I N G   C A R D                          */
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
