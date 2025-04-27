'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { updateAccount } from '@/app/(auth)/actions'
import { ActionButton } from '@/components/ui/action-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  defaultName: string
  defaultEmail: string
}

export default function GeneralForm({ defaultName, defaultEmail }: Props) {
  const router = useRouter()
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)

  async function handleSave() {
    const fd = new FormData()
    fd.append('name', name)
    fd.append('email', email)
    const res = await updateAccount({}, fd)
    if (res?.success) router.refresh()
    return res
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className='space-y-4'>
      <div>
        <Label htmlFor='name'>Name</Label>
        <Input
          id='name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder='Enter your name'
        />
      </div>

      <div>
        <Label htmlFor='email'>Email</Label>
        <Input
          id='email'
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder='Enter your email'
        />
      </div>

      <ActionButton onAction={handleSave} pendingLabel='Saving…'>
        Save Changes
      </ActionButton>
    </form>
  )
}
