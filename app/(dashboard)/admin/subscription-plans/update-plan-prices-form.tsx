'use client'

import * as React from 'react'

import { ethers } from 'ethers'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAccount, useWalletClient } from 'wagmi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SUBSCRIPTION_MANAGER_ADDRESS } from '@/lib/config'
import { SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis'

/* -------------------------------------------------------------------------- */
/*                                   Props                                    */
/* -------------------------------------------------------------------------- */

interface Props {
  /** Current Base-plan price (wei as string) */
  defaultBaseWei: string
  /** Current Plus-plan price (wei as string) */
  defaultPlusWei: string
}

/**
 * Admin form for updating on-chain FLR prices of the Base and Plus plans.
 * The layout now fills the full card width and shows both fields side-by-side
 * on larger screens for visual consistency with other admin pages.
 */
export default function UpdatePlanPricesForm({ defaultBaseWei, defaultPlusWei }: Props) {
  /* ---------------------------------------------------------------------- */
  /*                                State                                   */
  /* ---------------------------------------------------------------------- */
  const [base, setBase] = React.useState<string>(ethers.formatUnits(BigInt(defaultBaseWei), 18))
  const [plus, setPlus] = React.useState<string>(ethers.formatUnits(BigInt(defaultPlusWei), 18))
  const [pending, setPending] = React.useState<boolean>(false)

  /* ---------------------------------------------------------------------- */
  /*                        Wallet / wagmi context                           */
  /* ---------------------------------------------------------------------- */
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  /* ---------------------------------------------------------------------- */
  /*                               Helpers                                  */
  /* ---------------------------------------------------------------------- */
  async function updatePlanPrice(planKey: 1 | 2, amountFlr: string) {
    if (!walletClient || !address) throw new Error('Wallet not connected')
    const wei = ethers.parseUnits(amountFlr, 18)

    await walletClient.writeContract({
      address: SUBSCRIPTION_MANAGER_ADDRESS as `0x${string}`,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: 'setPlanPrice',
      args: [planKey, wei],
      account: address,
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!isConnected) {
      toast.error('Connect a wallet first.')
      return
    }

    try {
      setPending(true)

      const txs: Promise<unknown>[] = []

      if (ethers.parseUnits(base, 18) !== BigInt(defaultBaseWei)) {
        txs.push(updatePlanPrice(1, base))
      }
      if (ethers.parseUnits(plus, 18) !== BigInt(defaultPlusWei)) {
        txs.push(updatePlanPrice(2, plus))
      }

      if (txs.length === 0) {
        toast.info('No changes to update.')
        return
      }

      await Promise.all(txs)
      toast.success('Plan prices updated.')
    } catch (err: any) {
      toast.error(err?.shortMessage ?? err?.message ?? 'Transaction failed.')
    } finally {
      setPending(false)
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                                   UI                                   */
  /* ---------------------------------------------------------------------- */
  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='grid gap-6 sm:grid-cols-2'>
        {/* Base plan field */}
        <div>
          <label htmlFor='base' className='mb-1 block text-sm font-medium'>
            Base Plan Price&nbsp;(FLR)
          </label>
          <Input
            id='base'
            type='number'
            min='0'
            step='0.000000000000000001'
            value={base}
            onChange={(e) => setBase(e.target.value)}
            required
          />
        </div>

        {/* Plus plan field */}
        <div>
          <label htmlFor='plus' className='mb-1 block text-sm font-medium'>
            Plus Plan Price&nbsp;(FLR)
          </label>
          <Input
            id='plus'
            type='number'
            min='0'
            step='0.000000000000000001'
            value={plus}
            onChange={(e) => setPlus(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Submit button */}
      <Button type='submit' className='w-full sm:w-auto' disabled={pending}>
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Updating…
          </>
        ) : (
          'Update Prices'
        )}
      </Button>
    </form>
  )
}
