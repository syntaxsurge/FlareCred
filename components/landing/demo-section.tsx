'use client'

import Link from 'next/link'

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const EMBEDS = [
  {
    title: 'Pitch Deck',
    /** Canva’s "view?embed” query renders an embeddable deck */
    src: 'https://www.canva.com/design/DAGmLnAoe5E/P8mRrpPzBIVnAs_Ab4Myvg/view?embed',
    link: 'https://flarecred.com/pitch-deck',
    ratio: '16 / 9',
  },
  {
    title: 'Demo Video',
    src: 'https://www.youtube.com/embed/HZaX3W2Xbgc',
    link: 'https://flarecred.com/demo-video',
    ratio: '16 / 9',
  },
] as const

/**
 * Beautiful, modern showcase section that lets visitors flick through the deck
 * or watch the product video in-page — no navigation away required.
 */
export default function DemoSection() {
  return (
    <section id='demo' className='bg-muted/40 py-24'>
      <div className='mx-auto max-w-6xl px-4'>
        {/* Heading */}
        <header className='text-center'>
          <h2 className='text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl'>
            See&nbsp;FlareCred&nbsp;in&nbsp;Action
          </h2>
          <p className='text-muted-foreground mx-auto mt-4 max-w-2xl'>
            Watch the walkthrough or skim the slides without ever leaving this page.
          </p>
        </header>

        {/* Deck + Video grid */}
        <div className='mt-16 grid gap-8 sm:grid-cols-2'>
          {EMBEDS.map(({ title, src, link, ratio }) => (
            <motion.div
              key={title}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className='group/card'
            >
              <div className='bg-flare-gradient rounded-3xl p-[2px]'>
                <Card className='border-border/60 bg-background/70 h-full rounded-[inherit] border backdrop-blur'>
                  {/* Card header with external-link shortcut */}
                  <CardHeader className='flex flex-row items-center justify-between gap-4 px-6 py-6'>
                    <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
                    <Button asChild variant='ghost' size='icon' className='h-8 w-8'>
                      <Link href={link} target='_blank' rel='noopener noreferrer'>
                        <ExternalLink className='h-4 w-4' />
                        <span className='sr-only'>Open in new tab</span>
                      </Link>
                    </Button>
                  </CardHeader>

                  {/* Responsive iframe wrapper */}
                  <CardContent className='px-6 pb-6'>
                    <div
                      className='relative w-full overflow-hidden rounded-lg shadow-lg'
                      style={{ aspectRatio: ratio }}
                    >
                      <iframe
                        src={src}
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                        loading='lazy'
                        className='absolute inset-0 h-full w-full rounded-lg border-0'
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
