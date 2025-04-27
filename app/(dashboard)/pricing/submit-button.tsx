'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useAccount,
  useSwitchChain,
  useWalletClient,
  usePublicClient,
} from 'wagmi'
import { parseAbi } from 'viem'
import { toast } from 'sonner'
import { ArrowRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

/* -------------------------------------------------------------------------- */
/*                                 CONSTANTS                                  */
/* -------------------------------------------------------------------------- */

const NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS as `0x${string}` | undefined

const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_FLARE_CHAIN_ID ?? '114')

const SUBSCRIPTION_MANAGER_ABI = parseAbi([
  'function paySubscription(address team,uint8 planKey) payable',
])

/* -------------------------------------------------------------------------- */
/*                                   PROPS                                    */
/* -------------------------------------------------------------------------- */

interface Props {
  /** 1 = Base, 2 = Plus */
  planKey: 1 | 2
  /** Plan price (wei) — passed to `value` parameter */
  priceWei: bigint
}

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */

export function SubmitButton({ planKey, priceWei }: Props) {
  const { address, chain, isConnected } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const router = useRouter()

  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (pending) return
    if (!NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS) {
      toast.error('Subscription manager address missing.')
      return
    }
    if (!isConnected || !walletClient || !address) {
      toast.error('Please connect your wallet first.')
      return
    }

    setPending(true)
    const toastId = toast.loading('Preparing transaction…')

    try {
      /* Chain check / switch ------------------------------------------------ */
      if (chain?.id !== TARGET_CHAIN_ID) {
        toast.loading('Switching network…', { id: toastId })
        await switchChainAsync({ chainId: TARGET_CHAIN_ID })
      }

      /* Write contract ------------------------------------------------------ */
      toast.loading('Awaiting wallet signature…', { id: toastId })
      const txHash = await walletClient.writeContract({
        address: NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'paySubscription',
        args: [address, planKey],
        value: priceWei,
      })

      toast.loading(`Tx sent: ${txHash.slice(0, 10)}…`, { id: toastId })

      /* Confirmation -------------------------------------------------------- */
      await publicClient?.waitForTransactionReceipt({ hash: txHash })
      toast.success('Subscription activated ✅', { id: toastId })
      router.refresh()
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || 'Transaction failed.', { id: toastId })
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      className='flex w-full items-center justify-center rounded-full'
    >
      {pending ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Processing…
        </>
      ) : (
        <>
          Get Started
          <ArrowRight className='ml-2 h-4 w-4' />
        </>
      )}
    </Button>
  )
}