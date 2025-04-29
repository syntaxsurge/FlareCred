'use client'

import { useEffect, useRef, useState } from 'react'

import { formatUsd, readFlrUsdPriceWei } from '@/lib/contracts/flare'
import type { PriceState, UseFlareUsdPriceOptions } from '@/lib/types/hooks'

/**
 * Returns the latest FLR → USD price, a staleness flag, and loading status.
 *
 * @param options.maxAgeMs  Optional freshness window in milliseconds; defaults to 1 hour.
 */
export function useFlareUsdPrice(options?: UseFlareUsdPriceOptions): PriceState {
  const maxAgeMs = options?.maxAgeMs ?? 3_600_000 // 1 hour

  const [state, setState] = useState<PriceState>({
    usd: null,
    stale: false,
    loading: true,
  })

  const lastTimestampRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchPrice() {
      try {
        const { priceWei, timestamp } = await readFlrUsdPriceWei()
        if (cancelled) return

        /* Avoid redundant renders. */
        if (lastTimestampRef.current === timestamp) {
          setState((s) => ({ ...s, loading: false }))
          return
        }
        lastTimestampRef.current = timestamp

        const usd = formatUsd(priceWei)
        const stale = Date.now() - timestamp * 1_000 > maxAgeMs

        setState({ usd, stale, loading: false })
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }))
      }
    }

    fetchPrice()
    const id = setInterval(fetchPrice, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [maxAgeMs])

  return state
}