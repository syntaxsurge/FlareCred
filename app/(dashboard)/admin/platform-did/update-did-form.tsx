'use client'

import * as React from 'react'
import { startTransition } from 'react'

import { Pencil, Loader2, RefreshCcw, Copy } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { upsertPlatformDidAction } from './actions'

import type {
  DidActionState as ActionState,
  UpdateDidFormProps as Props,
} from '@/lib/types/forms'

/**
 * Form for displaying, copying, editing or generating the platform DID.
 * All terminology now explicitly references the Flare network.
 */
export default function UpdateDidForm({ defaultDid }: Props) {
  /* -------------------------------------------------------------------------- */
  /*                                S T A T E                                   */
  /* -------------------------------------------------------------------------- */
  const [currentDid, setCurrentDid] = React.useState<string>(defaultDid ?? '')
  const [didInput, setDidInput] = React.useState<string>(currentDid)
  const [editing, setEditing] = React.useState<boolean>(false)

  const [saveState, saveAction, saving] = React.useActionState<ActionState, FormData>(
    upsertPlatformDidAction,
    {},
  )
  const [genState, genAction, generating] = React.useActionState<ActionState, FormData>(
    upsertPlatformDidAction,
    {},
  )

  /* -------------------------------------------------------------------------- */
  /*                               E F F E C T S                                */
  /* -------------------------------------------------------------------------- */
  React.useEffect(() => {
    if (saveState?.error) toast.error(saveState.error)
    if (saveState?.success) {
      toast.success(saveState.success)
      if (saveState.did) {
        setCurrentDid(saveState.did)
        setDidInput(saveState.did)
      }
      setEditing(false)
    }
  }, [saveState])

  React.useEffect(() => {
    if (genState?.error) toast.error(genState.error)
    if (genState?.success) {
      toast.success(genState.success)
      if (genState.did) {
        setCurrentDid(genState.did)
        setDidInput(genState.did)
      }
      setEditing(false)
    }
  }, [genState])

  /* -------------------------------------------------------------------------- */
  /*                                 Helpers                                    */
  /* -------------------------------------------------------------------------- */
  function confirmSave() {
    const fd = new FormData()
    fd.append('did', didInput.trim())
    startTransition(() => saveAction(fd))
  }

  function confirmGenerate() {
    startTransition(() => genAction(new FormData()))
  }

  async function copyDid() {
    try {
      await navigator.clipboard.writeText(currentDid)
      toast.success('Platform DID copied to clipboard.')
    } catch {
      toast.error('Failed to copy DID.')
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */
  return (
    <div className='space-y-6'>
      {/* DID field + copy button */}
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
          onClick={copyDid}
          disabled={!currentDid}
          className='shrink-0'
          type='button'
        >
          <Copy className='h-4 w-4' />
          <span className='sr-only'>Copy DID</span>
        </Button>
      </div>

      {/* Edit / Save controls */}
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

      {/* Divider */}
      <div className='relative'>
        <span className='absolute inset-x-0 top-1/2 -translate-y-1/2 border-t' />
        <span className='bg-background text-muted-foreground relative mx-auto px-3 text-xs uppercase'>
          or
        </span>
      </div>

      {/* Generate new DID */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant='outline' className='w-full sm:w-auto' disabled={generating}>
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
              A brand-new DID will be created via the Flare Network and will permanently replace the
              existing one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGenerate} disabled={generating}>
              {generating ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : 'Generate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}