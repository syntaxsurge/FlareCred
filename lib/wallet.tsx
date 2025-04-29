// SPDX-License-Identifier: MIT
'use client'

import { ReactNode, useEffect, useRef } from 'react'
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { WagmiProvider, http, useAccount } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'

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
/*               W A L L E T   D I S C O N N E C T   R E D I R E C T          */
/* -------------------------------------------------------------------------- */

/**
 * Watches the wagmi account state and, when the wallet transitions from
 * connected to disconnected (e.g. user clicks "Disconnect” in RainbowKit),
 * clears the session cookie and redirects to the Connect Wallet page.
 */
function WalletDisconnectRedirect() {
  const { isConnected } = useAccount()
  const router = useRouter()
  const wasConnected = useRef(isConnected)

  useEffect(() => {
    if (wasConnected.current && !isConnected) {
      // Clear server-side session; ignore network errors
      fetch('/api/auth/signout', { method: 'POST' }).catch(() => {})
      router.push('/connect-wallet')
    }
    wasConnected.current = isConnected
  }, [isConnected, router])

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
      <WalletDisconnectRedirect />
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