import Link from 'next/link'

import { Check } from 'lucide-react'

import { SubmitButton } from '@/app/(dashboard)/pricing/submit-button'
import { Button } from '@/components/ui/button'
import { PLAN_META } from '@/lib/constants/pricing'
import { getUser, getTeamForUser } from '@/lib/db/queries/queries'
import { checkoutAction } from '@/lib/payments/actions'
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe'

/* -------------------------------------------------------------------------- */
/*                               P U B L I C  A P I                           */
/* -------------------------------------------------------------------------- */

interface PricingGridProps {
  currentPlanName?: string | null
}

/**
 * PricingGrid renders the canonical pricing cards.
 * If `currentPlanName` isn’t provided, we detect the signed-in user’s team plan
 * so both the landing and in-app pages exhibit identical behaviour.
 */
export async function PricingGrid({ currentPlanName }: PricingGridProps) {
  /* Detect active plan when omitted */
  if (currentPlanName === undefined) {
    const user = await getUser()
    if (user) {
      const team = await getTeamForUser(user.id)
      currentPlanName = team?.planName ?? 'Free'
    } else {
      currentPlanName = null
    }
  }

  /* Stripe metadata */
  const [prices, products] = await Promise.all([getStripePrices(), getStripeProducts()])

  const resolveStripe = (planName: string) => {
    const product = products.find((p) => p.name === planName)
    const price = prices.find((pr) => pr.productId === product?.id)
    return { price }
  }

  return (
    <div className='grid gap-10 md:grid-cols-3'>
      {PLAN_META.map((meta) => {
        const { price } = resolveStripe(meta.name)
        const amount = ((price?.unitAmount ?? 0) / 100).toFixed(0)
        const interval = price?.interval ?? 'month'
        const trialDays = price?.trialPeriodDays ?? 0
        const isCurrent =
          !!currentPlanName && currentPlanName.toLowerCase() === meta.name.toLowerCase()

        return (
          <PricingCard
            key={meta.key}
            meta={meta}
            price={Number(amount)}
            interval={interval}
            trialDays={trialDays}
            priceId={price?.id}
            isCurrent={isCurrent}
          />
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               P R I C I N G  C A R D                       */
/* -------------------------------------------------------------------------- */

function PricingCard({
  meta,
  price,
  interval,
  trialDays,
  priceId,
  isCurrent,
}: {
  meta: (typeof PLAN_META)[number]
  price: number
  interval: string
  trialDays: number
  priceId?: string
  isCurrent: boolean
}) {
  return (
    <div
      className={`border-border bg-background/70 rounded-3xl border p-8 shadow-sm backdrop-blur transition-shadow hover:shadow-xl ${
        meta.highlight ? 'ring-primary ring-2' : ''
      }`}
    >
      <h3 className='text-foreground mb-2 text-2xl font-semibold'>{meta.name}</h3>

      {trialDays > 0 && meta.key !== 'free' && (
        <p className='text-muted-foreground mb-4 text-sm'>{trialDays}-day free trial</p>
      )}

      {meta.key === 'free' ? (
        <p className='text-foreground mb-6 text-3xl font-extrabold'>Forever Free</p>
      ) : (
        <p className='text-foreground mb-6 text-4xl font-extrabold'>
          ${price}
          <span className='text-muted-foreground ml-1 text-xl font-medium'>/ {interval}</span>
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
      ) : priceId ? (
        <form action={checkoutAction}>
          <input type='hidden' name='priceId' value={priceId} />
          <SubmitButton />
        </form>
      ) : null}
    </div>
  )
}
