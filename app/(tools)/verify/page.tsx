'use client'

import React, { useState, useTransition } from 'react'
import { CheckCircle2, Clipboard, Fingerprint, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { usePublicClient } from 'wagmi'
import type { Abi } from 'viem'

import PageCard from '@/components/ui/page-card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { CHAIN_ID, DID_REGISTRY_ADDRESS } from '@/lib/config'
import { DID_REGISTRY_ABI } from '@/lib/contracts/abis'
import { extractAddressFromDid } from '@/lib/utils/address'

/* -------------------------------------------------------------------------- */
/*                                   P A G E                                   */
/* -------------------------------------------------------------------------- */

export default function VerifyDIDPage() {
  /** Bind an RPC client to the Flare network defined in env */
  const publicClient = usePublicClient({ chainId: CHAIN_ID })

  const [input, setInput] = useState('')
  const [result, setResult] = useState<'verified' | 'unregistered' | 'error' | null>(null)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  /* ----------------------------- Handlers ----------------------------- */

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!publicClient) {
      toast.error('Unsupported chain — please connect to the configured Flare network.')
      return
    }
    if (!DID_REGISTRY_ADDRESS) {
      toast.error('DID Registry address is not configured.')
      return
    }

    const addr = extractAddressFromDid(input)
    if (!addr) {
      toast.error('Enter a valid Flare DID or 0x address.')
      return
    }

    startTransition(async () => {
      try {
        const exists: boolean = (await publicClient.readContract({
          address: DID_REGISTRY_ADDRESS,
          abi: DID_REGISTRY_ABI as unknown as Abi,
          functionName: 'hasDID',
          args: [addr],
        })) as boolean

        if (exists) {
          setResult('verified')
          setMessage('This address has minted a DID on-chain.')
          toast.success('DID verified ✅')
        } else {
          setResult('unregistered')
          setMessage('No DID is registered for this address.')
          toast.info('DID not found')
        }
      } catch (err: any) {
        setResult('error')
        setMessage(
          'Error while querying the contract: ' +
            String(err?.shortMessage || err?.message || err),
        )
        toast.error('Verification failed')
      }
    })
  }

  function pasteFromClipboard() {
    navigator.clipboard
      .readText()
      .then((text) => setInput(text))
      .catch(() => toast.error('Clipboard read failed'))
  }

  /* ------------------------------- UI -------------------------------- */

  return (
    <PageCard
      icon={Fingerprint}
      title='DID Verification'
      description='Check whether a Flare Decentralised Identifier is registered on-chain.'
    >
      <div className='space-y-6'>
        <p className='text-sm leading-relaxed'>
          This tool talks directly to the&nbsp;
          <code className='rounded bg-muted px-1 py-0.5 text-xs'>DIDRegistry</code> smart contract.
          A <strong>verified DID</strong> means the address has successfully called&nbsp;
          <code className='rounded bg-muted px-1 py-0.5 text-xs'>createDID</code> and therefore
          owns a permanent, on-chain identifier (<code className='font-mono'>did:flare:0x…</code>).
          If the DID is <em>unregistered</em>, no such transaction exists.
        </p>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            required
            spellCheck={false}
            className='border-border w-full resize-y rounded-md border p-3 font-mono text-xs leading-tight'
            placeholder='did:flare:0x1234…  — or —  0x1234…'
          />

          <div className='flex flex-wrap gap-2'>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Checking…' : 'Check'}
            </Button>

            <Button
              type='button'
              variant='outline'
              onClick={pasteFromClipboard}
              title='Paste from clipboard'
            >
              <Clipboard className='mr-2 h-4 w-4' />
              Paste
            </Button>
          </div>
        </form>

        {result && (
          <div className='flex items-center gap-2'>
            {result === 'verified' ? (
              <CheckCircle2 className='h-5 w-5 text-emerald-600' />
            ) : result === 'unregistered' ? (
              <XCircle className='h-5 w-5 text-rose-600' />
            ) : (
              <XCircle className='h-5 w-5 text-yellow-600' />
            )}

            <StatusBadge status={result === 'verified' ? 'verified' : 'failed'} />
            <span>{message}</span>
          </div>
        )}
      </div>
    </PageCard>
  )
}