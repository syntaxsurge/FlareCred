'use client'

import { useState } from 'react'

import { updatePassword } from '@/app/(auth)/actions'
import { ActionButton } from '@/components/ui/action-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UpdatePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleUpdate() {
    const fd = new FormData()
    fd.append('currentPassword', currentPassword)
    fd.append('newPassword', newPassword)
    fd.append('confirmPassword', confirmPassword)
    const res = await updatePassword({}, fd)
    if (res?.success) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    return res
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className='space-y-4'>
      <div>
        <Label htmlFor='current-password'>Current Password</Label>
        <Input
          id='current-password'
          type='password'
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          minLength={8}
          maxLength={100}
          placeholder='Enter current password'
        />
      </div>

      <div>
        <Label htmlFor='new-password'>New Password</Label>
        <Input
          id='new-password'
          type='password'
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          maxLength={100}
          placeholder='Enter new password'
        />
      </div>

      <div>
        <Label htmlFor='confirm-password'>Confirm New Password</Label>
        <Input
          id='confirm-password'
          type='password'
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          maxLength={100}
          placeholder='Confirm your new password'
        />
      </div>

      <ActionButton onAction={handleUpdate} pendingLabel='Updating…'>
        Update Password
      </ActionButton>
    </form>
  )
}
