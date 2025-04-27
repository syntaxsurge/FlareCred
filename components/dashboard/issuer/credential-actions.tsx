'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useActionState, startTransition } from 'react'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  approveCredentialAction,
  rejectCredentialAction,
  unverifyCredentialAction,
} from '@/app/(dashboard)/issuer/credentials/actions'
import { Button } from '@/components/ui/button'
import { CredentialStatus } from '@/lib/db/schema/candidate'

type ActionState = { error?: string; success?: string }

interface Props {
  credentialId: number
  status: CredentialStatus
}

export function CredentialActions({ credentialId, status }: Props) {
  const router = useRouter()

  /* ------------------ approve ------------------ */
  const [approveState, approve, approving] = useActionState<ActionState, FormData>(
    approveCredentialAction,
    { error: '', success: '' },
  )

  /* ------------------- reject ------------------ */
  const [rejectState, reject, rejecting] = useActionState<ActionState, FormData>(
    rejectCredentialAction,
    { error: '', success: '' },
  )

  /* ------------------ unverify ----------------- */
  const [unverifyState, unverify, unverifying] = useActionState<ActionState, FormData>(
    unverifyCredentialAction,
    { error: '', success: '' },
  )

  /* ---------------- effects -------------------- */
  const states = [approveState, rejectState, unverifyState]
  React.useEffect(() => {
    states.forEach((s) => {
      if (s.error) toast.error(s.error)
      if (s.success) toast.success(s.success)
    })
  }, [states])

  React.useEffect(() => {
    if (approveState.success || rejectState.success || unverifyState.success) {
      router.push('/issuer/requests')
    }
  }, [approveState.success, rejectState.success, unverifyState.success, router])

  /* ---------------- helpers -------------------- */
  function run(
    e: React.FormEvent<HTMLFormElement>,
    fn: typeof approve | typeof reject | typeof unverify,
  ) {
    e.preventDefault()
    const fd = new FormData()
    fd.append('credentialId', credentialId.toString())
    startTransition(() => fn(fd))
  }

  /* ---------------- UI blocks ------------------ */
  /* Pending — approve & reject */
  if (status === CredentialStatus.PENDING || status === CredentialStatus.UNVERIFIED) {
    return (
      <div className='flex flex-wrap gap-4'>
        {/* Approve */}
        <form onSubmit={(e) => run(e, approve)}>
          <Button type='submit' disabled={approving}>
            {approving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing…
              </>
            ) : (
              'Approve & Sign VC'
            )}
          </Button>
        </form>

        {/* Reject */}
        <form onSubmit={(e) => run(e, reject)}>
          <Button type='submit' variant='destructive' disabled={rejecting}>
            {rejecting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing…
              </>
            ) : (
              'Reject'
            )}
          </Button>
        </form>
      </div>
    )
  }

  /* Rejected — allow re-approve */
  if (status === CredentialStatus.REJECTED) {
    return (
      <form onSubmit={(e) => run(e, approve)}>
        <Button type='submit' disabled={approving}>
          {approving ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Processing…
            </>
          ) : (
            'Approve & Sign VC'
          )}
        </Button>
      </form>
    )
  }

  /* Verified — unverify or reject */
  if (status === CredentialStatus.VERIFIED) {
    return (
      <div className='flex flex-wrap gap-4'>
        {/* Unverify */}
        <form onSubmit={(e) => run(e, unverify)}>
          <Button type='submit' variant='outline' disabled={unverifying}>
            {unverifying ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing…
              </>
            ) : (
              'Unverify'
            )}
          </Button>
        </form>

        {/* Reject */}
        <form onSubmit={(e) => run(e, reject)}>
          <Button type='submit' variant='destructive' disabled={rejecting}>
            {rejecting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing…
              </>
            ) : (
              'Reject'
            )}
          </Button>
        </form>
      </div>
    )
  }

  /* Fallback (should never render) */
  return null
}
