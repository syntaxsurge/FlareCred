'use client'

import * as React from 'react'
import { useTransition } from 'react'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ActionResult = void | {
  success?: string
  error?: string
}

/**
 * A drop-in replacement for &lt;Button&gt; that
 * • runs an async callback (<code>onAction</code>) inside a React transition<br/>
 * • shows a muted spinner while pending<br/>
 * • triggers a coloured Sonner toast for <code>success</code> / <code>error</code> responses.
 */
export interface ActionButtonProps extends React.ComponentProps<typeof Button> {
  /** Async handler to run when clicked */
  onAction: () => Promise<ActionResult>
  /** Optional label shown while pending; defaults to children. */
  pendingLabel?: React.ReactNode
}

export function ActionButton({
  onAction,
  pendingLabel,
  children,
  disabled,
  className,
  ...rest
}: ActionButtonProps) {
  const [isPending, startTransition] = useTransition()

  async function handleClick() {
    startTransition(async () => {
      const result = await onAction()
      if (result && typeof result === 'object') {
        if (result.error) {
          toast.error(result.error)
        } else if (result.success) {
          toast.success(result.success)
        }
      }
    })
  }

  return (
    <Button
      disabled={disabled || isPending}
      className={cn(className, isPending && 'opacity-60')}
      onClick={handleClick}
      {...rest}
    >
      {isPending ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
