'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Clipboard, Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/utils'
import { generateCandidateFit } from '@/app/(tools)/recruiter/actions'

export default function GenerateFitButton({
  candidateId,
  onGenerated,
}: {
  candidateId: number
  onGenerated?: (json: string) => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function handleClick() {
    const tId = toast.loading('Analysing fit…')
    start(async () => {
      try {
        const result = await generateCandidateFit(candidateId)
        copyToClipboard(result)
        onGenerated?.(result)
        toast.success('Fit summary copied to clipboard.', { id: tId, icon: <Clipboard /> })
        router.refresh()
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to generate fit summary.', { id: tId })
      }
    })
  }

  return (
    <Button onClick={handleClick} disabled={pending} variant='outline' size='sm' className='gap-2'>
      {pending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Sparkles className='h-4 w-4' />}
      Why Hire
    </Button>
  )
}
  const [pending, start] = useTransition()

  function handleClick() {
    const tId = toast.loading('Analysing fit…')
    start(async () => {
      try {
        const result = await generateCandidateFit(candidateId)
        copyToClipboard(result)
        toast.success('Fit summary copied to clipboard.', { id: tId, icon: <Clipboard /> })
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to generate fit summary.', { id: tId })
      }
    })
  }

  return (
    <Button onClick={handleClick} disabled={pending} variant='outline' size='sm' className='gap-2'>
      {pending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Sparkles className='h-4 w-4' />}
      Why Hire
    </Button>
  )
}