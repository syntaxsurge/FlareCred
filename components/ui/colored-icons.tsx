'use client'

import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldX,
  type LucideProps,
} from 'lucide-react'

/**
 * Shared coloured icon variants.
 * Import these wrappers instead of redefining coloured icons in table components.
 */

export const AcceptIcon = ({ className, ...props }: LucideProps) => (
  <CheckCircle2
    {...props}
    className={cn('mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400', className)}
  />
)

export const DeclineIcon = ({ className, ...props }: LucideProps) => (
  <XCircle
    {...props}
    className={cn('mr-2 h-4 w-4 text-amber-600 dark:text-amber-400', className)}
  />
)

export const VerifyIcon = ({ className, ...props }: LucideProps) => (
  <ShieldCheck
    {...props}
    className={cn('mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400', className)}
  />
)

export const UnverifyIcon = ({ className, ...props }: LucideProps) => (
  <ShieldX
    {...props}
    className={cn('mr-2 h-4 w-4 text-amber-600 dark:text-amber-400', className)}
  />
)

export const RejectIcon = ({ className, ...props }: LucideProps) => (
  <XCircle
    {...props}
    className={cn('mr-2 h-4 w-4 text-rose-600 dark:text-rose-400', className)}
  />
)