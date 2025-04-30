'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

/* -------------------------------------------------------------------------- */
/*            F I L T E R   N A V I G A T I O N   H E L P E R                 */
/* -------------------------------------------------------------------------- */

/**
 * Lightweight helper that lets filter components mutate a single query-string
 * param while **automatically batching** multiple rapid changes (e.g. slider
 * drag events) into one <code>router.push()</code> call.
 *
 * @param basePath       Static pathname (no search params) for the page.
 * @param initialParams  Seed params derived from the initial request.  These
 *                       are merged into the internal <code>URLSearchParams</code>
 *                       so the hook always starts from the current URL state.
 *
 * @returns <code>updateParam(key, value)</code> – call this for each filter
 *          change; pass an empty string to remove the param.
 */
export function useFilterNavigation(
  basePath: string,
  initialParams: Record<string, string> = {},
) {
  const router = useRouter()

  /* Internal mutable copy of the current search-params */
  const paramsRef = React.useRef<URLSearchParams>(
    new URLSearchParams(initialParams),
  )

  /* Debounce timer so we only navigate **once** per change burst */
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Transition wrapper triggers React 18 concurrent navigation */
  const [, startTransition] = React.useTransition()

  /* ---------------------------------------------------------------------- */
  /*                        N A V I G A T I O N                             */
  /* ---------------------------------------------------------------------- */

  const flush = React.useCallback(() => {
    timerRef.current = null
    const qs = paramsRef.current.toString()
    startTransition(() => {
      router.push(qs ? `${basePath}?${qs}` : basePath)
    })
  }, [router, basePath, startTransition])

  /**
   * Public API consumed by filter UIs.
   * Mutates <code>paramsRef</code> synchronously then schedules a debounced
   * navigation; multiple calls in the same tick are merged.
   */
  const updateParam = React.useCallback(
    (key: string, value: string) => {
      if (value === '' || value === undefined || value === null) {
        paramsRef.current.delete(key)
      } else {
        paramsRef.current.set(key, value)
      }

      /* Restart debounce window (150 ms) */
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flush, 150)
    },
    [flush],
  )

  /* Sync <code>paramsRef</code> when the user navigates via browser controls */
  React.useEffect(() => {
    const handlePopState = () => {
      paramsRef.current = new URLSearchParams(window.location.search)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return updateParam
}