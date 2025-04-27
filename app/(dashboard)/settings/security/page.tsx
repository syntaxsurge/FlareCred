'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Shield } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PageCard from '@/components/ui/page-card'
import { useUser } from '@/lib/auth'

import DeleteAccountForm from './delete-account-form'
import UpdatePasswordForm from './update-password-form'

export default function SecurityPage() {
  const { userPromise } = useUser()
  const router = useRouter()

  useEffect(() => {
    userPromise.then((u) => {
      if (!u) router.replace('/sign-in')
    })
  }, [userPromise, router])

  return (
    <PageCard
      icon={Shield}
      title='Security Settings'
      description='Manage your password and account security.'
    >
      <div className='space-y-8'>
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent>
            <UpdatePasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground mb-4 text-sm'>
              Account deletion is non-reversible. Please proceed with caution.
            </p>
            <DeleteAccountForm />
          </CardContent>
        </Card>
      </div>
    </PageCard>
  )
}
