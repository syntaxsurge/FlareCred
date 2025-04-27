'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Edge-to-edge hero banner with vibrant gradients and a clear “Free” call-out.
 */
export default function HeroSection() {
  return (
    <section className='relative isolate -mx-4 overflow-hidden md:-mx-6'>
      {/* Decorative gradients */}
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute inset-y-0 left-0 w-full bg-[conic-gradient(at_top_left,var(--tw-gradient-stops))] from-indigo-500 via-fuchsia-500 to-indigo-500 opacity-20 blur-3xl dark:opacity-30' />
        <div className='absolute top-1/4 -right-80 h-[38rem] w-[38rem] rounded-full bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-600 opacity-30 blur-3xl' />
        <div className='absolute bottom-0 -left-72 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-fuchsia-600 via-indigo-500 to-purple-600 opacity-30 blur-2xl' />
      </div>

      <div className='relative z-10 mx-auto max-w-6xl px-4 py-32 text-center sm:py-44'>
        <h1 className='text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl'>
          <span className='bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent'>
          FlareCred
          </span>
        </h1>

        {/* Free badge */}
        <p className='mx-auto mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-transparent via-purple-500/20 to-transparent px-4 py-1 text-sm font-medium text-purple-600 dark:text-purple-300'>
          🎉 Start for <span className='font-semibold'>FREE</span> — forever
        </p>

        <p className='text-muted-foreground mx-auto mt-6 max-w-3xl text-lg/relaxed sm:text-xl'>
          The trust layer for modern hiring — merge verifiable credentials with AI-graded skill
          passes and get hired faster.
        </p>

        <div className='mt-12 flex flex-wrap justify-center gap-4'>
          <GradientButton href='/sign-up'>Create Free Account</GradientButton>

          <GradientButton href='/sign-up?role=recruiter' tone='outline'>
            For Recruiters
          </GradientButton>
          <GradientButton href='/sign-up?role=issuer' tone='outline'>
            For Issuers
          </GradientButton>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* CTA helper                                                                 */
/* -------------------------------------------------------------------------- */

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
            isSolid
              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500'
              : 'bg-gradient-to-r from-transparent via-purple-500/60 to-transparent',
          )}
        />
      </Link>
    </Button>
  )
}
