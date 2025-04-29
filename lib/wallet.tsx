// SPDX-License-Identifier: MIT
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ReactNode, useEffect, useRef } from 'react'

import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { WagmiProvider, http, useAccount } from 'wagmi'

import { WALLETCONNECT_PROJECT_ID } from './config'

/* -------------------------------------------------------------------------- */
/*                                    CHAINS                                  */
/* -------------------------------------------------------------------------- */

/** Flare main-net */
export const flare = {
  id: 14,
  name: 'Flare',
  nativeCurrency: { name: 'Flare', symbol: 'FLR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://flare-api.flare.network/ext/C/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Flare Explorer', url: 'https://flare-explorer.flare.network' },
  },
  testnet: false,
} as const

/** Coston2 test-net */
export const coston2 = {
  id: 114,
  name: 'Coston2',
  nativeCurrency: { name: 'Coston Flare', symbol: 'CFLR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://coston2-api.flare.network/ext/C/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Coston2 Explorer', url: 'https://coston2-explorer.flare.network' },
  },
  testnet: true,
} as const

/* -------------------------------------------------------------------------- */
/*                         R A I N B O W K I T  /  W A G M I                  */
/* -------------------------------------------------------------------------- */

const wagmiConfig = getDefaultConfig({
  appName: 'FlareCred',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [flare, coston2],
  transports: {
    [flare.id]: http(flare.rpcUrls.default.http[0]),
    [coston2.id]: http(coston2.rpcUrls.default.http[0]),
  },
  ssr: true,
})

const queryClient = new QueryClient()

/* -------------------------------------------------------------------------- */
/*          W A L L E T   C O N N E C T I O N   &   S E S S I O N             */
/* -------------------------------------------------------------------------- */

/**
 * Watches wallet state:
 * – On **disconnect**: clears the HTTP-only session cookie and navigates to /connect-wallet.
 * – On **connect**: sets/refreshes the session exactly once per mount; if the user is on
 *   /connect-wallet it redirects to /dashboard.  It never calls router.refresh(), avoiding
 *   the 404 re-render loop seen previously.
 */
function WalletConnectionListener() {
  const { isConnected, address } = useAccount()
  const router = useRouter()
  const pathname = usePathname()

  const prevConnected = useRef(isConnected)
  const ensuredSession = useRef(false)

  /* Handle disconnects */
  useEffect(() => {
    if (prevConnected.current && !isConnected) {
      ;(async () => {
        try {
          await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
        } catch {
          /* ignore network errors */
        } finally {
          if (pathname !== '/connect-wallet') router.replace('/connect-wallet')
        }
      })()
    }
    prevConnected.current = isConnected
  }, [isConnected, pathname, router])

  /* Handle first connection (one-shot) */
  useEffect(() => {
    if (!isConnected || ensuredSession.current || !address) return
    ensuredSession.current = true

    ;(async () => {
      try {
        const res = await fetch(`/api/auth/wallet-status?address=${address}`, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))

        if (res.ok && json?.exists && pathname === '/connect-wallet') {
          router.replace('/dashboard')
        }
      } finally {
        /* no global refresh */
      }
    })()
  }, [isConnected, address, pathname, router])

  return null
}

/* -------------------------------------------------------------------------- */
/*                       R A I N B O W K I T   T H E M E                      */
/* -------------------------------------------------------------------------- */

function RainbowKitWithTheme({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  const rkTheme =
    resolvedTheme === 'dark'
      ? darkTheme({ accentColor: '#ec5b36' })
      : lightTheme({ accentColor: '#ec5b36' })

  return (
    <RainbowKitProvider theme={rkTheme}>
      <WalletConnectionListener />
      {children}
    </RainbowKitProvider>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 P R O V I D E R                            */
/* -------------------------------------------------------------------------- */

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitWithTheme>{children}</RainbowKitWithTheme>
      </QueryClientProvider>
    </WagmiProvider>
  )
}