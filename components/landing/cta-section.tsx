'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function CTASection() {
  return (
    <section id='cta' className='relative isolate -mx-4 overflow-hidden md:-mx-6'>
      <div className='pointer-events-none absolute inset-0 -z-10 bg-flare-gradient' />

      <div className='mx-auto max-w-4xl px-4 py-24 text-center sm:py-32'>
        <h2 className='text-3xl font-extrabold tracking-tight text-white sm:text-4xl'>
          Bring Flare-native trust to your hiring.
        </h2>
        <p className='mx-auto mt-4 max-w-2xl text-lg/relaxed text-white/90'>
          Spin up a workspace, mint your did:flare and start issuing verifiable credentials in
          minutes.
        </p>

        <div className='mt-10 flex justify-center'>
          <Button
            asChild
            size='lg'
            className='rounded-full bg-white/10 text-white hover:bg-white/20'
          >
            <Link href='/connect-wallet'>Get Started</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}