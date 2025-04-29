'use client'

import { TrendingUp, Shuffle, ShieldCheck, BookOpen } from 'lucide-react'

const features = [
  {
    icon: TrendingUp,
    title: 'Oracle-Priced Billing',
    description:
      'Subscriptions are priced in FLR but converted to USD on the fly using the live FTSO feed.',
  },
  {
    icon: ShieldCheck,
    title: 'On-Chain Verifications',
    description: 'Every credential hash is anchored through FDC and viewable on Flarescan.',
  },
  {
    icon: Shuffle,
    title: 'Randomised Quizzes',
    description:
      'Flare RNG seeds each quiz attempt ensuring fair, non-predictable assessment for candidates.',
  },
  {
    icon: BookOpen,
    title: 'Open Standards',
    description: 'Verifiable Credentials, ERC-721 tokens and did:flare identifiers by default.',
  },
]

export default function FeaturesSection() {
  return (
    <section id='features' className='bg-muted/50 py-20'>
      <div className='mx-auto max-w-6xl px-4 text-center'>
        <h2 className='text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl'>
          Key Features
        </h2>

        <div className='mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className='group border-border/60 bg-background/70 relative flex flex-col items-center overflow-hidden rounded-2xl border p-8 backdrop-blur transition-transform hover:-translate-y-1 hover:shadow-2xl'
            >
              <div className='mb-4 inline-flex size-12 items-center justify-center rounded-full bg-flare-gradient text-white shadow-lg'>
                <Icon className='h-6 w-6' />
              </div>

              <h3 className='text-foreground text-lg font-semibold'>{title}</h3>
              <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>{description}</p>

              <div className='pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-15'>
                <div className='absolute inset-0 bg-flare-gradient blur-3xl' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}