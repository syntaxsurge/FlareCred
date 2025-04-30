'use client'

import * as React from 'react'
import { ethers } from 'ethers'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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
 * Admin-side form that lets an administrator update the on-chain FLR prices for
 * the Base and Plus subscription tiers.  Transactions are now signed through
 * the active RainbowKit wallet (wagmi walletClient) so a wallet prompt appears
 * immediately instead of the button hanging.
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

      /* ----------------------------- Base ------------------------------ */
      await updatePlanPrice(1, base)
      toast.success('Base plan price transaction sent.')

      /* ----------------------------- Plus ------------------------------ */
      await updatePlanPrice(2, plus)
      toast.success('Plus plan price transaction sent.')
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
    <form onSubmit={handleSubmit} className='max-w-md space-y-6'>
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

      {/* Submit button */}
      <Button type='submit' className='w-full' disabled={pending}>
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