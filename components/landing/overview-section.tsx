'use client'

import { TrendingUp, ShieldCheck, Shuffle, KeyRound } from 'lucide-react'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'

const items = [
  {
    icon: TrendingUp,
    title: 'Live Price Oracle (FTSO)',
    text: 'All pricing and billing flows source real-time FLR/USD rates directly from the Flare Time-Series Oracle.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Data Connector (FDC)',
    text: 'External proofs are replayed on-chain through Flare Data Connector, anchoring web2 attestations immutably.',
  },
  {
    icon: Shuffle,
    title: 'Provable Randomness (RNG)',
    text: 'Skill-Check quizzes are shuffled with Flare’s verifiable RNG so no two candidates see the same order.',
  },
  {
    icon: KeyRound,
    title: 'Deterministic DIDs',
    text: 'Every workspace mints a did:flare identifier via the on-chain DIDRegistry for universal, unfakeable identity.',
  },
]

export default function OverviewSection() {
  return (
    <section id='overview' className='bg-background py-24'>
      <div className='mx-auto max-w-6xl px-4'>
        <header className='mb-14 text-center'>
          <h2 className='text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl'>
            Powered by Flare Protocols
          </h2>
          <p className='text-muted-foreground mx-auto mt-4 max-w-2xl'>
            FlareCred weaves every enshrined data protocol — FTSO, FDC and RNG — straight into the
            hiring flow so proofs are live, verifiable and tamper-proof.
          </p>
        </header>

        <div className='grid gap-8 md:grid-cols-2'>
          {items.map(({ icon: Icon, title, text }) => (
            <Card
              key={title}
              className='group bg-background/70 relative flex overflow-hidden rounded-3xl backdrop-blur transition-shadow hover:shadow-xl'
            >
              <span className='bg-flare-gradient absolute top-0 left-0 h-full w-1.5 rounded-tr-lg rounded-br-lg' />

              <CardHeader className='flex flex-row items-center gap-4 pl-8'>
                <div className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shadow-inner dark:bg-orange-900/40 dark:text-orange-300'>
                  <Icon className='h-6 w-6' />
                </div>
                <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
              </CardHeader>

              <CardContent className='-mt-4 pr-6 pb-6 pl-8'>
                <p className='text-muted-foreground text-sm leading-relaxed'>{text}</p>
              </CardContent>

              <div className='pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-10'>
                <div className='bg-flare-gradient h-full w-full blur-3xl' />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
