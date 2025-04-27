'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { LucideIcon } from 'lucide-react'

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
 * Active items receive a primary-colour left border and background tint.
 */
export function SidebarNav({ title, items, className }: SidebarNavProps) {
  const pathname = usePathname()

  if (items.length === 0) return null

  return (
    <nav className={cn('mb-4', className)}>
      {title && (
        <p className='text-muted-foreground/70 mt-6 ml-3 text-xs font-semibold tracking-wider uppercase select-none'>
          {title}
        </p>
      )}

      <ul className='mt-2 space-y-1'>
        {items.map(({ href, icon: Icon, label, badgeCount }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-muted hover:text-foreground',
                  active
                    ? 'border-primary bg-muted/50 text-foreground border-l-4'
                    : 'text-muted-foreground border-l-4 border-transparent',
                )}
              >
                <Icon className='h-4 w-4 flex-shrink-0' />
                <span className='truncate'>{label}</span>

                {badgeCount !== undefined && badgeCount > 0 && (
                  <span
                    className='bg-primary/90 text-primary-foreground ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] leading-none font-semibold shadow'
                    aria-label={`${badgeCount} pending`}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
