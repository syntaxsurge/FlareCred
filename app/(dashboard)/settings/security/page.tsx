'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Shield } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PageCard from '@/components/ui/page-card'
import { useUser } from '@/lib/auth'

import DeleteAccountForm from './delete-account-form'

export default function SecurityPage() {
  const { userPromise } = useUser()
  const router = useRouter()

  /* Redirect unauthenticated viewers */
  useEffect(() => {
    userPromise.then((u) => {
      if (!u) router.replace('/connect-wallet')
    })
  }, [userPromise, router])

  return (
    <PageCard
      icon={Shield}
      title='Security Settings'
      description='Manage critical security actions for your account.'
    >
      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground mb-4 text-sm'>
            Deleting your account is <strong>permanent</strong>. You will be asked to sign a
            confirmation message with your connected wallet; once confirmed, all data associated
            with your profile will be removed.
          </p>
          <DeleteAccountForm />
        </CardContent>
      </Card>
    </PageCard>
  )
}
