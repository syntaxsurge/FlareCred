'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function HeroSection() {
  return (
    <section className='relative isolate -mx-4 overflow-hidden md:-mx-6'>
      {/* Decorative gradients */}
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute inset-0 bg-[conic-gradient(at_top_left,var(--flare-gradient))] opacity-20 blur-3xl dark:opacity-30' />
        <div className='absolute top-1/4 -right-80 h-[38rem] w-[38rem] rounded-full bg-flare-gradient opacity-30 blur-3xl' />
        <div className='absolute bottom-0 -left-72 h-[30rem] w-[30rem] rounded-full bg-flare-gradient opacity-30 blur-2xl' />
      </div>

      <div className='relative z-10 mx-auto max-w-6xl px-4 py-32 text-center sm:py-44'>
        <h1 className='text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl'>
          <span className='text-flare-gradient'>FlareCred</span>
        </h1>

        <p className='mx-auto mt-6 max-w-3xl text-lg/relaxed text-foreground/80 sm:text-xl'>
          Built on Flare — the only smart-contract platform with native oracle, data connector and
          randomness protocols.
        </p>

        {/* Free badge */}
        <p className='mx-auto mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-flare-gradient/20 px-4 py-1 text-sm font-medium text-orange-700 dark:text-orange-300'>
          🎉 Start for <span className='font-semibold'>FREE</span> — forever
        </p>

        <div className='mt-12 flex flex-wrap justify-center gap-4'>
          <GradientButton href='/connect-wallet'>Connect Wallet</GradientButton>
        </div>
      </div>
    </section>
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
        'relative isolate overflow-hidden rounded-full px-8 py-3 font-semibold shadow-xl transition-transform duration-200 hover:shadow-2xl focus-visible:outline-none',
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
            'absolute inset-0 rounded-full transition-all duration-300 ease-out',
            isSolid ? 'bg-flare-gradient' : 'bg-flare-gradient/60',
          )}
        />
      </Link>
    </Button>
  )
}