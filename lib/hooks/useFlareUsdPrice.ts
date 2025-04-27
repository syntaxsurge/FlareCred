'use client'

import { useEffect, useRef, useState } from 'react'

import { formatUsd, readFlrUsdPriceWei } from '@/lib/flare'

interface PriceState {
  usd: number | null
  stale: boolean
  loading: boolean
}

/**
 * React hook returning the latest oracle-backed FLR → USD price,
 * a staleness flag (older than 1 hour), and loading status.
 */
export function useFlareUsdPrice(): PriceState {
  const [state, setState] = useState<PriceState>({
    usd: null,
    stale: false,
    loading: true,
  })

  const lastTsRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchPrice() {
      try {
        const { priceWei, timestamp } = await readFlrUsdPriceWei()
        if (cancelled) return

        /* Avoid unnecessary re-renders */
        if (lastTsRef.current === timestamp) {
          setState((s) => ({ ...s, loading: false }))
          return
        }
        lastTsRef.current = timestamp

        const usd = formatUsd(priceWei)
        const nowSec = Math.floor(Date.now() / 1_000)
        const stale = nowSec - timestamp > 3_600

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
  }, [])

  return state
}