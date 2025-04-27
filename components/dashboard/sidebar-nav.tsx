'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import type { LucideIcon } from 'lucide-react'

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

export interface SidebarNavItem {
  href: string
  icon: LucideIcon
  label: string
  /** Optional numeric badge - hidden when zero/undefined */
  badgeCount?: number
}

interface SidebarNavProps {
  /** Optional small heading shown above this group */
  title?: string
  items: SidebarNavItem[]
  /** Extra classes for the wrapper */
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                            S I D E B A R   N A V                           */
/* -------------------------------------------------------------------------- */

/**
 * Vertical navigation list designed for the dashboard sidebar.
 * Active items receive a primary‐colour left border and background tint.
 * The "Pricing” entry now opens the internal pricing page in a modal
 * instead of navigating away, matching the new on-chain subscription flow.
 */
export function SidebarNav({ title, items, className }: SidebarNavProps) {
  const pathname = usePathname()
  const [pricingOpen, setPricingOpen] = useState(false)

  if (items.length === 0) return null

  return (
    <nav className={cn('mb-4', className)}>
      {title && (
        <p className='text-muted-foreground/70 mt-6 ml-3 select-none text-xs font-semibold uppercase tracking-wider'>
          {title}
        </p>
      )}

      <ul className='mt-2 space-y-1'>
        {items.map(({ href, icon: Icon, label, badgeCount }) => {
          /* Special-case the Pricing item to open an in-app modal */
          const isPricing = label === 'Pricing'
          const active =
            !isPricing &&
            (pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)))

          const commonClasses = cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-muted hover:text-foreground',
            active
              ? 'border-primary bg-muted/50 text-foreground border-l-4'
              : 'text-muted-foreground border-l-4 border-transparent',
          )

          return (
            <li key={href}>
              {isPricing ? (
                <button
                  type='button'
                  onClick={() => setPricingOpen(true)}
                  className={commonClasses}
                >
                  <Icon className='h-4 w-4 flex-shrink-0' />
                  <span className='truncate'>{label}</span>
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <span
                      className='bg-primary/90 text-primary-foreground ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none shadow'
                      aria-label={`${badgeCount} pending`}
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </button>
              ) : (
                <Link href={href} className={commonClasses}>
                  <Icon className='h-4 w-4 flex-shrink-0' />
                  <span className='truncate'>{label}</span>

                  {badgeCount !== undefined && badgeCount > 0 && (
                    <span
                      className='bg-primary/90 text-primary-foreground ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none shadow'
                      aria-label={`${badgeCount} pending`}
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </Link>
              )}
            </li>
          )
        })}
      </ul>

      {/* Pricing modal */}
      <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
        <DialogContent className='h-[90vh] w-[90vw] max-w-6xl overflow-hidden p-0'>
          <iframe
            src='/pricing'
            title='FlareCred Pricing'
            className='h-full w-full border-0'
          />
        </DialogContent>
      </Dialog>
    </nav>
  )
}