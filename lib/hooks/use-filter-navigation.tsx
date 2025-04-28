'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { buildLink } from '@/lib/utils'

/**
 * Returns a stable handler that updates a single query-param (e.g. category/industry)
 * while preserving existing params and resetting pagination.
 */
export function useFilterNavigation(
  basePath: string,
  initialParams: Record<string, string>,
  pageKey = 'page',
) {
  const router = useRouter()

  return React.useCallback(
    (key: string, value: string) => {
      router.push(
        buildLink(basePath, initialParams, {
          [key]: value,
          [pageKey]: 1,
        }),
        { scroll: false },
      )
    },
    [basePath, initialParams, pageKey, router],
  )
}