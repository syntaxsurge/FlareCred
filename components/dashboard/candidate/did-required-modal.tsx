'use client'

import { useRouter } from 'next/navigation'

import { KeyRound } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

/**
 * Blocking modal that cannot be dismissed; prompts the user to create a team DID.
 * Uses Shadcn AlertDialog which has no default "×” close button.
 */
export function DidRequiredModal() {
  const router = useRouter()

  return (
    <AlertDialog open={true} onOpenChange={() => {}}>
      <AlertDialogContent className='sm:max-w-sm'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2 text-rose-600'>
            <KeyRound className='h-5 w-5' />
            DID Required
          </AlertDialogTitle>
          <AlertDialogDescription>
            You need to create a Decentralised Identifier (DID) for your team before you can
            continue.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Button className='w-full' onClick={() => router.push('/candidate/create-did')}>
          Create DID
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  )
}
