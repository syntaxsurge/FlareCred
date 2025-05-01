'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Clipboard, Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/utils'
import { generateCandidateFit } from '@/app/(tools)/recruiter/actions'

interface GenerateFitButtonProps {
  candidateId: number
  onGenerated?: (json: string) => void
}

/**
 * Async button that generates an AI "Why Hire" fit summary for the specified
 * candidate, copies it to the clipboard and refreshes the page to surface
 * cached data for subsequent renders.
 */
export default function GenerateFitButton({
  candidateId,
  onGenerated,
}: GenerateFitButtonProps) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function handleClick() {
    const toastId = toast.loading('Analysing fit…')
    start(async () => {
      try {
        const result = await generateCandidateFit(candidateId)
        copyToClipboard(result)
        onGenerated?.(result)
        toast.success('Fit summary copied to clipboard.', {
          id: toastId,
          icon: <Clipboard />,
        })
        router.refresh()
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to generate fit summary.', { id: toastId })
      }
    })
  }

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      Why Hire
    </Button>
  )
}