'use client'

import * as React from 'react'
import { useState, useEffect, useTransition } from 'react'

import { Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { QuizMeta as Quiz } from '@/lib/types/components'
import { copyToClipboard } from '@/lib/utils'

import { startQuizAction } from './actions'

/* -------------------------------------------------------------------------- */
/*                                    VIEW                                    */
/* -------------------------------------------------------------------------- */

/**
 * Renders a "Take Quiz” button that opens a modal, fetches a verifiable RNG
 * seed, and embeds it in the submission so the attempt can be reproduced.
 */
export default function StartQuizForm({ quiz }: { quiz: Quiz }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  /* Quiz result state ----------------------------------------------------- */
  const [score, setScore] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [seed, setSeed] = useState<string>('')

  /* ---------------------------------------------------------------------- */
  /*      Fetch seed when dialog opens so UI & hidden input can use it      */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!open) return

    /* Reset previous state */
    setSeed('')
    setScore(null)
    setMessage('')

    const abort = new AbortController()

    ;(async () => {
      try {
        /* NOTE: current quizzes are free-text so we pass max=1; adjust if
           multiple-question arrays are introduced later.                    */
        const res = await fetch(`/api/rng-seed?max=1`, { signal: abort.signal })
        if (!res.ok) throw new Error(await res.text())
        const { seed: s } = (await res.json()) as { seed: string }
        setSeed(s)
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to obtain RNG seed')
        /* Close dialog if seed unavailable */
        setOpen(false)
      }
    })()

    return () => abort.abort()
  }, [open])

  /* ---------------------------------------------------------------------- */
  /*                            Submit handler                              */
  /* ---------------------------------------------------------------------- */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const toastId = toast.loading('Submitting your answer…')

    startTransition(async () => {
      try {
        const res = await startQuizAction(fd)
        if (res) {
          setScore(res.score)
          setMessage(res.message)
          res.score >= 70
            ? toast.success(res.message, { id: toastId })
            : toast.info(res.message, { id: toastId })
        } else {
          toast.error('No response from server.', { id: toastId })
        }
      } catch (err: any) {
        toast.error(err?.message ?? 'Something went wrong.', { id: toastId })
      }
    })
  }

  /* ---------------------------------------------------------------------- */
  /*                            Render dialog                               */
  /* ---------------------------------------------------------------------- */
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='w-full'>Take Quiz</Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{quiz.title}</DialogTitle>
          {quiz.description && (
            <DialogDescription className='line-clamp-3'>{quiz.description}</DialogDescription>
          )}
        </DialogHeader>

        {score === null ? (
          /* ----------------------- Quiz form ------------------------------ */
          <form onSubmit={handleSubmit} className='space-y-4'>
            <input type='hidden' name='quizId' value={quiz.id} />
            <input type='hidden' name='seed' value={seed} />

            <div>
              <label htmlFor={`answer-${quiz.id}`} className='mb-1 block text-sm font-medium'>
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

            <Button type='submit' disabled={isPending || !seed} className='w-max'>
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

            {/* Seed display / copy */}
            <div className='flex items-center gap-2'>
              <span className='bg-muted rounded-md px-2 py-1 font-mono text-xs'>{seed}</span>
              <Button variant='ghost' size='icon' onClick={() => copyToClipboard(seed)}>
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
