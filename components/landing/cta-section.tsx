'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function CTASection() {
  return (
    <section id='cta' className='relative isolate -mx-4 overflow-hidden md:-mx-6'>
      <div className='pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600' />

      <div className='mx-auto max-w-4xl px-4 py-24 text-center sm:py-32'>
        <h2 className='text-3xl font-extrabold tracking-tight text-white sm:text-4xl'>
          Ready to Build a Verifiable Profile?
        </h2>
        <p className='mx-auto mt-4 max-w-2xl text-lg/relaxed text-white/90'>
          Showcase provable achievements and let recruiters trust you instantly.
        </p>

        <div className='mt-10 flex flex-wrap justify-center gap-4'>
          <Button asChild size='lg' className='rounded-full'>
            <Link href='/sign-up'>Get Started</Link>
          </Button>

          <Button
            asChild
            size='lg'
            variant='outline'
            className='rounded-full shadow-lg backdrop-blur hover:bg-white/10 hover:text-white'
          >
            <Link href='/sign-up?role=recruiter'>For Recruiters</Link>
          </Button>

          <Button
            asChild
            size='lg'
            variant='outline'
            className='rounded-full shadow-lg backdrop-blur hover:bg-white/10 hover:text-white'
          >
            <Link href='/sign-up?role=issuer'>For Issuers</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
