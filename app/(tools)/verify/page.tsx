'use client'

import React, { useState, useTransition } from 'react'

import { CheckCircle2, Clipboard, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { usePublicClient } from 'wagmi'
import { parseAbi } from 'viem'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'

/* -------------------------------------------------------------------------- */
/*                              C O N S T A N T S                             */
/* -------------------------------------------------------------------------- */

const REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_DID_REGISTRY_ADDRESS as `0x${string}` | undefined

/** Target Flare chain ID (defaults to Coston2 test-net = 114) */
const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_FLARE_CHAIN_ID ?? '114')

const DID_REGISTRY_ABI = parseAbi(['function hasDID(address owner) view returns (bool)'])

/* -------------------------------------------------------------------------- */
/*                                 U T I L S                                  */
/* -------------------------------------------------------------------------- */

/** Accepts `did:flare:0x…` or raw `0x…`, returns a checksummed address or null. */
function extractAddress(value: string): `0x${string}` | null {
  const trimmed = value.trim()
  const didMatch = trimmed.match(/^did:flare:(0x[0-9a-fA-F]{40})$/)
  if (didMatch) return didMatch[1] as `0x${string}`
  const rawMatch = trimmed.match(/^0x[0-9a-fA-F]{40}$/)
  if (rawMatch) return rawMatch[0] as `0x${string}`
  return null
}

/* -------------------------------------------------------------------------- */
/*                                   V I E W                                  */
/* -------------------------------------------------------------------------- */

export default function VerifyIdPage() {
  /* Bind the public client to the Flare test-net / main-net specified in env */
  const publicClient = usePublicClient({ chainId: TARGET_CHAIN_ID })

  const [value, setValue] = useState('')
  const [result, setResult] = useState<'verified' | 'failed' | null>(null)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!publicClient) {
      toast.error('Unsupported chain—please connect to the correct Flare network and retry.')
      return
    }
    if (!REGISTRY_ADDRESS) {
      toast.error('Registry address not configured.')
      return
    }

    const addr = extractAddress(value)
    if (!addr) {
      toast.error('Enter a valid Flare DID or 0x address.')
      return
    }

    startTransition(async () => {
      try {
        const exists: boolean = await publicClient.readContract({
          address: REGISTRY_ADDRESS,
          abi: DID_REGISTRY_ABI,
          functionName: 'hasDID',
          args: [addr],
        })

        if (exists) {
          setResult('verified')
          setMessage('ID is registered on-chain.')
          toast.success('ID verified ✔')
        } else {
          setResult('failed')
          setMessage('No DID found for this address.')
          toast.error('ID not verified')
        }
      } catch (err: any) {
        setResult('failed')
        setMessage(
          'Error querying contract: ' + String(err?.shortMessage || err?.message || err),
        )
        toast.error('Verification error')
      }
    })
  }

  function pasteFromClipboard() {
    navigator.clipboard
      .readText()
      .then((text) => setValue(text))
      .catch(() => toast.error('Clipboard read failed'))
  }

  return (
    <section className='space-y-6'>
      <header className='max-w-2xl space-y-2'>
        <h1 className='text-3xl font-extrabold tracking-tight'>Verify ID</h1>
        <p className='text-muted-foreground text-sm'>
          Enter a <strong>Flare DID</strong> (<code>did:flare:0x…</code>) or raw{' '}
          <strong>0x address</strong> to check if it has been registered.
        </p>
      </header>

      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle className='text-lg font-medium'>ID Verification Tool</CardTitle>
        </CardHeader>

        <CardContent className='space-y-4'>
          <form onSubmit={handleVerify} className='space-y-4'>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={3}
              required
              spellCheck={false}
              className='border-border w-full resize-y rounded-md border p-3 font-mono text-xs leading-tight'
              placeholder='did:flare:0x1234…  — or —  0x1234…'
            />

            <div className='flex flex-wrap gap-2'>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Verifying…' : 'Verify'}
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
              ) : (
                <XCircle className='h-5 w-5 text-rose-600' />
              )}
              <StatusBadge status={result} />
              <span>{message}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}