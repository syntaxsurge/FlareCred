'use client'

import * as React from 'react'
import { useState, useEffect, startTransition } from 'react'

import { Copy, Loader2, Pencil, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { copyToClipboard } from '@/lib/utils'
import type { DidActionState, UpdateDidFormProps } from '@/lib/types/forms'

import { upsertPlatformDidAction } from './actions'

/**
 * Admin form for editing or generating the platform DID.
 * Generation now calls a server action that signs the transaction
 * with the backend platform signer, so no wallet interaction is needed.
 */
export default function UpdateDidForm({ defaultDid }: UpdateDidFormProps) {
  /* ------------------------------------------------------------------ */
  /*                         L O C A L   S T A T E                      */
  /* ------------------------------------------------------------------ */
  const [currentDid, setCurrentDid] = useState<string>(defaultDid ?? '')
  const [didInput, setDidInput] = useState<string>(currentDid)
  const [editing, setEditing] = useState<boolean>(false)
  const [generating, setGenerating] = useState<boolean>(false)

  const [state, action, saving] = React.useActionState<DidActionState, FormData>(
    upsertPlatformDidAction,
    {},
  )

  /* ------------------------------------------------------------------ */
  /*                              E F F E C T S                         */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
    if (state?.success) {
      toast.success(state.success)
      if (state.did) {
        setCurrentDid(state.did)
        setDidInput(state.did)
      }
      setEditing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  /* Clear "generating” flag as soon as the ActionState finishes */
  useEffect(() => {
    if (!saving && generating) {
      setGenerating(false)
    }
  }, [saving, generating])

  /* ------------------------------------------------------------------ */
  /*                              H E L P E R S                         */
  /* ------------------------------------------------------------------ */
  function confirmSave() {
    const fd = new FormData()
    fd.append('did', didInput.trim())
    startTransition(() => action(fd))
  }

  function generateDid() {
    if (saving || generating) return
    setGenerating(true)
    /* Empty FormData → server generates new DID via platform signer */
    const fd = new FormData()
    startTransition(() => action(fd))
  }

  /* ------------------------------------------------------------------ */
  /*                                 UI                                 */
  /* ------------------------------------------------------------------ */
  return (
    <div className='space-y-6'>
      {/* DID field ------------------------------------------------------- */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <Input
          value={didInput}
          onChange={(e) => setDidInput(e.target.value)}
          readOnly={!editing}
          disabled={!editing}
          placeholder='did:flare:0xabc…'
          className='flex-1 font-mono'
        />

        <Button
          variant='outline'
          size='icon'
          onClick={() => copyToClipboard(currentDid)}
          disabled={!currentDid}
          className='shrink-0'
          type='button'
        >
          <Copy className='h-4 w-4' />
          <span className='sr-only'>Copy DID</span>
        </Button>
      </div>

      {/* Edit / Save ------------------------------------------------------ */}
      {editing ? (
        <div className='flex flex-wrap items-center gap-2'>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={saving} className='w-full sm:w-auto'>
                {saving ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Overwrite Platform DID?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently replace the stored value and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmSave} disabled={saving}>
                  {saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : 'Save'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            type='button'
            variant='outline'
            onClick={() => {
              setDidInput(currentDid)
              setEditing(false)
            }}
            disabled={saving}
            className='w-full sm:w-auto'
          >
            Cancel
          </Button>
        </div>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='outline' className='w-full sm:w-auto'>
              <Pencil className='mr-2 h-4 w-4' />
              Edit
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Platform DID</AlertDialogTitle>
              <AlertDialogDescription>
                Editing lets you update the DID; changes are only saved after confirmation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={() => setEditing(true)}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Divider ---------------------------------------------------------- */}
      <div className='relative'>
        <span className='absolute inset-x-0 top-1/2 -translate-y-1/2 border-t' />
        <span className='bg-background relative mx-auto px-3 text-xs uppercase text-muted-foreground'>
          or
        </span>
      </div>

      {/* Generate button --------------------------------------------------- */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant='outline' className='w-full sm:w-auto' disabled={generating || saving}>
            {generating ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Generating…
              </>
            ) : (
              <>
                <RefreshCcw className='mr-2 h-4 w-4' />
                Generate New DID
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate a fresh Flare DID?</AlertDialogTitle>
            <AlertDialogDescription>
              The platform signer will create and fund the transaction automatically – no wallet
              interaction required.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={generateDid} disabled={generating || saving}>
              {generating ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : 'Generate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}