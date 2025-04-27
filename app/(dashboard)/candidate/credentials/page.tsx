import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'
import { FileText } from 'lucide-react'

import AddCredentialDialog from '@/components/dashboard/candidate/add-credential-dialog'
import CandidateCredentialsTable, {
  RowType,
} from '@/components/dashboard/candidate/credentials-table'
import PageCard from '@/components/ui/page-card'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { db } from '@/lib/db/drizzle'
import { getCandidateCredentialsPage } from '@/lib/db/queries/candidate-credentials'
import { getUser } from '@/lib/db/queries/queries'
import { teams, teamMembers } from '@/lib/db/schema/core'

import { addCredential } from './actions'

export const revalidate = 0

type Query = Record<string, string | string[] | undefined>
const first = (p: Query, k: string) => (Array.isArray(p[k]) ? p[k]?.[0] : p[k])

export default async function CredentialsPage({
  searchParams,
}: {
  searchParams: Promise<Query> | Query
}) {
  const params = (await searchParams) as Query

  /* -------------------------- Auth -------------------------- */
  const user = await getUser()
  if (!user) redirect('/sign-in')

  /* ----------------------- DID Check ------------------------ */
  const [{ did } = {}] = await db
    .select({ did: teams.did })
    .from(teamMembers)
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, user.id))
    .limit(1)
  const hasDid = !!did

  /* --------------------- Add Credential SA ------------------ */
  const addCredentialAction = async (formData: FormData): Promise<{ error?: string } | void> => {
    'use server'
    return await addCredential({}, formData)
  }

  /* ------------------------ Params ------------------------- */
  const page = Math.max(1, Number(first(params, 'page') ?? '1'))
  const sizeRaw = Number(first(params, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10
  const sort = first(params, 'sort') ?? 'status'
  const order = first(params, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (first(params, 'q') ?? '').trim().toLowerCase()

  /* ------------------- Data fetch -------------------------- */
  const { rows: credentialRows, hasNext } = await getCandidateCredentialsPage(
    user.id,
    page,
    pageSize,
    sort as any,
    order as any,
    searchTerm,
  )

  const rows: RowType[] = credentialRows.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    type: c.type,
    issuer: c.issuer ?? null,
    status: c.status,
    fileUrl: null,
    vcJson: c.vcJson ?? null,
  }))

  /* ------------ Preserve existing query params ------------ */
  const initialParams: Record<string, string> = {}
  const copy = (k: string) => {
    const v = first(params, k)
    if (v) initialParams[k] = v
  }
  copy('size')
  copy('sort')
  copy('order')
  if (searchTerm) initialParams.q = searchTerm

  /* --------------------------- UI -------------------------- */
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
          order={order as 'asc' | 'desc'}
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
