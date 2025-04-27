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
/*                                  Props                                     */
/* -------------------------------------------------------------------------- */

export interface RequiredModalProps {
  /** Optional icon rendered before the title */
  icon?: LucideIcon
  /** Bold heading shown at the top */
  title: string
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
 * an action before continuing. It now supports arbitrary children
 * (e.g. forms) while retaining the original one-button variant.
 */
export function RequiredModal({
  icon: Icon,
  title,
  description,
  buttonText,
  redirectTo,
  children,
}: RequiredModalProps) {
  const router = useRouter()

  return (
    <AlertDialog open={true} onOpenChange={() => {}}>
      <AlertDialogContent
        className='sm:max-w-md'
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
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