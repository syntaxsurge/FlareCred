'use client'

import { useState } from 'react'

import { Slider } from '@/components/ui/slider'
import { useFilterNavigation } from '@/lib/hooks/use-filter-navigation'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface TalentFiltersProps {
  basePath: string
  /** Existing query params excluding skillMin/skillMax (e.g. sort, order, q…). */
  initialParams: Record<string, string>
  skillMin: number
  skillMax: number
  verifiedOnly: boolean
}

/* -------------------------------------------------------------------------- */
/*                                   View                                     */
/* -------------------------------------------------------------------------- */

export default function TalentFilters({
  basePath,
  initialParams,
  skillMin: initialMin,
  skillMax: initialMax,
  verifiedOnly: initialVerifiedOnly,
}: TalentFiltersProps) {
  /* Local state mirrors the current URL so the UI reflects external changes */
  const [range, setRange] = useState<[number, number]>([initialMin, initialMax])
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(initialVerifiedOnly)

  /* ---------------------------------------------------------------------- */
  /*                Centralised filter-param navigation helper              */
  /* ---------------------------------------------------------------------- */
  const pushFilter = useFilterNavigation(basePath, initialParams)

  /* ---------------------------------------------------------------------- */
  /*                               Handlers                                 */
  /* ---------------------------------------------------------------------- */

  function handleRangeChange(v: [number, number]) {
    setRange(v)
    const [min, max] = v
    pushFilter('skillMin', min === 0 ? '' : String(min))
    pushFilter('skillMax', max === 100 ? '' : String(max))
  }

  function toggleVerified(checked: boolean) {
    setVerifiedOnly(checked)
    pushFilter('verifiedOnly', checked ? '1' : '')
  }

  /* ---------------------------------------------------------------------- */
  /*                                 UI                                     */
  /* ---------------------------------------------------------------------- */
  return (
    <div className='mb-6 flex flex-wrap items-end gap-4'>
      {/* Skill-score range */}
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
          onValueChange={handleRangeChange}
          className='w-56'
        />
      </div>

      {/* Verified-only toggle */}
      <div className='flex items-center gap-2 self-center pt-4'>
        <input
          id='verifiedOnly'
          type='checkbox'
          className='accent-primary size-4 cursor-pointer'
          checked={verifiedOnly}
          onChange={(e) => toggleVerified(e.target.checked)}
        />
        <label htmlFor='verifiedOnly' className='cursor-pointer text-sm'>
          Verified only
        </label>
      </div>
    </div>
  )
}