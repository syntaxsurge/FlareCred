'use client'

import { useRouter } from 'next/navigation'
import { UserRound } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

/**
 * Blocking modal displayed when a candidate profile record does not yet exist.
 * Prompts the user to complete their profile before using Highlights.
 */
export function ProfileRequiredModal() {
  const router = useRouter()

  return (
    <AlertDialog open={true} onOpenChange={() => {}}>
      <AlertDialogContent className='sm:max-w-sm'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2 text-rose-600'>
            <UserRound className='h-5 w-5' />
            Profile Required
          </AlertDialogTitle>
          <AlertDialogDescription>
            Please complete your candidate profile before accessing Profile Highlights.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Button className='w-full' onClick={() => router.push('/candidate/profile')}>
          Complete Profile
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  )
}