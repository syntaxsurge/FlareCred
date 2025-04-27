import { redirect } from 'next/navigation'

import { asc, desc, eq, inArray } from 'drizzle-orm'

import CandidateDetailedProfileView from '@/components/dashboard/candidate/profile-detailed-view'
import { type Stage } from '@/lib/constants/recruiter'
import { db } from '@/lib/db/drizzle'
import {
  getCandidateCredentialsSection,
  type StatusCounts,
} from '@/lib/db/queries/candidate-details'
import { getUser } from '@/lib/db/queries/queries'
import {
  users,
  candidates,
  recruiterPipelines,
  pipelineCandidates,
  quizAttempts,
  issuers,
} from '@/lib/db/schema'
import {
  candidateCredentials,
  CredentialCategory,
  candidateHighlights,
} from '@/lib/db/schema/candidate'

import AddToPipelineForm from './add-to-pipeline-form'

export const revalidate = 0

type Params = { id: string }
type Query = Record<string, string | string[] | undefined>
const first = (p: Query, k: string) => (Array.isArray(p[k]) ? p[k]?.[0] : p[k])

export default async function RecruiterCandidateProfile({
  params,
  searchParams,
}: {
  params: Params | Promise<Params>
  searchParams: Query | Promise<Query>
}) {
  const { id } = await params
  const candidateId = Number(id)
  const q = (await searchParams) as Query

  const user = await getUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'recruiter') redirect('/')

  const [row] = await db
    .select({ cand: candidates, userRow: users })
    .from(candidates)
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(eq(candidates.id, candidateId))
    .limit(1)

  if (!row) redirect('/recruiter/talent')

  /* --------------------- Experience & Project highlights --------------------- */
  const hlRows = await db
    .select({
      credentialId: candidateHighlights.credentialId,
      sortOrder: candidateHighlights.sortOrder,
    })
    .from(candidateHighlights)
    .where(eq(candidateHighlights.candidateId, candidateId))
    .orderBy(asc(candidateHighlights.sortOrder))

  const highlightedIds = hlRows.map((h) => h.credentialId)

  const highlightedCreds = highlightedIds.length
    ? await db
        .select({
          id: candidateCredentials.id,
          title: candidateCredentials.title,
          createdAt: candidateCredentials.createdAt,
          issuerName: issuers.name,
          link: candidateCredentials.fileUrl,
          description: candidateCredentials.type,
          category: candidateCredentials.category,
          status: candidateCredentials.status,
        })
        .from(candidateCredentials)
        .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
        .where(inArray(candidateCredentials.id, highlightedIds))
    : []

  /* maintain order */
  highlightedCreds.sort((a, b) => highlightedIds.indexOf(a.id) - highlightedIds.indexOf(b.id))

  const experiences = highlightedCreds
    .filter((c) => c.category === CredentialCategory.EXPERIENCE)
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      title: e.title,
      company: e.issuerName,
      createdAt: e.createdAt,
      status: e.status,
    }))

  const projects = highlightedCreds
    .filter((c) => c.category === CredentialCategory.PROJECT)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      title: p.title,
      link: p.link,
      description: p.description,
      createdAt: p.createdAt,
      status: p.status,
    }))

  /* --------------------- Pipelines owned by recruiter --------------------- */
  const pipelines = await db
    .select({ id: recruiterPipelines.id, name: recruiterPipelines.name })
    .from(recruiterPipelines)
    .where(eq(recruiterPipelines.recruiterId, user.id))
    .orderBy(asc(recruiterPipelines.name))

  const pipelineEntriesAll = await db
    .select({
      pipelineName: recruiterPipelines.name,
      stage: pipelineCandidates.stage,
    })
    .from(pipelineCandidates)
    .innerJoin(recruiterPipelines, eq(pipelineCandidates.pipelineId, recruiterPipelines.id))
    .where(eq(pipelineCandidates.candidateId, candidateId))

  const pipelineSummary =
    pipelineEntriesAll.length === 0
      ? undefined
      : pipelineEntriesAll.length === 1
        ? `In ${pipelineEntriesAll[0].pipelineName}`
        : `In ${pipelineEntriesAll.length} Pipelines`

  /* ----------------------------- Credentials section ----------------------------- */
  const page = Math.max(1, Number(first(q, 'page') ?? '1'))
  const sizeRaw = Number(first(q, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10
  const sort = first(q, 'sort') ?? 'status'
  const order = first(q, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (first(q, 'q') ?? '').trim()

  const {
    rows: credRows,
    hasNext,
    statusCounts,
  } = await getCandidateCredentialsSection(
    candidateId,
    page,
    pageSize,
    sort as any,
    order as any,
    searchTerm,
  )

  const credInitialParams: Record<string, string> = {}
  const keep = (k: string) => {
    const v = first(q, k)
    if (v) credInitialParams[k] = v
  }
  keep('size')
  keep('sort')
  keep('order')
  if (searchTerm) credInitialParams['q'] = searchTerm

  /* ----------------------------- Pipeline entries section ----------------------------- */
  const pipePage = Math.max(1, Number(first(q, 'pipePage') ?? '1'))
  const pipeSizeRaw = Number(first(q, 'pipeSize') ?? '10')
  const pipePageSize = [10, 20, 50].includes(pipeSizeRaw) ? pipeSizeRaw : 10
  const pipeSort = first(q, 'pipeSort') ?? 'addedAt'
  const pipeOrder = first(q, 'pipeOrder') === 'asc' ? 'asc' : 'desc'
  const pipeSearchTerm = (first(q, 'pipeQ') ?? '').trim()

  const pipeSortMap = {
    addedAt: pipelineCandidates.addedAt,
    stage: pipelineCandidates.stage,
    pipelineName: recruiterPipelines.name,
  } as const
  const pipeSortCol =
    pipeSortMap[pipeSort as keyof typeof pipeSortMap] ?? pipelineCandidates.addedAt
  const pipeOrderExpr = pipeOrder === 'asc' ? asc(pipeSortCol) : desc(pipeSortCol)
  const pipeOffset = (pipePage - 1) * pipePageSize

  const pipeRowsRaw = await db
    .select({
      id: pipelineCandidates.id,
      pipelineId: pipelineCandidates.pipelineId,
      pipelineName: recruiterPipelines.name,
      stage: pipelineCandidates.stage,
    })
    .from(pipelineCandidates)
    .innerJoin(recruiterPipelines, eq(pipelineCandidates.pipelineId, recruiterPipelines.id))
    .where(eq(pipelineCandidates.candidateId, candidateId))
    .orderBy(pipeOrderExpr)
    .limit(pipePageSize + 1)
    .offset(pipeOffset)

  const pipeHasNext = pipeRowsRaw.length > pipePageSize
  if (pipeHasNext) pipeRowsRaw.pop()

  const pipeRows = pipeRowsRaw.map((p: any) => ({
    id: p.id,
    pipelineId: p.pipelineId,
    pipelineName: p.pipelineName,
    stage: p.stage as Stage,
  }))

  const pipeInitialParams: Record<string, string> = {}
  const keepPipe = (k: string) => {
    const v = first(q, k)
    if (v) pipeInitialParams[k] = v
  }
  keepPipe('pipeSize')
  keepPipe('pipeSort')
  keepPipe('pipeOrder')
  if (pipeSearchTerm) pipeInitialParams['pipeQ'] = pipeSearchTerm

  /* ----------------------------- Quiz passes ----------------------------- */
  const passes = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.candidateId, candidateId))
    .orderBy(desc(quizAttempts.createdAt))

  /* ----------------------------- Snapshot metrics ----------------------------- */
  const issuerSet = new Set<string>()
  highlightedCreds.forEach((c) => c.issuerName && issuerSet.add(c.issuerName))
  credRows.forEach((c: any) => c.issuer && issuerSet.add(c.issuer))

  const scoreVals = passes.map((p) => p.score).filter((s): s is number => s !== null)
  const avgScore =
    scoreVals.length > 0
      ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length)
      : null

  /* ----------------------------- Render ----------------------------- */
  return (
    <CandidateDetailedProfileView
      candidateId={candidateId}
      name={row.userRow?.name ?? null}
      email={row.userRow?.email ?? ''}
      avatarSrc={(row.userRow as any)?.image ?? null}
      bio={row.cand.bio ?? null}
      pipelineSummary={pipelineSummary}
      statusCounts={statusCounts as StatusCounts}
      passes={passes}
      snapshot={{
        uniqueIssuers: issuerSet.size,
        avgScore,
        experienceCount: experiences.length,
        projectCount: projects.length,
      }}
      experiences={experiences}
      projects={projects}
      socials={{
        twitterUrl: row.cand.twitterUrl,
        githubUrl: row.cand.githubUrl,
        linkedinUrl: row.cand.linkedinUrl,
        websiteUrl: row.cand.websiteUrl,
      }}
      credentials={{
        rows: credRows as any,
        sort,
        order: order as 'asc' | 'desc',
        pagination: {
          page,
          hasNext,
          pageSize,
          basePath: `/recruiter/talent/${candidateId}`,
          initialParams: credInitialParams,
        },
      }}
      pipeline={{
        rows: pipeRows,
        sort: pipeSort,
        order: pipeOrder as 'asc' | 'desc',
        pagination: {
          page: pipePage,
          hasNext: pipeHasNext,
          pageSize: pipePageSize,
          basePath: `/recruiter/talent/${candidateId}`,
          initialParams: pipeInitialParams,
        },
        addToPipelineForm: <AddToPipelineForm candidateId={candidateId} pipelines={pipelines} />,
      }}
    />
  )
}
