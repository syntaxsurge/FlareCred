'use client'

import * as React from 'react'
import { startTransition, useEffect, useState } from 'react'

import { Copy, Loader2, Pencil, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useSwitchChain,
  useChainId,
} from 'wagmi'
import { ZeroHash, getAddress } from 'ethers'

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
import { DID_REGISTRY_ADDRESS, CHAIN_ID } from '@/lib/config'
import { DID_REGISTRY_ABI } from '@/lib/contracts/abis'
import { copyToClipboard } from '@/lib/utils'
import type { DidActionState, UpdateDidFormProps } from '@/lib/types/forms'

import { upsertPlatformDidAction } from './actions'

/**
 * Form letting an admin paste, edit or generate the platform DID.
 * Generation now opens the connected wallet and calls DIDRegistry.createDID
 * so the signer requirement is satisfied client-side.
 */
export default function UpdateDidForm({ defaultDid }: UpdateDidFormProps) {
  /* ------------------------------------------------------------------ */
  /*                         L O C A L   S T A T E                      */
  /* ------------------------------------------------------------------ */
  const [currentDid, setCurrentDid] = useState<string>(defaultDid ?? '')
  const [didInput, setDidInput] = useState<string>(currentDid)
  const [editing, setEditing] = useState<boolean>(false)

  const [saveState, saveAction, saving] = React.useActionState<DidActionState, FormData>(
    upsertPlatformDidAction,
    {},
  )

  /* Separate "generating” spinner flag because generation is now manual */
  const [generating, setGenerating] = useState<boolean>(false)

  /* ------------------------------------------------------------------ */
  /*                     W A L L E T /   C H A I N                     */
  /* ------------------------------------------------------------------ */
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { switchChainAsync } = useSwitchChain()
  const activeChainId = useChainId()

  /* ------------------------------------------------------------------ */
  /*                              E F X                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
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

  /* ------------------------------------------------------------------ */
  /*                         H E L P E R S                             */
  /* ------------------------------------------------------------------ */
  function confirmSave() {
    const fd = new FormData()
    fd.append('did', didInput.trim())
    startTransition(() => saveAction(fd))
  }

  async function generateDidOnChain() {
    if (generating) return
    if (!isConnected || !walletClient || !address) {
      toast.error('Connect a wallet first.')
      return
    }
    if (!DID_REGISTRY_ADDRESS) {
      toast.error('DID registry address missing in config.')
      return
    }

    try {
      setGenerating(true)

      /* Ensure we are on the correct chain -------------------------------- */
      if (activeChainId !== CHAIN_ID) {
        await switchChainAsync({ chainId: CHAIN_ID })
      }

      /* ------------------------------------------------------------------ */
      /*                1️⃣  Create DID → wallet signature                   */
      /* ------------------------------------------------------------------ */
      toast.loading('Awaiting wallet signature…')
      const txHash = await walletClient.writeContract({
        address: DID_REGISTRY_ADDRESS,
        abi: DID_REGISTRY_ABI,
        functionName: 'createDID',
        args: [ZeroHash],
      })

      toast.loading(`Tx sent: ${txHash.slice(0, 10)}…`)
      await publicClient.waitForTransactionReceipt({ hash: txHash })

      /* Derive DID deterministically: did:flare:0x… ---------------------- */
      const did = `did:flare:${getAddress(address)}`

      /* ------------------------------------------------------------------ */
      /*                2️⃣  Persist DID via server action                   */
      /* ------------------------------------------------------------------ */
      const fd = new FormData()
      fd.append('did', did)
      await saveAction(fd) // re-use existing action & toast flow
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || 'Transaction failed.')
    } finally {
      setGenerating(false)
    }
  }

  /* ------------------------------------------------------------------ */
  /*                             U I                                   */
  /* ------------------------------------------------------------------ */
  return (
    <div className='space-y-6'>
      {/* DID input + copy ------------------------------------------------- */}
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
              A brand-new DID will be created via your connected wallet; you’ll need to confirm the
              transaction and the resulting DID will permanently replace the existing one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={generateDidOnChain} disabled={generating}>
              {generating ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : 'Generate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}