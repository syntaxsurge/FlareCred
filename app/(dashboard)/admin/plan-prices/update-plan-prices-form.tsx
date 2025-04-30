'use client'

import * as React from 'react'
import { ethers } from 'ethers'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SUBSCRIPTION_MANAGER_ADDRESS } from '@/lib/config'
import { SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis'

interface Props {
  /** Current Base-plan price (wei as string) */
  defaultBaseWei: string
  /** Current Plus-plan price (wei as string) */
  defaultPlusWei: string
}

/**
 * Interactive form that lets admins enter new FLR prices and sends
 * SubscriptionManager.setPlanPrice(1|2, newPriceWei) transactions.
 */
export default function UpdatePlanPricesForm({
  defaultBaseWei,
  defaultPlusWei,
}: Props) {
  /* ---------------------------------------------------------------------- */
  /*                              State                                     */
  /* ---------------------------------------------------------------------- */
  const [base, setBase] = React.useState<string>(
    ethers.formatUnits(defaultBaseWei, 18),
  )
  const [plus, setPlus] = React.useState<string>(
    ethers.formatUnits(defaultPlusWei, 18),
  )
  const [pending, setPending] = React.useState(false)

  /* ---------------------------------------------------------------------- */
  /*                             Helpers                                    */
  /* ---------------------------------------------------------------------- */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!(window as any).ethereum) {
      toast.error('Web3 wallet not detected.')
      return
    }

    try {
      setPending(true)

      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      const mgr = new ethers.Contract(
        SUBSCRIPTION_MANAGER_ADDRESS,
        SUBSCRIPTION_MANAGER_ABI as ethers.InterfaceAbi,
        signer,
      )

      /* ----------------------------- Base ------------------------------ */
      const baseWei = ethers.parseUnits(base, 18)
      const txBase = await mgr.setPlanPrice(1, baseWei)
      await txBase.wait()
      toast.success('Base plan price updated.')

      /* ----------------------------- Plus ------------------------------ */
      const plusWei = ethers.parseUnits(plus, 18)
      const txPlus = await mgr.setPlanPrice(2, plusWei)
      await txPlus.wait()
      toast.success('Plus plan price updated.')
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || 'Transaction failed.')
    } finally {
      setPending(false)
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                                UI                                      */
  /* ---------------------------------------------------------------------- */
  return (
    <form onSubmit={handleSubmit} className='space-y-6 max-w-md'>
      {/* Base plan */}
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

      {/* Plus plan */}
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

      {/* Submit */}
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