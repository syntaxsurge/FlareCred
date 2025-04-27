'use client'

import * as React from 'react'
import { useTransition } from 'react'

import { Loader2 } from 'lucide-react'
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

import { startQuizAction } from './actions'

interface Quiz {
  id: number
  title: string
  description?: string | null
}

/**
 * Renders a “Take Quiz” button that opens a modal for answering the quiz.
 * After submission, the AI-graded score and message are shown with a retry option.
 */
export default function StartQuizForm({ quiz }: { quiz: Quiz }) {
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = useTransition()
  const [score, setScore] = React.useState<number | null>(null)
  const [message, setMessage] = React.useState('')

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

  /* Reset local state whenever the dialog closes */
  React.useEffect(() => {
    if (!open) {
      setScore(null)
      setMessage('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='w-full'>Take Quiz</Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{quiz.title}</DialogTitle>
          {quiz.description && (
            <DialogDescription className='line-clamp-3'>{quiz.description}</DialogDescription>
          )}
        </DialogHeader>

        {score === null ? (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <input type='hidden' name='quizId' value={quiz.id} />
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
            <Button type='submit' disabled={isPending} className='w-max'>
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
          <div className='flex flex-col items-center gap-4 py-6'>
            <p className='text-primary text-4xl font-extrabold'>{score}</p>
            <p className='text-center'>{message}</p>
            <Button variant='outline' onClick={() => setScore(null)}>
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
