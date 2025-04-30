import { CHAIN_ID } from '@/lib/config'

/**
 * Mapping of Flare-family chain IDs to their canonical RouteScan / FlareScan
 * explorer domains.
 *
 * Extend this map if you add support for more networks.
 */
const EXPLORER_BASE: Record<number, string> = {
  14: 'https://mainnet.flarescan.com', // Flare main-net
  19: 'https://songbird.flarescan.com', // Songbird canary-net
  16: 'https://coston.testnet.flarescan.com', // Coston test-net
  114: 'https://coston2.testnet.flarescan.com', // Coston 2 test-net
}

/**
 * Return the explorer hostname for the supplied chain ID (falls back to
 * `https://flarescan.com` when unknown).
 */
export function explorerBase(chainId: number = CHAIN_ID): string {
  return EXPLORER_BASE[chainId] ?? 'https://flarescan.com'
}

/**
 * Convenience helper that builds a full transaction URL.
 */
export function txUrl(txHash: string, chainId: number = CHAIN_ID): string {
  const base = explorerBase(chainId).replace(/\/$/, '')
  return `${base}/tx/${txHash}`
}
