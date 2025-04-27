'use client'

import { ReactNode } from 'react'
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { WagmiProvider, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTheme } from 'next-themes'

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

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
  '00000000000000000000000000000000'

const wagmiConfig = getDefaultConfig({
  appName: 'FlareCred',
  projectId,
  chains: [flare, coston2],
  transports: {
    [flare.id]: http(flare.rpcUrls.default.http[0]),
    [coston2.id]: http(coston2.rpcUrls.default.http[0]),
  },
  ssr: true,
})

const queryClient = new QueryClient()

/* -------------------------------------------------------------------------- */
/*                     R A I N B O W K I T T H E M E W R A P P E R            */
/* -------------------------------------------------------------------------- */

function RainbowKitWithTheme({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  const rkTheme =
    resolvedTheme === 'dark'
      ? darkTheme({ accentColor: '#ec5b36' })
      : lightTheme({ accentColor: '#ec5b36' })

  return <RainbowKitProvider theme={rkTheme}>{children}</RainbowKitProvider>
}

/* -------------------------------------------------------------------------- */
/*                                   PROVIDER                                 */
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