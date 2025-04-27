'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { ActionButton } from '@/components/ui/action-button'
import { STAGES, type Stage } from '@/lib/constants/recruiter'

import { updateCandidateStageAction } from './actions'

interface Props {
  pipelineCandidateId: number
  initialStage: Stage
}

export default function UpdateStageForm({ pipelineCandidateId, initialStage }: Props) {
  const [stage, setStage] = React.useState<Stage>(initialStage)
  const router = useRouter()

  async function handleUpdate() {
    const fd = new FormData()
    fd.append('pipelineCandidateId', String(pipelineCandidateId))
    fd.append('stage', stage)
    const res = await updateCandidateStageAction({}, fd)
    if (res?.success) router.refresh()
    return res
  }

  return (
    <div className='flex items-center gap-2'>
      <select
        value={stage}
        onChange={(e) => setStage(e.target.value as Stage)}
        className='border-border h-8 rounded-md border px-2 text-xs'
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <ActionButton onAction={handleUpdate} pendingLabel='Updating…' variant='outline' size='sm'>
        Update
      </ActionButton>
    </div>
  )
}
