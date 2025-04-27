import Image from 'next/image'
import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'
import {
  Building2,
  AtSign,
  Tag,
  BriefcaseBusiness,
  Link as LinkIcon,
  BadgeCheck,
  Hourglass,
  XCircle,
  Wrench,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PageCard from '@/components/ui/page-card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'
import { cn } from '@/lib/utils'

import { CreateIssuerForm } from './create-issuer-form'
import { EditIssuerForm } from './edit-issuer-form'
import { LinkDidForm } from './link-did-form'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function prettify(text?: string | null) {
  return text ? text.replaceAll('_', ' ').toLowerCase() : '—'
}

function StatusPill({ status }: { status: string }) {
  const base =
    'inline-flex items-center rounded-full px-3 py-0.5 text-sm font-semibold capitalize'
  const map: Record<string, string> = {
    [IssuerStatus.ACTIVE]:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    [IssuerStatus.PENDING]:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    [IssuerStatus.REJECTED]:
      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  }
  return (
    <span className={cn(base, map[status] ?? 'bg-muted text-foreground/80')}>
      {status.toLowerCase()}
    </span>
  )
}

function StatusIcon({ status }: { status: string }) {
  const base = 'h-6 w-6 flex-shrink-0'
  switch (status) {
    case IssuerStatus.ACTIVE:
      return <BadgeCheck className={cn(base, 'text-emerald-500')} />
    case IssuerStatus.REJECTED:
      return <XCircle className={cn(base, 'text-rose-500')} />
    default:
      return <Hourglass className={cn(base, 'text-amber-500')} />
  }
}

function Detail({
  icon: Icon,
  label,
  value,
  capitalize = false,
  className,
}: {
  icon: any
  label: string
  value: string
  capitalize?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <Icon className='text-muted-foreground mt-0.5 h-5 w-5' />
      <div>
        <p className='text-muted-foreground text-xs font-medium uppercase'>{label}</p>
        <p className={cn('font-medium break-all', capitalize && 'capitalize')}>{value}</p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                     PAGE                                   */
/* -------------------------------------------------------------------------- */

export default async function IssuerOnboardPage() {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  const [issuer] = await db
    .select()
    .from(issuers)
    .where(eq(issuers.ownerUserId, user.id))
    .limit(1)

  /* ----------------------- First-time creation ----------------------- */
  if (!issuer) {
    return (
      <PageCard
        icon={Building2}
        title='Create Your Organisation'
        description='Provide organisation details to begin issuing verified credentials.'
      >
        <CreateIssuerForm />
      </PageCard>
    )
  }

  /* --------------------------- Rejected flow ------------------------- */
  if (issuer.status === IssuerStatus.REJECTED) {
    return (
      <PageCard
        icon={Wrench}
        title='Fix & Resubmit'
        description='Review feedback, update your details, and resubmit for approval.'
      >
        <div className='space-y-8'>
          {/* Previous submission summary */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg font-medium'>Previous Submission</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Detail icon={Building2} label='Name' value={issuer.name} />
                <Detail icon={AtSign} label='Domain' value={issuer.domain} />
                <Detail icon={Tag} label='Category' value={prettify(issuer.category)} capitalize />
                <Detail
                  icon={BriefcaseBusiness}
                  label='Industry'
                  value={prettify(issuer.industry)}
                  capitalize
                />
              </div>

              {issuer.logoUrl && (
                <div className='flex flex-col gap-2'>
                  <p className='text-muted-foreground text-xs font-medium uppercase'>
                    Logo Preview
                  </p>
                  <Image
                    src={issuer.logoUrl}
                    alt={`${issuer.name} logo`}
                    width={112}
                    height={112}
                    className='h-28 w-auto rounded-md border object-contain'
                  />
                </div>
              )}

              {issuer.rejectionReason && (
                <p className='rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'>
                  <span className='font-semibold'>Rejection reason:</span> {issuer.rejectionReason}
                </p>
              )}
            </CardContent>
          </Card>

          <EditIssuerForm issuer={issuer} />
        </div>
      </PageCard>
    )
  }

  /* ---------------------- Active / Pending flow ---------------------- */
  return (
    <PageCard icon={Building2} title={issuer.name} description='Organisation profile'>
      <div className='space-y-8'>
        {/* Hero section */}
        <Card className='overflow-hidden shadow-sm'>
          <CardContent className='flex flex-col items-center gap-6 p-6 sm:flex-row'>
            {issuer.logoUrl ? (
              <Image
                src={issuer.logoUrl}
                alt={`${issuer.name} logo`}
                width={96}
                height={96}
                className='h-24 w-24 flex-shrink-0 rounded-lg border object-contain'
              />
            ) : (
              <Building2 className='bg-muted text-muted-foreground h-24 w-24 flex-shrink-0 rounded-lg p-4' />
            )}

            <div className='flex-1 space-y-1'>
              <h1 className='text-3xl leading-tight font-extrabold tracking-tight'>
                {issuer.name}
              </h1>
              <p className='text-muted-foreground text-sm'>Organisation profile</p>
            </div>

            <div className='flex items-center gap-2'>
              <StatusIcon status={issuer.status} />
              <StatusPill status={issuer.status} />
            </div>
          </CardContent>
        </Card>

        {/* Detail grid */}
        <Card className='shadow-sm'>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>Organisation Details</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-6 p-6 sm:grid-cols-2'>
            <Detail icon={AtSign} label='Domain' value={issuer.domain} />
            <Detail icon={Tag} label='Category' value={prettify(issuer.category)} capitalize />
            <Detail
              icon={BriefcaseBusiness}
              label='Industry'
              value={prettify(issuer.industry)}
              capitalize
            />
            {issuer.did && (
              <Detail
                icon={LinkIcon}
                label='Flare DID'
                value={issuer.did}
                className='sm:col-span-2'
              />
            )}
          </CardContent>
        </Card>

        {/* DID linking & status alerts */}
        {!issuer.did && issuer.status === IssuerStatus.ACTIVE && <LinkDidForm />}

        {issuer.status === IssuerStatus.PENDING && (
          <div className='rounded-md border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400 dark:bg-amber-900/20 dark:text-amber-200'>
            Your issuer is awaiting admin approval. You’ll receive an email once it becomes active.
          </div>
        )}
      </div>
    </PageCard>
  )
}