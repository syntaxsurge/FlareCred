'use client'

import { useEffect, useState } from 'react'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet } from 'lucide-react'
import { useAccount } from 'wagmi'

/**
 * Connect Wallet — prompts visitors to connect a wallet before using the app.
 * After the wallet connects, we verify that the backend has established a
 * session (`/api/auth/wallet-status`) before redirecting to the dashboard.
 *
 * We perform a **hard page reload** once the session cookie is present so that
 * every server component—including the dashboard sidebar—re-renders with the
 * correct role for the newly-selected wallet.
 */
export default function ConnectWalletPage() {
  const { isConnected, address } = useAccount()
  const [checking, setChecking] = useState(false)

  /* Once connected, ask the backend to set/confirm the session cookie; only
     navigate to the dashboard if the user already exists and the cookie is set. */
  useEffect(() => {
    let cancelled = false

    async function ensureSessionAndRedirect() {
      if (!isConnected || !address) return
      setChecking(true)

      try {
        const res = await fetch(`/api/auth/wallet-status?address=${address}`, {
          method: 'GET',
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))

        /* If the wallet already has a complete user record, trigger a hard reload
           so server components rebuild using the fresh session cookie. */
        if (res.ok && json?.exists) {
          window.location.href = `/dashboard?t=${Date.now()}`
          return
        }

        /* Otherwise, remain on this page; the WalletOnboardModal will appear
           automatically to complete profile creation. */
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    ensureSessionAndRedirect()
    return () => {
      cancelled = true
    }
  }, [isConnected, address])

  return (
    <section className='mx-auto flex min-h-[calc(100dvh-64px)] max-w-md flex-col items-center justify-center gap-6 px-4 text-center'>
      <div className='flex flex-col items-center gap-4'>
        <Wallet className='text-primary h-10 w-10' strokeWidth={1.5} />
        <h1 className='text-3xl font-extrabold tracking-tight'>Connect Your Wallet</h1>
        <p className='text-muted-foreground max-w-xs text-sm'>
          To continue, please connect an EVM wallet such as MetaMask or WalletConnect.
        </p>
      </div>

      {/* Full-width ConnectButton without invalid className prop */}
      <div className='flex w-full justify-center'>
        <ConnectButton accountStatus='avatar' chainStatus='icon' showBalance={false} />
      </div>

      {checking && <p className='text-muted-foreground text-xs'>Verifying wallet session…</p>}
    </section>
  )
}
