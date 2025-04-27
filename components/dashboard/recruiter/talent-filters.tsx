'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Slider } from '@/components/ui/slider'

interface TalentFiltersProps {
  basePath: string
  /** Existing query params excluding skillMin/skillMax (e.g. sort, order, q…). */
  initialParams: Record<string, string>
  skillMin: number
  skillMax: number
  verifiedOnly: boolean
}

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

function buildLink(basePath: string, init: Record<string, string>, overrides: Record<string, any>) {
  const sp = new URLSearchParams(init)
  Object.entries(overrides).forEach(([k, v]) => {
    if (v === '' || v === false || v === undefined || v === null) {
      sp.delete(k)
    } else {
      sp.set(k, String(v))
    }
  })
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

/* -------------------------------------------------------------------------- */
/*                                   View                                     */
/* -------------------------------------------------------------------------- */

export default function TalentFilters({
  basePath,
  initialParams,
  skillMin: initialMin,
  skillMax: initialMax,
  verifiedOnly: initialVerifiedOnly,
}: TalentFiltersProps) {
  const router = useRouter()
  const [range, setRange] = useState<[number, number]>([initialMin, initialMax])
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(initialVerifiedOnly)

  /* Push updated query string whenever filters change */
  useEffect(() => {
    const [min, max] = range
    const href = buildLink(basePath, initialParams, {
      skillMin: min === 0 ? '' : min,
      skillMax: max === 100 ? '' : max,
      verifiedOnly: verifiedOnly ? '1' : '',
      page: 1, // reset pagination
    })
    router.push(href, { scroll: false })
  }, [range, verifiedOnly])

  return (
    <div className='mb-6 flex flex-wrap items-end gap-4'>
      {/* Skill‑score range */}
      <div className='flex flex-col'>
        <label htmlFor='skillRange' className='mb-2 text-sm font-medium'>
          Skill Score ({range[0]}-{range[1]})
        </label>
        <Slider
          id='skillRange'
          min={0}
          max={100}
          step={1}
          value={range}
          onValueChange={(v) =>
            setRange([
              Math.min(Math.max(0, v[0] ?? 0), 100),
              Math.max(Math.min(100, v[1] ?? 100), 0),
            ])
          }
          className='w-56'
        />
      </div>

      {/* Verified‑only toggle */}
      <div className='flex items-center gap-2 self-center pt-4'>
        <input
          id='verifiedOnly'
          type='checkbox'
          className='accent-primary size-4 cursor-pointer'
          checked={verifiedOnly}
          onChange={(e) => setVerifiedOnly(e.target.checked)}
        />
        <label htmlFor='verifiedOnly' className='cursor-pointer text-sm'>
          Verified only
        </label>
      </div>
    </div>
  )
}
