'use client'

import { useState, useTransition, type ReactNode } from 'react'

import { toast } from 'sonner'

import { updateCandidateStageAction } from '@/app/(dashboard)/recruiter/pipelines/actions'
import { ActionButton } from '@/components/ui/action-button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { STAGES, type Stage } from '@/lib/constants/recruiter'

interface Props {
  pipelineCandidateId: number
  currentStage: Stage
  children: ReactNode
}

/**
 * Reusable modal wrapper around updateCandidateStageAction.
 */
export default function EditCandidateModal({ pipelineCandidateId, currentStage, children }: Props) {
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<Stage>(currentStage)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('pipelineCandidateId', String(pipelineCandidateId))
      fd.append('stage', stage)
      const res = await updateCandidateStageAction({}, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Candidate updated.')
        setOpen(false)
        /* Mild refresh to keep board in sync; heavy reload avoided intentionally */
        window.location.reload()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Candidate</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='flex flex-col'>
            <label htmlFor='stage' className='mb-1 text-sm font-medium'>
              Stage
            </label>
            <select
              id='stage'
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
              className='border-border h-10 rounded-md border px-2 text-sm'
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <ActionButton onAction={handleSave} pendingLabel='Saving…' disabled={isPending}>
            Save Changes
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
