'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings as Cog,
  User as UserIcon,
} from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

import { signOut } from '@/app/(auth)/actions'
import WalletOnboardModal from '@/components/auth/WalletOnboardModal'
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
  const router = useRouter()
  const { isConnected } = useAccount()
  const { userPromise } = useUser()
  const [user, setUser] = useState<Awaited<typeof userPromise> | null>(null)

  /* Resolve user once (handles promise or plain value) */
  useEffect(() => {
    let mounted = true
    const maybePromise = userPromise as unknown
    if (maybePromise && typeof maybePromise === 'object' && typeof (maybePromise as any).then === 'function') {
      ;(maybePromise as Promise<any>).then(
        (u) => mounted && setUser(u),
        () => mounted && setUser(null),
      )
    } else {
      setUser(maybePromise as Awaited<typeof userPromise>)
    }
    return () => {
      mounted = false
    }
  }, [userPromise])

  /* ---------------------------------------------------------------------- */
  /*                              S I G N  O U T                            */
  /* ---------------------------------------------------------------------- */

  async function handleSignOut() {
    await signOut()
    router.refresh()
    router.push('/')
  }

  /* ---------------------------------------------------------------------- */
  /*                                   UI                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <>
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

            {!isConnected && (
              <ConnectButton accountStatus='avatar' chainStatus='icon' showBalance={false} />
            )}

            {isConnected && user && (
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
                    <Link href='/settings/general' className='w-full'>
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

                  {/* Profile */}
                  <DropdownMenuItem
                    asChild
                    className='data-[highlighted]:bg-muted data-[highlighted]:text-foreground flex items-center gap-2 rounded-md px-3 py-2'
                  >
                    <Link href='/settings/general' className='flex items-center gap-2'>
                      <UserIcon className='h-4 w-4' />
                      <span className='text-sm'>Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  {/* Dashboard */}
                  <DropdownMenuItem
                    asChild
                    className='data-[highlighted]:bg-muted data-[highlighted]:text-foreground flex items-center gap-2 rounded-md px-3 py-2'
                  >
                    <Link href='/dashboard' className='flex items-center gap-2'>
                      <LayoutDashboard className='h-4 w-4' />
                      <span className='text-sm'>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>

                  {/* Team settings */}
                  <DropdownMenuItem
                    asChild
                    className='data-[highlighted]:bg-muted data-[highlighted]:text-foreground flex items-center gap-2 rounded-md px-3 py-2'
                  >
                    <Link href='/settings/team' className='flex items-center gap-2'>
                      <Cog className='h-4 w-4' />
                      <span className='text-sm'>Team Settings</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Sign out */}
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
            )}
          </div>
        </div>
      </header>

      {/* Wallet-first onboarding modal */}
      <WalletOnboardModal isConnected={isConnected} user={user} />
    </>
  )
}