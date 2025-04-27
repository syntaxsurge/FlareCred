'use client'

import {
  ArrowRight,
  Loader2,
  RotateCcw,
  Users,
} from 'lucide-react'
import {
  useAccount,
  useSwitchChain,
  useWalletClient,
  usePublicClient,
} from 'wagmi'
import { parseAbi } from 'viem'
import { toast } from 'sonner'

import MembersTable, { RowType } from '@/components/dashboard/settings/members-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { PLAN_META } from '@/lib/constants/pricing'

import { InviteTeamMember } from './invite-team'

/* -------------------------------------------------------------------------- */
/*                               Constants                                    */
/* -------------------------------------------------------------------------- */

const SUBSCRIPTION_MANAGER_ADDRESS = process.env
  .SUBSCRIPTION_MANAGER_ADDRESS as `0x${string}` | undefined

const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_FLARE_CHAIN_ID ?? '114')

const SUBSCRIPTION_MANAGER_ABI = parseAbi([
  'function paySubscription(address team,uint8 planKey) payable',
])

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface TeamMeta {
  planName: string | null
  subscriptionPaidUntil: Date | string | null
  did: string | null
}

interface SettingsProps {
  team: TeamMeta
  rows: RowType[]
  isOwner: boolean
  page: number
  hasNext: boolean
  pageSize: number
  sort: string
  order: 'asc' | 'desc'
  searchQuery: string
  basePath: string
  initialParams: Record<string, string>
}

/* -------------------------------------------------------------------------- */
/*                       Renew Subscription Button                            */
/* -------------------------------------------------------------------------- */

function RenewSubscriptionButton({ planName }: { planName: 'base' | 'plus' }) {
  const { address, chain, isConnected } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [pending, setPending] = useState(false)

  const meta = PLAN_META.find((p) => p.key === planName)
  const planKey: 1 | 2 = planName === 'base' ? 1 : 2
  const priceWei = meta?.priceWei ?? 0n

  async function renew() {
    if (pending) return
    if (!SUBSCRIPTION_MANAGER_ADDRESS) {
      toast.error('Subscription manager address missing.')
      return
    }
    if (!isConnected || !walletClient || !address) {
      toast.error('Please connect your wallet first.')
      return
    }

    setPending(true)
    const toastId = toast.loading('Preparing renewal…')

    try {
      /* Network */
      if (chain?.id !== TARGET_CHAIN_ID) {
        toast.loading('Switching network…', { id: toastId })
        await switchChainAsync({ chainId: TARGET_CHAIN_ID })
      }

      /* Contract call */
      toast.loading('Awaiting wallet signature…', { id: toastId })
      const txHash = await walletClient.writeContract({
        address: SUBSCRIPTION_MANAGER_ADDRESS,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'paySubscription',
        args: [address, planKey],
        value: priceWei,
      })

      toast.loading(`Tx sent: ${txHash.slice(0, 10)}…`, { id: toastId })
      await publicClient?.waitForTransactionReceipt({ hash: txHash })
      toast.success('Subscription renewed ✅', { id: toastId })
      location.reload()
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || 'Transaction failed.', { id: toastId })
    } finally {
      setPending(false)
    }
  }

  return (
    <Button onClick={renew} disabled={pending} variant='outline'>
      {pending ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Processing…
        </>
      ) : (
        <>
          Renew Subscription
          <RotateCcw className='ml-2 h-4 w-4' />
        </>
      )}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Settings Card                                */
/* -------------------------------------------------------------------------- */

export function Settings({
  team,
  rows,
  isOwner,
  page,
  hasNext,
  pageSize,
  sort,
  order,
  searchQuery,
  basePath,
  initialParams,
}: SettingsProps) {
  const paidUntilDate =
    team.subscriptionPaidUntil ? new Date(team.subscriptionPaidUntil) : null
  const now = new Date()
  const isActive = paidUntilDate && paidUntilDate > now

  const planLabel = team.planName ? team.planName.charAt(0).toUpperCase() + team.planName.slice(1) : 'Free'

  return (
    <PageCard
      icon={Users}
      title='Team Settings'
      description='Manage your subscription, DID, and team members.'
    >
      <div className='space-y-8'>
        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Team Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col justify-between gap-6 sm:flex-row'>
              <div>
                <p className='font-medium'>Current Plan: {planLabel}</p>
                <p className='text-muted-foreground text-sm'>
                  {isActive && paidUntilDate
                    ? `Active until ${paidUntilDate.toLocaleDateString()}`
                    : 'No active subscription'}
                </p>
              </div>

              {team.planName === 'base' || team.planName === 'plus' ? (
                <RenewSubscriptionButton planName={team.planName} />
              ) : (
                <Button asChild variant='outline'>
                  <a href='/pricing' className='flex items-center gap-2'>
                    Upgrade Plan
                    <ArrowRight className='h-4 w-4' />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* DID */}
        <Card>
          <CardHeader>
            <CardTitle>Team DID</CardTitle>
          </CardHeader>
          <CardContent>
            {team.did ? (
              <>
                <p className='text-sm'>DID:</p>
                <p className='break-all font-semibold'>{team.did}</p>
              </>
            ) : (
              <p className='text-muted-foreground text-sm'>
                No DID yet. Create one in the FlareCred AI dashboard.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <MembersTable
              rows={rows}
              isOwner={isOwner}
              sort={sort}
              order={order}
              basePath={basePath}
              initialParams={initialParams}
              searchQuery={searchQuery}
            />

            <TablePagination
              page={page}
              hasNext={hasNext}
              basePath={basePath}
              initialParams={initialParams}
              pageSize={pageSize}
            />
          </CardContent>
        </Card>

        {/* Invite */}
        <InviteTeamMember isOwner={isOwner} />
      </div>
    </PageCard>
  )
}