'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ChevronDown } from 'lucide-react'
import { useAccount } from 'wagmi'

import WalletOnboardModal from '@/components/auth/wallet-onboard-modal'
import { ModeToggle } from '@/components/theme-toggle'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { useUser } from '@/lib/auth'

/* -------------------------------------------------------------------------- */
/*                               NAVIGATION DATA                              */
/* -------------------------------------------------------------------------- */

const LEARN_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'deep-dive', label: 'Deep Dive' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'pricing', label: 'Pricing' },
] as const

const TOOLS_MENU = [
  { href: '/candidates', label: 'Candidates' },
  { href: '/issuers', label: 'Issuers' },
  { href: '/verify', label: 'Verify' },
] as const

/* -------------------------------------------------------------------------- */
/*                                  HEADER                                    */
/* -------------------------------------------------------------------------- */

export default function SiteHeader() {
  /* Global user promise (resolved server-side) */
  const { userPromise } = useUser()
  const [currentUser, setCurrentUser] = useState<Awaited<typeof userPromise> | null>(null)

  /* Wallet connectivity */
  const { isConnected } = useAccount()

  /* Resolve the user promise exactly once per render cycle */
  useEffect(() => {
    let mounted = true
    const maybe = userPromise as unknown
    if (maybe && typeof maybe === 'object' && typeof (maybe as any).then === 'function') {
      ;(maybe as Promise<any>).then(
        (u) => mounted && setCurrentUser(u),
        () => mounted && setCurrentUser(null),
      )
    } else {
      setCurrentUser(maybe as Awaited<typeof userPromise>)
    }
    return () => {
      mounted = false
    }
  }, [userPromise])

  return (
    <>
      <header className='border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b shadow-sm backdrop-blur'>
        <div className='mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 md:px-6'>
          {/* Brand */}
          <Link
            href='/'
            className='text-primary flex items-center gap-2 text-lg font-extrabold tracking-tight whitespace-nowrap'
          >
            <Image
              src='/images/flarecred-logo.png'
              alt='FlareCred logo'
              width={24}
              height={24}
              priority
              className='h-6 w-auto'
            />
            FlareCred
          </Link>

          {/* Desktop nav */}
          <nav className='hidden justify-center gap-6 md:flex'>
            <Link
              href='/'
              className='text-foreground/80 hover:text-foreground text-sm font-medium transition-colors'
            >
              Home
            </Link>

            {/* Learn dropdown */}
            <HoverCard openDelay={100} closeDelay={100}>
              <HoverCardTrigger asChild>
                <span className='text-foreground/80 hover:text-foreground flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors'>
                  Learn
                  <ChevronDown className='mt-0.5 h-3 w-3' />
                </span>
              </HoverCardTrigger>
              <HoverCardContent side='bottom' align='start' className='w-40 rounded-lg p-2'>
                <ul className='space-y-1'>
                  {LEARN_SECTIONS.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/#${s.id}`}
                        className='hover:bg-muted block rounded px-2 py-1 text-sm'
                      >
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </HoverCardContent>
            </HoverCard>

            {/* Tools dropdown */}
            <HoverCard openDelay={100} closeDelay={100}>
              <HoverCardTrigger asChild>
                <span className='text-foreground/80 hover:text-foreground flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors'>
                  Tools
                  <ChevronDown className='mt-0.5 h-3 w-3' />
                </span>
              </HoverCardTrigger>
              <HoverCardContent side='bottom' align='start' className='w-40 rounded-lg p-2'>
                <ul className='space-y-1'>
                  {TOOLS_MENU.map((t) => (
                    <li key={t.href}>
                      <Link
                        href={t.href}
                        className='hover:bg-muted block rounded px-2 py-1 text-sm'
                      >
                        {t.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </HoverCardContent>
            </HoverCard>

            <Link
              href='/pricing'
              className='text-foreground/80 hover:text-foreground text-sm font-medium transition-colors'
            >
              Pricing
            </Link>

            <Link
              href='/dashboard'
              className='text-foreground/80 hover:text-foreground text-sm font-medium transition-colors'
            >
              Dashboard
            </Link>
          </nav>

          {/* Right-aligned controls */}
          <div className='flex items-center justify-end gap-3'>
            <ModeToggle />
            <ConnectButton accountStatus='avatar' chainStatus='icon' showBalance={false} />
          </div>
        </div>
      </header>

      {/* Wallet onboarding modal – renders globally so it’s available on every page */}
      <WalletOnboardModal isConnected={isConnected} user={currentUser} />
    </>
  )
}
