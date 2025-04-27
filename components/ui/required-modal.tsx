'use client'

import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import React from 'react'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

/* -------------------------------------------------------------------------- */
/*                                 Icons Map                                  */
/* -------------------------------------------------------------------------- */

import { UserRound, KeyRound, Bot, Star } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  userround: UserRound,
  keyround: KeyRound,
  Bot,
  star: Star,
}

/* -------------------------------------------------------------------------- */
/*                                  Props                                     */
/* -------------------------------------------------------------------------- */

export interface RequiredModalProps {
  /** Direct LucideIcon component (only use inside client components) */
  icon?: LucideIcon
  /** String identifier looked up in ICON_MAP (safe for server ⇒ client) */
  iconKey?: string
  /** Bold heading shown at the top */
  title: string
  /** Make the header clickable (default = false) */
  headerClickable?: boolean
  /** Optional click handler for the header (only used when `headerClickable` is true) */
  onHeaderClick?: () => void
  /** Helper text under the title */
  description?: string
  /** CTA label (ignored when `children` passed) */
  buttonText?: string
  /** Route pushed on CTA click (ignored when `children` passed) */
  redirectTo?: string
  /** Optional custom body; when provided, default button section is omitted */
  children?: React.ReactNode
}

/* -------------------------------------------------------------------------- */
/*                                   Modal                                    */
/* -------------------------------------------------------------------------- */

/**
 * A non-dismissable modal used whenever the user must complete
 * an action before continuing. Icons can be supplied via `icon`
 * (client-only) or `iconKey` (server-safe string identifier).
 * Set `headerClickable` to true (optionally with `onHeaderClick`)
 * to make the title area interactable.
 */
export function RequiredModal({
  icon,
  iconKey,
  title,
  headerClickable = false,
  onHeaderClick,
  description,
  buttonText,
  redirectTo,
  children,
}: RequiredModalProps) {
  const router = useRouter()

  /* Resolve icon priority: explicit component ▶︎ mapped key ▶︎ none */
  const Icon = icon ?? (iconKey ? ICON_MAP[iconKey.toLowerCase()] : undefined)

  return (
    <AlertDialog open onOpenChange={() => {}}>
      <AlertDialogContent className='sm:max-w-md'>
        <AlertDialogHeader>
          <AlertDialogTitle
            className={`flex items-center gap-2 ${headerClickable ? 'cursor-pointer' : ''}`}
            onClick={headerClickable ? onHeaderClick : undefined}
          >
            {Icon && <Icon className='h-5 w-5 text-rose-600' />}
            {title}
          </AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>

        {/* Custom content overrides default button */}
        {children ? (
          <div className='pt-4'>{children}</div>
        ) : (
          <Button
            className='w-full'
            onClick={() => redirectTo && router.push(redirectTo)}
            autoFocus
          >
            {buttonText || 'Continue'}
          </Button>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}