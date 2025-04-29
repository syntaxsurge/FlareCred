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
      {/* Background */}
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

        {/* CTAs */}
        <div className='mt-12 flex flex-wrap justify-center gap-4'>
          <GradientButton href='/connect-wallet'>Launch App</GradientButton>
          <GradientButton href='/#pricing' tone='outline'>
            See Pricing
          </GradientButton>
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
    <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
      {/* Radial glow */}
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)]' />

      {/* Angled flare wave (top-left → bottom-right) */}
      <div className='absolute -top-[35rem] -left-[28rem] h-[95rem] w-[95rem] -rotate-45 bg-flare-gradient opacity-10 blur-3xl dark:opacity-20' />

      {/* Angled flare wave (bottom-right → top-left) */}
      <div className='absolute -bottom-[35rem] -right-[28rem] h-[95rem] w-[95rem] rotate-45 bg-flare-gradient opacity-10 blur-3xl dark:opacity-20' />

      {/* Subtle grid overlay */}
      <div className='absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20 dark:opacity-10' />
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