'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAccount, useSignMessage } from 'wagmi'

import { Button } from '@/components/ui/button'

/**
 * Prompts the user to sign a message with their wallet and, on success,
 * calls the backend delete-account route to permanently delete the account.
 */
export default function DeleteAccountForm() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleDelete() {
    if (isPending) return
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first.')
      return
    }

    const message = `I confirm deletion of my FlareCred account (${address}) at ${new Date().toISOString()}`
    const toastId = toast.loading('Awaiting wallet signature…')

    startTransition(async () => {
      try {
        const signature = await signMessageAsync({ message })

        toast.loading('Deleting account…', { id: toastId })

        const res = await fetch('/api/auth/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, message, signature }),
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok || data?.error) {
          throw new Error(data?.error ?? 'Account deletion failed.')
        }

        toast.success('Account deleted.', { id: toastId })
        router.push('/')
        router.refresh()
      } catch (err: any) {
        toast.error(err?.message ?? 'Signature rejected or transaction failed.', { id: toastId })
      }
    })
  }

  return (
    <Button
      variant='destructive'
      onClick={handleDelete}
      disabled={isPending}
      className='w-max whitespace-nowrap'
    >
      {isPending ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Deleting…
        </>
      ) : (
        'Delete Account'
      )}
    </Button>
  )
}