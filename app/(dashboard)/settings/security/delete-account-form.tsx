'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { deleteAccount } from '@/app/(auth)/actions'
import { ActionButton } from '@/components/ui/action-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function DeleteAccountForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')

  async function handleDelete() {
    const fd = new FormData()
    fd.append('password', password)
    const res = (await deleteAccount({}, fd)) as { error?: string }
    if (!res?.error) {
      router.push('/sign-in')
    }
    return res
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className='space-y-4'>
      <div>
        <Label htmlFor='delete-password'>Confirm Password</Label>
        <Input
          id='delete-password'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          maxLength={100}
          placeholder='Enter password to confirm'
        />
      </div>

      <ActionButton onAction={handleDelete} pendingLabel='Deleting…' variant='destructive'>
        Delete Account
      </ActionButton>
    </form>
  )
}