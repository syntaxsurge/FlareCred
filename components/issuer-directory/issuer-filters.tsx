'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

interface Props {
  basePath: string
  initialParams: Record<string, string>
  categories: string[]
  industries: string[]
  selectedCategory: string
  selectedIndustry: string
}

/* -------------------------------------------------------------------------- */
/*                                Helpers                                     */
/* -------------------------------------------------------------------------- */

function buildLink(basePath: string, init: Record<string, string>, overrides: Record<string, any>) {
  const sp = new URLSearchParams(init)
  Object.entries(overrides).forEach(([k, v]) => {
    if (v === '' || v == null) {
      sp.delete(k) // remove when blank / reset
    } else {
      sp.set(k, String(v))
    }
  })
  // Always reset to first page on filter change
  sp.delete('page')
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

/* -------------------------------------------------------------------------- */
/*                                   View                                     */
/* -------------------------------------------------------------------------- */

export default function IssuerFilters({
  basePath,
  initialParams,
  categories,
  industries,
  selectedCategory,
  selectedIndustry,
}: Props) {
  const router = useRouter()

  function handleChange(type: 'category' | 'industry', value: string) {
    const href = buildLink(basePath, initialParams, { [type]: value })
    router.push(href, { scroll: false })
  }

  return (
    <div className='flex flex-wrap items-center gap-4'>
      {/* Category */}
      <div className='flex flex-col gap-1'>
        <label htmlFor='category' className='text-muted-foreground text-xs font-medium uppercase'>
          Category
        </label>
        <select
          id='category'
          value={selectedCategory}
          onChange={(e) => handleChange('category', e.target.value)}
          className='h-10 rounded-md border px-3 text-sm capitalize'
        >
          <option value=''>All categories</option>
          {categories.map((c) => (
            <option key={c} value={c} className='capitalize'>
              {c.replaceAll('_', ' ').toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Industry */}
      <div className='flex flex-col gap-1'>
        <label htmlFor='industry' className='text-muted-foreground text-xs font-medium uppercase'>
          Industry
        </label>
        <select
          id='industry'
          value={selectedIndustry}
          onChange={(e) => handleChange('industry', e.target.value)}
          className='h-10 rounded-md border px-3 text-sm capitalize'
        >
          <option value=''>All industries</option>
          {industries.map((i) => (
            <option key={i} value={i} className='capitalize'>
              {i.toLowerCase()}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
