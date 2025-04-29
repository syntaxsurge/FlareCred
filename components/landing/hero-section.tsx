'use client'

import * as React from 'react'
import Link from 'next/link'
import { ShieldCheck, TrendingUp, Shuffle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                               H E R O  D A T A                             */
/* -------------------------------------------------------------------------- */

const HERO_FEATURES = [
  { icon: ShieldCheck, label: 'On-Chain Verifications' },
  { icon: TrendingUp, label: 'Oracle-Priced Billing' },
  { icon: Shuffle, label: 'Provable RNG Quizzes' },
] as const

/* -------------------------------------------------------------------------- */
/*                                 C O M P O N E N T                          */
/* -------------------------------------------------------------------------- */

export default function HeroSection() {
  return (
    <section className='relative isolate -mx-4 overflow-hidden md:-mx-6'>
      {/* Decorative gradient backdrop */}
      <GradientBackdrop />

      <div className='relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 py-32 text-center sm:py-44'>
        {/* Eyebrow */}
        <span className='text-primary/90 dark:text-primary mb-4 text-sm font-semibold uppercase tracking-widest'>
          Built on Flare Network
        </span>

        {/* Headline */}
        <h1 className='text-balance text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl md:text-7xl'>
          <span className='text-flare-gradient'>Verifiable&nbsp;Talent&nbsp;</span>
          Meets&nbsp;On-Chain&nbsp;Data
        </h1>

        {/* Sub-headline */}
        <p className='text-muted-foreground mx-auto mt-6 max-w-3xl text-lg/relaxed sm:text-xl md:text-2xl'>
          FlareCred turns every proof of skill, employment and payment into a credential anchored by
          Flare’s native oracle, data connector and randomness protocols.
        </p>

        {/* Feature highlights */}
        <ul className='mt-10 flex flex-wrap items-center justify-center gap-6 font-medium text-foreground/80'>
          {HERO_FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className='flex items-center gap-2'>
              <Icon className='h-5 w-5 text-orange-500 dark:text-orange-300' />
              <span>{label}</span>
            </li>
          ))}
        </ul>

        {/* Call-to-actions */}
        <div className='mt-12 flex flex-wrap justify-center gap-4'>
          <GradientButton href='/connect-wallet'>Launch App</GradientButton>
          <GradientButton href='/#pricing' tone='outline'>See Pricing</GradientButton>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                              H E L P E R S                                 */
/* -------------------------------------------------------------------------- */

function GradientBackdrop() {
  return (
    <div className='pointer-events-none absolute inset-0 -z-10'>
      <div className='absolute inset-0 bg-[conic-gradient(at_top_left,var(--flare-gradient))] opacity-20 blur-3xl dark:opacity-30' />
      <div className='absolute top-1/4 -right-80 h-[38rem] w-[38rem] rounded-full bg-flare-gradient opacity-30 blur-3xl' />
      <div className='absolute bottom-0 -left-72 h-[30rem] w-[30rem] rounded-full bg-flare-gradient opacity-30 blur-2xl' />
    </div>
  )
}

type GradientButtonProps = Omit<React.ComponentPropsWithoutRef<typeof Button>, 'variant'> & {
  href: string
  tone?: 'solid' | 'outline'
}

function GradientButton({
  href,
  children,
  tone = 'solid',
  className,
  ...props
}: GradientButtonProps) {
  const isSolid = tone === 'solid'

  return (
    <Button
      asChild
      size='lg'
      className={cn(
        'relative isolate overflow-hidden rounded-full px-8 py-3 font-semibold shadow-xl transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-2xl focus-visible:outline-none',
        isSolid ? 'text-white' : 'text-foreground bg-transparent',
        className,
      )}
      {...props}
    >
      <Link href={href}>
        <span className='relative z-10'>{children}</span>
        <span
          aria-hidden='true'
          className={cn(
            'absolute inset-0 rounded-full transition-opacity duration-300 ease-out',
            isSolid ? 'bg-flare-gradient' : 'bg-flare-gradient/60',
          )}
        />
      </Link>
    </Button>
  )
}