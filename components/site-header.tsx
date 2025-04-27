'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ChevronDown, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

import { signOut } from '@/app/(auth)/actions'
import { ModeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useUser } from '@/lib/auth'

/* -------------------------------------------------------------------------- */
/*                        W A L L E T C O N N E C T  G U A R D                */
/* -------------------------------------------------------------------------- */

const RAW_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''
const PLACEHOLDER = '00000000000000000000000000000000'
const WALLETCONNECT_ENABLED = RAW_PROJECT_ID !== '' && RAW_PROJECT_ID !== PLACEHOLDER

/* Landing page anchor sections */
const LANDING_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'deep-dive', label: 'Deep Dive' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'cta', label: 'Get Started' },
] as const

/* Tools dropdown items */
const TOOLS_MENU = [
  { href: '/candidates', label: 'Candidates' },
  { href: '/issuers', label: 'Issuers' },
  { href: '/verify', label: 'Verify' },
] as const

export default function SiteHeader() {
  const router = useRouter()
  const { userPromise } = useUser()
  const [user, setUser] = useState<Awaited<typeof userPromise> | null>(null)

  /* Resolve user promise */
  useEffect(() => {
    let active = true
    const val: unknown = userPromise
    if (val && typeof val === 'object' && typeof (val as any)?.then === 'function') {
      ;(val as Promise<any>).then(
        (u) => active && setUser(u),
        () => active && setUser(null),
      )
    } else {
      setUser(val as Awaited<typeof userPromise>)
    }
    return () => {
      active = false
    }
  }, [userPromise])

  async function handleSignOut() {
    await signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <header className='border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b shadow-sm backdrop-blur'>
      <div className='mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 md:px-6'>
        {/* Brand */}
        <Link
          href='/'
          className='text-primary flex items-center gap-2 whitespace-nowrap text-lg font-extrabold tracking-tight'
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
        <nav className='hidden justify-center gap-8 md:flex'>
          {/* Home dropdown */}
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Link
                href='/'
                className='text-foreground/80 hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors'
              >
                Home
                <ChevronDown className='mt-0.5 h-3 w-3' />
              </Link>
            </HoverCardTrigger>
            <HoverCardContent side='bottom' align='start' className='w-44 rounded-lg p-2'>
              <ul className='space-y-1'>
                {LANDING_SECTIONS.map((s) => (
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
              <Link
                href='/candidates'
                className='text-foreground/80 hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors'
              >
                Tools
                <ChevronDown className='mt-0.5 h-3 w-3' />
              </Link>
            </HoverCardTrigger>
            <HoverCardContent side='bottom' align='start' className='w-44 rounded-lg p-2'>
              <ul className='space-y-1'>
                {TOOLS_MENU.map((t) => (
                  <li key={t.href}>
                    <Link href={t.href} className='hover:bg-muted block rounded px-2 py-1 text-sm'>
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
          {WALLETCONNECT_ENABLED && (
            <ConnectButton accountStatus='avatar' showBalance={false} chainStatus='icon' />
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <UserAvatar
                  src={(user as any)?.image ?? undefined}
                  name={(user as any)?.name ?? null}
                  email={(user as any)?.email ?? null}
                  className='cursor-pointer'
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align='end'
                className='data-[state=open]:animate-in data-[state=closed]:animate-out w-56 max-w-[90vw] rounded-lg p-1 shadow-lg sm:w-64'
              >
                {/* User card */}
                <DropdownMenuItem
                  asChild
                  className='data-[highlighted]:bg-muted data-[highlighted]:text-foreground flex flex-col items-start gap-1 select-none rounded-md px-3 py-2 text-left'
                >
                  <Link href='/settings/team' className='w-full'>
                    <p className='truncate text-sm font-medium'>
                      {user.name || user.email || 'Unnamed User'}
                    </p>
                    {user.email && (
                      <p className='text-muted-foreground truncate text-xs break-all'>
                        {user.email}
                      </p>
                    )}
                    <span className='bg-muted text-muted-foreground inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider'>
                      {user.role}
                    </span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  asChild
                  className='data-[highlighted]:bg-muted data-[highlighted]:text-foreground flex items-center gap-2 rounded-md px-3 py-2'
                >
                  <Link href='/dashboard' className='flex items-center gap-2'>
                    <LayoutDashboard className='h-4 w-4' />
                    <span className='text-sm'>Dashboard</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  className='data-[highlighted]:bg-muted data-[highlighted]:text-foreground flex items-center gap-2 rounded-md px-3 py-2'
                >
                  <Link href='/settings/general' className='flex items-center gap-2'>
                    <Settings className='h-4 w-4' />
                    <span className='text-sm'>Settings</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <form action={handleSignOut} className='w-full'>
                  <button type='submit' className='w-full'>
                    <DropdownMenuItem className='data-[highlighted]:bg-muted data-[highlighted]:text-foreground flex items-center gap-2 rounded-md px-3 py-2'>
                      <LogOut className='h-4 w-4' />
                      <span className='text-sm'>Sign out</span>
                    </DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href='/sign-in' className='shrink-0'>
                <Button variant='ghost' size='sm'>
                  Sign in
                </Button>
              </Link>
              <Link href='/sign-up' className='shrink-0'>
                <Button size='sm'>Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}