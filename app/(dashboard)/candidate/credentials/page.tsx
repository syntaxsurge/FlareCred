import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'
import { FileText } from 'lucide-react'

import AddCredentialDialog from '@/components/dashboard/candidate/add-credential-dialog'
import CandidateCredentialsTable from '@/components/dashboard/candidate/credentials-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { db } from '@/lib/db/drizzle'
import { getCandidateCredentialsPage } from '@/lib/db/queries/candidate-credentials'
import { getUser } from '@/lib/db/queries/queries'
import { teams, teamMembers } from '@/lib/db/schema/core'
import type { CandidateCredentialRow } from '@/lib/types/tables'
import {
  parsePagination,
  parseSort,
  getSearchTerm,
  pickParams,
  resolveSearchParams,
  type Query,
} from '@/lib/utils/query'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                               Config                                       */
/* -------------------------------------------------------------------------- */

const ALLOWED_SORT_KEYS = [
  'status',
  'title',
  'issuer',
  'category',
  'type',
  'id',
] as const

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default async function CredentialsPage({
  searchParams,
}: {
  searchParams?: Promise<Query>
}) {
  /* Resolve Next.js `searchParams` (supports both object & Promise) */
  const params = await resolveSearchParams(searchParams)

  /* ------------------------------ Auth ----------------------------------- */
  const user = await getUser()
  if (!user) redirect('/connect-wallet')

  /* Determine whether the user’s team already minted a DID */
  const [{ did } = {}] = await db
    .select({ did: teams.did })
    .from(teamMembers)
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, user.id))
    .limit(1)
  const hasDid = !!did

  /* Server action wrapper injected into the client-side dialog */
  const addCredentialAction = async (formData: FormData): Promise<{ error?: string } | void> => {
    'use server'
    return await (await import('./actions')).addCredential({}, formData)
  }

  /* ----------------------- Query-string parsing -------------------------- */
  const { page, pageSize } = parsePagination(params)
  const { sort, order } = parseSort(params, ALLOWED_SORT_KEYS, 'status')
  const searchTerm = getSearchTerm(params).toLowerCase()

  /* ------------------------------ Data ----------------------------------- */
  const { rows: credentialRows, hasNext } = await getCandidateCredentialsPage(
    user.id,
    page,
    pageSize,
    sort as any,
    order,
    searchTerm,
  )

  const rows = credentialRows.map<CandidateCredentialRow>((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    type: c.type,
    issuer: c.issuer ?? null,
    status: c.status,
    fileUrl: null,
    txHash: c.txHash ?? null,
    vcJson: c.vcJson ?? null,
  }))

  const initialParams = pickParams(params, ['size', 'sort', 'order', 'q'])

  /* ------------------------------ View ----------------------------------- */
  return (
    <PageCard
      icon={FileText}
      title='My Credentials'
      description='Add, organise, and track all of your verifiable credentials.'
      actions={<AddCredentialDialog addCredentialAction={addCredentialAction} hasDid={hasDid} />}
    >
      <div className='space-y-4 overflow-x-auto'>
        <CandidateCredentialsTable
          rows={rows}
          sort={sort}
          order={order}
          basePath='/candidate/credentials'
          initialParams={initialParams}
          searchQuery={searchTerm}
        />

        <TablePagination
          page={page}
          hasNext={hasNext}
          basePath='/candidate/credentials'
          initialParams={initialParams}
          pageSize={pageSize}
        />
      </div>
    </PageCard>
  )
}