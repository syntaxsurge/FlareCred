'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  useAccount,
  useSwitchChain,
  useWalletClient,
  usePublicClient,
} from 'wagmi'
import { parseAbi } from 'viem'

import { Button } from '@/components/ui/button'
import { createDidAction } from './actions'

/* -------------------------------------------------------------------------- */
/*                                CONSTANTS                                   */
/* -------------------------------------------------------------------------- */

/** Deployed DIDRegistry address (must be set as NEXT_PUBLIC_DID_REGISTRY_ADDRESS) */
const REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_DID_REGISTRY_ADDRESS as `0x${string}` | undefined

/** Target Flare chain ID (defaults to Coston2 test-net = 114) */
const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_FLARE_CHAIN_ID ?? '114')

/** Parsed ABI for the DIDRegistry (viem expects objects, not raw strings) */
const DID_REGISTRY_ABI = parseAbi(['function createDID(bytes32 docHash)'])

/** 32-byte zero hash (no initial document) */
const ZERO_HASH = `0x${'0'.repeat(64)}` as const

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */

/**
 * Mints a Flare DID for the connected wallet and stores it on the team.
 * – Uses wagmi so every connector (MetaMask, WalletConnect, Ledger, …) works.
 * – Prompts the wallet to switch to the Flare network if needed.
 * – Streams granular toast updates so the user always knows the status.
 */
export function CreateDidButton() {
  const { isConnected, address, chain } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [pending, setPending] = React.useState(false)

  /* ---------------------------------------------------------------------- */
  /*                                HANDLER                                 */
  /* ---------------------------------------------------------------------- */

  async function handleClick() {
    if (pending) return

    /* Basic pre-flight checks */
    if (!REGISTRY_ADDRESS) {
      toast.error('DID Registry address not configured.')
      return
    }
    if (!isConnected || !walletClient) {
      toast.error('Please connect your wallet first.')
      return
    }

    setPending(true)
    const toastId = toast.loading('Preparing transaction…')

    try {
      /* Ensure the user is on the correct chain */
      if (chain?.id !== TARGET_CHAIN_ID) {
        toast.loading('Switching to Flare network…', { id: toastId })
        await switchChainAsync({ chainId: TARGET_CHAIN_ID })
      }

      /* Ask the wallet to sign & send the tx */
      toast.loading('Requesting signature…', { id: toastId })
      const hash = await walletClient.writeContract({
        address: REGISTRY_ADDRESS,
        abi: DID_REGISTRY_ABI,
        functionName: 'createDID',
        args: [ZERO_HASH],
      })

      toast.loading(`Tx sent: ${hash.slice(0, 10)}…`, { id: toastId })

      /* Wait for confirmation */
      await publicClient?.waitForTransactionReceipt({ hash })

      /* Persist the DID in the backend */
      const did = `did:flare:${address}`
      const fd = new FormData()
      fd.append('did', did)

      const res = await createDidAction({}, fd)
      if (res && 'error' in res && res.error) {
        toast.error(res.error, { id: toastId })
      } else {
        toast.success(res?.success ?? 'Team DID created successfully.', { id: toastId })
      }
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || 'Transaction failed.'
      toast.error(msg, { id: toastId })
    } finally {
      setPending(false)
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                                   UI                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <Button onClick={handleClick} disabled={pending} className='w-full md:w-max'>
      {pending ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Creating DID…
        </>
      ) : (
        'Create DID for My Team'
      )}
    </Button>
  )
}