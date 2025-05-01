import { redirect } from 'next/navigation'
import type { ElementType } from 'react'

import { eq, and } from 'drizzle-orm'
import { FileText, BadgeCheck, Clock, XCircle } from 'lucide-react'

import { CredentialActions } from '@/components/dashboard/issuer/credential-actions'
import GithubProofDialog from '@/components/dashboard/issuer/github-proof-dialog'
import RequireDidGate from '@/components/dashboard/require-did-gate'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import PageCard from '@/components/ui/page-card'
import StatusBadge from '@/components/ui/status-badge'
import { requireAuth } from '@/lib/auth/guards'
import { isGithubRepoCredential } from '@/lib/constants/credential'
import { db } from '@/lib/db/drizzle'
import { candidateCredentials, CredentialStatus, candidates } from '@/lib/db/schema/candidate'
import { users } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'

export const revalidate = 0

export default async function CredentialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const credentialId = Number(id)

  const user = await requireAuth(['issuer'])

  const [issuer] = await db.select().from(issuers).where(eq(issuers.ownerUserId, user.id)).limit(1)
  if (!issuer) redirect('/issuer/onboard')

  /* -------------------------- Credential row ---------------------------- */
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
  const StatusIcon: ElementType = (() => {
    switch (status) {
      case CredentialStatus.VERIFIED:
        return BadgeCheck
      case CredentialStatus.REJECTED:
        return XCircle
      default:
        return Clock
    }
  })()
  const isGithub = isGithubRepoCredential(cred.type)

  /* ------------------------ GitHub proof pretty ------------------------- */
  let proofPretty = cred.proofData
  if (isGithub) {
    try {
      proofPretty = JSON.stringify(JSON.parse(cred.proofData), null, 2)
    } catch {
      /* ignore */
    }
  }

  /* -------------------------------- UI ---------------------------------- */
  return (
    <RequireDidGate createPath='/issuer/create-did'>
      <PageCard
        icon={StatusIcon}
        title={cred.title}
        description={`Status: ${status.toLowerCase()}`}
        className='w-full'
      >
        <div className='space-y-6'>
          {/* Meta row */}
          <div className='flex flex-wrap items-center gap-4'>
            <p className='text-muted-foreground text-sm'>
              Submitted by{' '}
              <span className='font-medium'>{candUser?.name || candUser?.email || 'Unknown'}</span>
            </p>
            <StatusBadge status={status} showIcon />
          </div>

          {/* Details */}
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
