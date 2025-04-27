'use client'

import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export interface RequiredModalProps {
  /** Icon to render beside the title */
  icon: LucideIcon
  /** Bold heading shown at the top */
  title: string
  /** Descriptive helper text */
  description: string
  /** Label for the CTA button */
  buttonText: string
  /** Destination route pushed when the button is clicked */
  redirectTo: string
}

/**
 * A generic, non-dismissible modal used whenever the user must complete a
 * prerequisite step (e.g. create a DID, fill in a profile) before continuing.
 */
export function RequiredModal({
  icon: Icon,
  title,
  description,
  buttonText,
  redirectTo,
}: RequiredModalProps) {
  const router = useRouter()

  return (
    <AlertDialog open={true} /* prevent outside dismissal */ onOpenChange={() => {}}>
      <AlertDialogContent className='sm:max-w-sm'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2 text-rose-600'>
            <Icon className='h-5 w-5' />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <Button className='w-full' onClick={() => router.push(redirectTo)}>
          {buttonText}
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  )
}