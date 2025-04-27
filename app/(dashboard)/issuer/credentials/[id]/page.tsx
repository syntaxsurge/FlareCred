import { redirect } from 'next/navigation'

import { eq, and } from 'drizzle-orm'
import { BadgeCheck, Clock, XCircle, FileText } from 'lucide-react'

import { CredentialActions } from '@/components/dashboard/issuer/credential-actions'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import PageCard from '@/components/ui/page-card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { candidateCredentials, CredentialStatus, candidates } from '@/lib/db/schema/candidate'
import { users } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'
import { cn } from '@/lib/utils'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   B A D G E S                              */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: CredentialStatus }) {
  const cls = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize'
  const map: Record<CredentialStatus, string> = {
    [CredentialStatus.VERIFIED]:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    [CredentialStatus.PENDING]:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    [CredentialStatus.REJECTED]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    [CredentialStatus.UNVERIFIED]: 'bg-muted text-foreground/80',
  }
  return <span className={cn(cls, map[status])}>{status.toLowerCase()}</span>
}

function StatusIcon({ status }: { status: CredentialStatus }) {
  const base = 'h-12 w-12 flex-shrink-0'
  switch (status) {
    case CredentialStatus.VERIFIED:
      return <BadgeCheck className={cn(base, 'text-emerald-500')} />
    case CredentialStatus.REJECTED:
      return <XCircle className={cn(base, 'text-rose-500')} />
    default:
      return <Clock className={cn(base, 'text-amber-500')} />
  }
}

/* -------------------------------------------------------------------------- */
/*                                   P A G E                                  */
/* -------------------------------------------------------------------------- */

export default async function CredentialDetailPage({
  params,
}: {
  /** Next 15 passes <code>params</code> as a Promise - await it first. */
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const credentialId = Number(id)

  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* Validate issuer ownership */
  const [issuer] = await db.select().from(issuers).where(eq(issuers.ownerUserId, user.id)).limit(1)
  if (!issuer) redirect('/issuer/onboard')

  /* Load credential & candidate */
  const [data] = await db
    .select({ cred: candidateCredentials, cand: candidates, candUser: users })
    .from(candidateCredentials)
    .leftJoin(candidates, eq(candidateCredentials.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(
      and(eq(candidateCredentials.id, credentialId), eq(candidateCredentials.issuerId, issuer.id)),
    )
    .limit(1)

  if (!data) redirect('/issuer/requests')

  const { cred, candUser } = data
  const status = cred.status as CredentialStatus

  /* ----------------------------- UI ----------------------------- */
  return (
    <section className='mx-auto max-w-2xl py-10'>
      <PageCard
        icon={FileText}
        title='Credential Details'
        description={`Status: ${status.toLowerCase()}`}
      >
        <div className='space-y-6'>
          {/* Hero header */}
          <div className='flex items-center gap-4'>
            <StatusIcon status={status} />
            <div className='flex-1'>
              <h2 className='text-3xl leading-tight font-extrabold tracking-tight'>{cred.title}</h2>
              <p className='text-muted-foreground text-sm'>
                Submitted by{' '}
                <span className='font-medium'>
                  {candUser?.name || candUser?.email || 'Unknown'}
                </span>
              </p>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Details card */}
          <Card className='shadow-sm'>
            <CardHeader>
              <CardTitle className='text-lg font-semibold'>Credential Details</CardTitle>
            </CardHeader>

            <CardContent className='grid gap-4 text-sm sm:grid-cols-2'>
              <div>
                <p className='text-muted-foreground mb-1 text-xs font-medium uppercase'>Type</p>
                <p className='font-medium capitalize'>{cred.type}</p>
              </div>

              <div>
                <p className='text-muted-foreground mb-1 text-xs font-medium uppercase'>
                  Candidate
                </p>
                <p className='font-medium break-all'>
                  {candUser?.name || candUser?.email || 'Unknown'}
                </p>
              </div>

              {cred.fileUrl && (
                <div className='sm:col-span-2'>
                  <p className='text-muted-foreground mb-1 text-xs font-medium uppercase'>
                    Attached File
                  </p>
                  <a
                    href={cred.fileUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary inline-flex items-center gap-2 font-medium underline-offset-2 hover:underline'
                  >
                    <FileText className='h-4 w-4' />
                    View Document
                  </a>
                </div>
              )}
            </CardContent>

            {/* Action buttons for editable statuses */}
            {[
              CredentialStatus.PENDING,
              CredentialStatus.REJECTED,
              CredentialStatus.VERIFIED,
              CredentialStatus.UNVERIFIED,
            ].includes(status) && (
              <CardFooter className='bg-muted/50 border-t py-4'>
                <div className='ml-auto'>
                  <CredentialActions credentialId={cred.id} status={status} />
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </PageCard>
    </section>
  )
}
