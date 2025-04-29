'use client'

import * as React from 'react'
import { useState, useEffect, useTransition } from 'react'

import { Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAccount, useSwitchChain, useWalletClient, usePublicClient } from 'wagmi'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CREDENTIAL_NFT_ADDRESS, CHAIN_ID } from '@/lib/config'
import { CREDENTIAL_NFT_ABI } from '@/lib/contracts/abis'
import type { QuizMeta as Quiz } from '@/lib/types/components'
import { copyToClipboard } from '@/lib/utils'

import { startQuizAction } from './actions'

/* -------------------------------------------------------------------------- */
/*                     Deterministic seed-based shuffle                       */
/* -------------------------------------------------------------------------- */

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], seedHex: string): T[] {
  const out = [...arr]
  const seedInt = Number.parseInt(seedHex.slice(2, 10), 16) || 1
  const rand = mulberry32(seedInt)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function StartQuizForm({ quiz }: { quiz: Quiz }) {
  const { isConnected, address, chain } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  /* Quiz state --------------------------------------------------------- */
  const [seed, setSeed] = useState<string>('')
  const [question, setQuestion] = useState<{ id: number; prompt: string } | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [vcHash, setVcHash] = useState<string>('')
  const [signature, setSignature] = useState<string>('')

  /* -------------------------------------------------------------------- */
  /*         Fetch RNG seed + derive deterministic question order         */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    if (!open) return

    setSeed('')
    setQuestion(null)
    setScore(null)
    setMessage('')
    setVcHash('')
    setSignature('')

    const abort = new AbortController()

    ;(async () => {
      try {
        const res = await fetch('/api/rng-seed?max=1', { signal: abort.signal })
        if (!res.ok) throw new Error(await res.text())
        const { seed: s } = (await res.json()) as { seed: string }
        setSeed(s)

        const shuffled = shuffle(quiz.questions, s)
        setQuestion(shuffled[0] || null)
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to obtain RNG seed')
        setOpen(false)
      }
    })()

    return () => abort.abort()
  }, [open, quiz.questions])

  /* -------------------------------------------------------------------- */
  /*                         Mint credential helper                       */
  /* -------------------------------------------------------------------- */
  async function mintCredential(hash: string, sig: string) {
    if (!walletClient || !address) {
      toast.error('Connect your wallet first.')
      return
    }

    if (chain?.id !== CHAIN_ID) {
      await switchChainAsync({ chainId: CHAIN_ID })
    }

    const toastId = toast.loading('Requesting signature…')
    try {
      const txHash = await walletClient.writeContract({
        address: CREDENTIAL_NFT_ADDRESS,
        abi: CREDENTIAL_NFT_ABI,
        functionName: 'mintCredential',
        args: [address, hash, '', sig],
      })
      toast.loading(`Tx sent: ${txHash.slice(0, 10)}…`, { id: toastId })
      await publicClient?.waitForTransactionReceipt({ hash: txHash })
      toast.success('Skill Pass credential minted!', { id: toastId })
    } catch (err: any) {
      toast.error(err?.message ?? 'Minting failed.', { id: toastId })
    }
  }

  /* -------------------------------------------------------------------- */
  /*                          Submit quiz answer                          */
  /* -------------------------------------------------------------------- */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const toastId = toast.loading('Submitting your answer…')

    startTransition(async () => {
      try {
        const res: any = await startQuizAction(fd)
        if (!res) throw new Error('No response')

        setScore(res.score)
        setMessage(res.message)
        toast.success(res.message, { id: toastId })

        if (res.passed && res.vcHash && res.signature) {
          setVcHash(res.vcHash)
          setSignature(res.signature)
          await mintCredential(res.vcHash, res.signature)
        }
      } catch (err: any) {
        toast.error(err?.message ?? 'Something went wrong.', { id: toastId })
      }
    })
  }

  /* -------------------------------------------------------------------- */
  /*                                UI                                    */
  /* -------------------------------------------------------------------- */
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='w-full'>Take Quiz</Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{quiz.title}</DialogTitle>
          {quiz.description && (
            <DialogDescription className='line-clamp-3'>
              {quiz.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {score === null ? (
          /* ----------------------- Quiz form ------------------------------ */
          <form onSubmit={handleSubmit} className='space-y-4'>
            <input type='hidden' name='quizId' value={quiz.id} />
            <input type='hidden' name='seed' value={seed} />
            {question && <input type='hidden' name='questionId' value={question.id} />}

            {question ? (
              <p className='font-medium'>{question.prompt}</p>
            ) : (
              <p className='text-muted-foreground'>Loading question…</p>
            )}

            <div>
              <label
                htmlFor={`answer-${quiz.id}`}
                className='mb-1 block text-sm font-medium'
              >
                Your Answer
              </label>
              <textarea
                id={`answer-${quiz.id}`}
                name='answer'
                rows={6}
                required
                className='border-border focus-visible:ring-primary w-full rounded-md border p-2 text-sm focus-visible:ring-2'
                placeholder='Type your answer here…'
              />
            </div>

            <Button type='submit' disabled={isPending || !seed || !question} className='w-max'>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Submitting…
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          </form>
        ) : (
          /* ---------------------- Result panel ---------------------------- */
          <div className='flex flex-col items-center gap-4 py-6'>
            <p className='text-primary text-4xl font-extrabold'>{score}</p>
            <p className='text-center'>{message}</p>

            <div className='flex items-center gap-2'>
              <span className='bg-muted rounded-md px-2 py-1 font-mono text-xs'>{seed}</span>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => copyToClipboard(seed)}
              >
                <Copy className='h-4 w-4' />
                <span className='sr-only'>Copy seed</span>
              </Button>
            </div>

            <Button variant='outline' onClick={() => setScore(null)}>
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}