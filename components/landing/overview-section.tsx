'use client'

import { Database, Award, Code2, CreditCard } from 'lucide-react'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'

const items = [
  {
    icon: Database,
    title: 'Trusted Credentials',
    text: 'Issue and verify credentials on-chain with Flare integration.',
  },
  {
    icon: Award,
    title: 'AI Skill Checks',
    text: 'Objective quizzes graded by OpenAI for real skill validation.',
  },
  {
    icon: Code2,
    title: 'Developer Friendly',
    text: 'Built with Next.js, TypeScript and Tailwind.',
  },
  {
    icon: CreditCard,
    title: 'Flexible Billing',
    text: 'Stripe subscriptions and pay-per-verification options.',
  },
]

export default function OverviewSection() {
  return (
    <section id='overview' className='bg-background py-24'>
      <div className='mx-auto max-w-6xl px-4'>
        <header className='mb-14 text-center'>
          <h2 className='text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl'>
            Why FlareCred?
          </h2>
          <p className='text-muted-foreground mx-auto mt-4 max-w-2xl'>
            Eliminate tedious background checks with blockchain-backed credentials and AI
            assessments.
          </p>
        </header>

        {/* New horizontal card list with side accent bar */}
        <div className='grid gap-8 md:grid-cols-2'>
          {items.map(({ icon: Icon, title, text }) => (
            <Card
              key={title}
              className='group bg-background/70 relative flex overflow-hidden rounded-3xl backdrop-blur transition-shadow hover:shadow-xl'
            >
              {/* Gradient accent bar */}
              <span className='absolute top-0 left-0 h-full w-1.5 rounded-tr-lg rounded-br-lg bg-gradient-to-b from-orange-500 via-pink-500 to-rose-500' />

              <CardHeader className='flex flex-row items-center gap-4 pl-8'>
                <div className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shadow-inner dark:bg-orange-900/40 dark:text-orange-300'>
                  <Icon className='h-6 w-6' />
                </div>
                <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
              </CardHeader>

              <CardContent className='-mt-4 pr-6 pb-6 pl-8'>
                <p className='text-muted-foreground text-sm leading-relaxed'>{text}</p>
              </CardContent>

              {/* Subtle hover glow */}
              <div className='pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-10'>
                <div className='h-full w-full bg-gradient-to-br from-orange-500 via-pink-500 to-rose-500 blur-3xl' />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}