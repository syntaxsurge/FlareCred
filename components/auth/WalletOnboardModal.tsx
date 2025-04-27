'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface Props {
  isConnected: boolean
  user: any | null
}

const ROLES = [
  { value: 'candidate', label: 'Candidate' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'issuer', label: 'Issuer' },
] as const

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function WalletOnboardModal({ isConnected, user }: Props) {
  const { address } = useAccount()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  /* When a wallet connects and no session user exists, open the modal */
  useEffect(() => {
    if (isConnected && !user) setOpen(true)
  }, [isConnected, user])

  /* ---------------------------------------------------------------------- */
  /*                               SUBMISSION                               */
  /* ---------------------------------------------------------------------- */

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!address) {
      toast.error('Wallet not connected.')
      return
    }

    const fd = new FormData(e.currentTarget)
    const name = fd.get('name')?.toString().trim()
    const email = fd.get('email')?.toString().trim().toLowerCase()
    const role = fd.get('role')?.toString()

    if (!name || !email || !role) {
      toast.error('Please complete all fields.')
      return
    }

    const toastId = toast.loading('Creating your account…')

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/wallet-onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, role, address }),
        })

        const json = await res.json()

        if (!res.ok || json?.error) {
          toast.error(json?.error ?? 'On-board failed.', { id: toastId })
          return
        }

        toast.success('Account created!', { id: toastId })
        setOpen(false)
        router.refresh()
      } catch (err: any) {
        toast.error(err?.message ?? 'Something went wrong.', { id: toastId })
      }
    })
  }

  /* ---------------------------------------------------------------------- */
  /*                                   UI                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>
            Complete your FlareCred profile
          </DialogTitle>
          <DialogDescription>
            Just a few details and you’re ready to go.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Name */}
          <div className='space-y-2'>
            <Label htmlFor='name'>Full name</Label>
            <Input id='name' name='name' placeholder='Jane Doe' required />
          </div>

          {/* Email */}
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              placeholder='you@example.com'
              required
            />
          </div>

          {/* Role */}
          <div className='space-y-2'>
            <Label>I am signing up as</Label>
            <RadioGroup name='role' defaultValue='candidate' className='flex gap-6'>
              {ROLES.map((r) => (
                <div key={r.value} className='flex items-center gap-2'>
                  <RadioGroupItem id={r.value} value={r.value} />
                  <Label htmlFor={r.value} className='cursor-pointer select-none'>
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Submit */}
          <Button type='submit' disabled={isPending} className='w-full'>
            {isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving…
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}