'use client'

import Link from 'next/link'

import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'

/**
 * Call-to-action section — now with an animated Flare gradient backdrop,
 * radial glow, subtle grid overlay and motion-driven entrance transitions.
 */
export default function CTASection() {
  return (
    <section id='cta' className='relative isolate -mx-4 overflow-hidden md:-mx-6'>
      <GradientBackdrop />

      <div className='mx-auto max-w-5xl px-4 py-24 text-center sm:py-32'>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='text-4xl font-extrabold tracking-tight text-balance text-white sm:text-5xl md:text-6xl'
        >
          <span className='text-flare-gradient animate-flare-gradient'>
            Flare-Native&nbsp;Trust&nbsp;
          </span>
          For&nbsp;Every&nbsp;Hire
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className='mx-auto mt-6 max-w-2xl text-lg/relaxed text-white/90'
        >
          Spin up a workspace, mint your did:flare and start issuing verifiable credentials in
          minutes&nbsp;— no crypto experience required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className='mt-12 flex justify-center'
        >
          <Button
            asChild
            size='lg'
            className='relative isolate overflow-hidden rounded-full bg-white/10 px-8 py-3 font-semibold text-white shadow-xl transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-2xl focus-visible:outline-none'
          >
            <Link href='/connect-wallet'>Get Started</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                         B A C K G R O U N D  L A Y E R S                    */
/* -------------------------------------------------------------------------- */

function GradientBackdrop() {
  return (
    <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
      {/* Animated flare gradient */}
      <div className='bg-flare-gradient animate-flare-gradient absolute inset-0 opacity-70' />

      {/* Radial glow for depth */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25)_0%,transparent_70%)]' />

      {/* Subtle grid overlay */}
      <div className='absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20' />

      {/* Dark layer for text contrast */}
      <div className='absolute inset-0 bg-black/40 mix-blend-multiply' />
    </div>
  )
}
