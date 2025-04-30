import { redirect } from 'next/navigation'

import { eq, and } from 'drizzle-orm'
import { BadgeCheck, Clock, XCircle, FileText, Github } from 'lucide-react'
import type { ElementType } from 'react'

import { CredentialActions } from '@/components/dashboard/issuer/credential-actions'
import RequireDidGate from '@/components/dashboard/require-did-gate'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import PageCard from '@/components/ui/page-card'
import { isGithubRepoCredential } from '@/lib/constants/credential'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import {
  candidateCredentials,
  CredentialStatus,
  candidates,
} from '@/lib/db/schema/candidate'
import { users } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'
import { cn } from '@/lib/utils'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                          UI helpers & mappers                              */
/* -------------------------------------------------------------------------- */

/** Return a Lucide icon component mapped to the credential status. */
function statusIcon(status: CredentialStatus): ElementType {
  switch (status) {
    case CredentialStatus.VERIFIED:
      return BadgeCheck
    case CredentialStatus.REJECTED:
      return XCircle
    default:
      return Clock
  }
}

function StatusBadge({ status }: { status: CredentialStatus }) {
  const cls =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize'
  const map: Record<CredentialStatus, string> = {
    [CredentialStatus.VERIFIED]:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    [CredentialStatus.PENDING]:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    [CredentialStatus.REJECTED]:
      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    [CredentialStatus.UNVERIFIED]: 'bg-muted text-foreground/80',
  }
  return <span className={cn(cls, map[status])}>{status.toLowerCase()}</span>
}

function GithubProofDialog({ proofJson }: { proofJson: string }) {
  'use client'
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className='text-primary inline-flex items-center gap-2 font-medium underline-offset-2 hover:underline'
          type='button'
        >
          <Github className='h-4 w-4' />
          View GitHub Proof
        </button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Github className='h-5 w-5' />
            GitHub Proof JSON
          </DialogTitle>
        </DialogHeader>
        <pre className='bg-muted max-h-[70vh] overflow-auto rounded-md p-4 text-xs leading-relaxed whitespace-pre-wrap'>
          {proofJson}
        </pre>
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default async function CredentialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const credentialId = Number(id)

  /* Auth & issuer ownership ------------------------------------------------ */
  const user = await getUser()
  if (!user) redirect('/connect-wallet')

  const [issuer] = await db
    .select()
    .from(issuers)
    .where(eq(issuers.ownerUserId, user.id))
    .limit(1)
  if (!issuer) redirect('/issuer/onboard')

  /* Credential lookup ------------------------------------------------------ */
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
  const StatusIcon = statusIcon(status)
  const isGithub = isGithubRepoCredential(cred.type)

  /* Prettify GitHub proof JSON for modal ----------------------------------- */
  let proofPretty = cred.proofData
  if (isGithub) {
    try {
      proofPretty = JSON.stringify(JSON.parse(cred.proofData), null, 2)
    } catch {
      /* ignore */
    }
  }

  /* -------------------------------- View ---------------------------------- */
  return (
    <RequireDidGate createPath='/issuer/create-did'>
      <PageCard
        icon={StatusIcon}
        title={cred.title}
        description={`Status: ${status.toLowerCase()}`}
        className='w-full'
      >
        <div className='space-y-6'>
          {/* Meta row ------------------------------------------------------- */}
          <div className='flex flex-wrap gap-4 items-center'>
            <p className='text-muted-foreground text-sm'>
              Submitted by{' '}
              <span className='font-medium'>
                {candUser?.name || candUser?.email || 'Unknown'}
              </span>
            </p>
            <StatusBadge status={status} />
          </div>

          {/* Details card --------------------------------------------------- */}
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

              {cred.fileUrl && !isGithub && (
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

              {isGithub && (
                <div className='sm:col-span-2'>
                  <p className='text-muted-foreground mb-1 text-xs font-medium uppercase'>
                    GitHub Proof
                  </p>
                  <GithubProofDialog proofJson={proofPretty} />
                </div>
              )}
            </CardContent>

            <CardFooter className='bg-muted/50 border-t py-4'>
              <div className='ml-auto'>
                <CredentialActions credentialId={cred.id} status={status} isGithub={isGithub} />
              </div>
            </CardFooter>
          </Card>
        </div>
      </PageCard>
    </RequireDidGate>
  )
}