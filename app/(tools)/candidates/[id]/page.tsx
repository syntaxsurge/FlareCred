import { redirect } from 'next/navigation'

import { eq, asc } from 'drizzle-orm'

import CandidateDetailedProfileView from '@/components/dashboard/candidate/profile-detailed-view'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { getCandidatePipelineEntriesPage } from '@/lib/db/queries/recruiter-pipeline-entries'
import { getCandidateSkillPassesSection } from '@/lib/db/queries/candidate-skill-passes'
import { getCandidateCredentialsSection } from '@/lib/db/queries/candidate-credentials-core'
import { candidates, users } from '@/lib/db/schema'
import {
  candidateHighlights,
  candidateCredentials,
  CredentialCategory,
  CredentialStatus,
} from '@/lib/db/schema/candidate'
import { issuers } from '@/lib/db/schema/issuer'
import { recruiterPipelines } from '@/lib/db/schema/recruiter'
import AddToPipelineForm from '@/app/(dashboard)/recruiter/talent/[id]/add-to-pipeline-form'
import type {
  PipelineEntryRow,
  RecruiterCredentialRow,
  SkillPassRow,
} from '@/lib/types/tables'
import type { StatusCounts } from '@/lib/types/candidate'
import { Stage } from '@/lib/types/recruiter'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Params = { id: string }
type Query = Record<string, string | string[] | undefined>
const first = (p: Query, k: string) => (Array.isArray(p[k]) ? p[k]?.[0] : p[k])

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default async function PublicCandidateProfile({
  params,
  searchParams,
}: {
  params: Params | Promise<Params>
  searchParams: Query | Promise<Query>
}) {
  const { id } = await params
  const candidateId = Number(id)
  const q = (await searchParams) as Query

  /* ----------------------------- Candidate row --------------------------- */
  const [row] = await db
    .select({ cand: candidates, userRow: users })
    .from(candidates)
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(eq(candidates.id, candidateId))
    .limit(1)

  if (!row) return <div>Candidate not found.</div>

  /* -------------------------- Logged-in user ----------------------------- */
  const user = await getUser()
  const isRecruiter = user?.role === 'recruiter'

  /* ---------------------------------------------------------------------- */
  /*                    Experiences & Projects ( Highlights )               */
  /* ---------------------------------------------------------------------- */
  const highlightRows = await db
    .select({
      id: candidateCredentials.id,
      title: candidateCredentials.title,
      createdAt: candidateCredentials.createdAt,
      issuerName: issuers.name,
      link: candidateCredentials.fileUrl,
      description: candidateCredentials.type,
      status: candidateCredentials.status,
      category: candidateCredentials.category,
      sortOrder: candidateHighlights.sortOrder,
    })
    .from(candidateHighlights)
    .innerJoin(
      candidateCredentials,
      eq(candidateHighlights.credentialId, candidateCredentials.id),
    )
    .leftJoin(issuers, eq(candidateCredentials.issuerId, issuers.id))
    .where(eq(candidateHighlights.candidateId, candidateId))

  const experiences = highlightRows
    .filter((h) => h.category === CredentialCategory.EXPERIENCE)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((e) => ({
      id: e.id,
      title: e.title,
      company: e.issuerName,
      createdAt: e.createdAt,
      status: e.status as CredentialStatus,
    }))

  const projects = highlightRows
    .filter((h) => h.category === CredentialCategory.PROJECT)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((p) => ({
      id: p.id,
      title: p.title,
      link: p.link,
      description: p.description,
      createdAt: p.createdAt,
      status: p.status as CredentialStatus,
    }))

  /* ---------------------------------------------------------------------- */
  /*                 Credentials (shared core helper)                       */
  /* ---------------------------------------------------------------------- */
  const page = Math.max(1, Number(first(q, 'page') ?? '1'))
  const sizeRaw = Number(first(q, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10
  const sort = first(q, 'sort') ?? 'status'
  const order = first(q, 'order') === 'asc' ? 'asc' : 'desc'
  const searchTerm = (first(q, 'q') ?? '').trim()

  const {
    rows: rawCredRows,
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

  const credRows: RecruiterCredentialRow[] = rawCredRows.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category ?? CredentialCategory.OTHER,
    issuer: c.issuer ?? null,
    status: c.status as CredentialStatus,
    fileUrl: c.fileUrl ?? null,
    txHash: c.txHash ?? null,
    vcJson: c.vcJson ?? null,
  }))

  const credInitialParams: Record<string, string> = {}
  const keep = (k: string) => {
    const v = first(q, k)
    if (v) credInitialParams[k] = v
  }
  keep('size')
  keep('sort')
  keep('order')
  if (searchTerm) credInitialParams['q'] = searchTerm

  /* ---------------------------------------------------------------------- */
  /*                     Skill Passes (shared helper)                       */
  /* ---------------------------------------------------------------------- */
  const passPage = Math.max(1, Number(first(q, 'passPage') ?? '1'))
  const passSizeRaw = Number(first(q, 'passSize') ?? '10')
  const passPageSize = [10, 20, 50].includes(passSizeRaw) ? passSizeRaw : 10
  const passAllowedSort = ['quizTitle', 'score', 'createdAt'] as const
  type PassSortKey = (typeof passAllowedSort)[number]
  const passSortRaw = (first(q, 'passSort') ?? 'createdAt') as string
  const passSort: PassSortKey = passAllowedSort.includes(passSortRaw as PassSortKey)
    ? (passSortRaw as PassSortKey)
    : 'createdAt'
  const passOrder = first(q, 'passOrder') === 'asc' ? 'asc' : 'desc'
  const passSearch = (first(q, 'passQ') ?? '').trim()

  const { rows: passRows, hasNext: passHasNext } = await getCandidateSkillPassesSection(
    candidateId,
    passPage,
    passPageSize,
    passSort,
    passOrder,
    passSearch,
  )

  const passInitialParams: Record<string, string> = {}
  const keepPass = (k: string) => {
    const v = first(q, k)
    if (v) passInitialParams[k] = v
  }
  ;['passSize', 'passSort', 'passOrder'].forEach(keepPass)
  if (passSearch) passInitialParams['passQ'] = passSearch

  /* ---------------------------------------------------------------------- */
  /*                   Recruiter-only Pipeline Entries                      */
  /* ---------------------------------------------------------------------- */
  let pipelineSummary: string | undefined
  let pipelineSection:
    | {
        rows: PipelineEntryRow[]
        sort: string
        order: 'asc' | 'desc'
        pagination: {
          page: number
          hasNext: boolean
          pageSize: number
          basePath: string
          initialParams: Record<string, string>
        }
        addToPipelineForm?: React.ReactNode
      }
    | undefined

  if (isRecruiter) {
    /* ------------------ Recruiter pipelines for dropdown ------------------ */
    const pipelines = await db
      .select({ id: recruiterPipelines.id, name: recruiterPipelines.name })
      .from(recruiterPipelines)
      .where(eq(recruiterPipelines.recruiterId, user!.id))
      .orderBy(asc(recruiterPipelines.name))

    /* --------------------- Pipeline entries listing ---------------------- */
    const pipePage = Math.max(1, Number(first(q, 'pipePage') ?? '1'))
    const pipeSizeRaw = Number(first(q, 'pipeSize') ?? '10')
    const pipePageSize = [10, 20, 50].includes(pipeSizeRaw) ? pipeSizeRaw : 10
    const allowedPipeSort = ['pipelineName', 'stage', 'addedAt'] as const
    type PipeSortKey = (typeof allowedPipeSort)[number]
    const pipeSortRaw = (first(q, 'pipeSort') ?? 'addedAt') as string
    const pipeSort: PipeSortKey = allowedPipeSort.includes(pipeSortRaw as PipeSortKey)
      ? (pipeSortRaw as PipeSortKey)
      : 'addedAt'
    const pipeOrder = first(q, 'pipeOrder') === 'asc' ? 'asc' : 'desc'
    const pipeSearchTerm = (first(q, 'pipeQ') ?? '').trim()

    const { entries, hasNext: pipeHasNext } = await getCandidatePipelineEntriesPage(
      candidateId,
      user!.id,
      pipePage,
      pipePageSize,
      pipeSort,
      pipeOrder,
      pipeSearchTerm,
    )

    const pipeInitialParams: Record<string, string> = {}
    const keepPipe = (k: string) => {
      const v = first(q, k)
      if (v) pipeInitialParams[k] = v
    }
    keepPipe('pipeSize')
    keepPipe('pipeSort')
    keepPipe('pipeOrder')
    if (pipeSearchTerm) pipeInitialParams['pipeQ'] = pipeSearchTerm

    /* Build summary (e.g. "In X Pipelines”) */
    const uniquePipelines = new Set(entries.map((e) => e.pipelineName))
    if (entries.length > 0) {
      pipelineSummary =
        uniquePipelines.size === 1
          ? `In ${[...uniquePipelines][0]}`
          : `In ${uniquePipelines.size} Pipelines`
    }

    pipelineSection = {
      rows: entries,
      sort: pipeSort,
      order: pipeOrder as 'asc' | 'desc',
      pagination: {
        page: pipePage,
        hasNext: pipeHasNext,
        pageSize: pipePageSize,
        basePath: `/candidates/${candidateId}`,
        initialParams: pipeInitialParams,
      },
      addToPipelineForm: (
        <AddToPipelineForm candidateId={candidateId} pipelines={pipelines} />
      ),
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                               Render                                   */
  /* ---------------------------------------------------------------------- */
  return (
    <CandidateDetailedProfileView
      candidateId={candidateId}
      name={row.userRow?.name ?? null}
      email={row.userRow?.email ?? ''}
      avatarSrc={(row.userRow as any)?.image ?? null}
      bio={row.cand.bio ?? null}
      pipelineSummary={pipelineSummary}
      statusCounts={statusCounts as StatusCounts}
      passes={{
        rows: passRows as SkillPassRow[],
        sort: passSort,
        order: passOrder as 'asc' | 'desc',
        pagination: {
          page: passPage,
          hasNext: passHasNext,
          pageSize: passPageSize,
          basePath: `/candidates/${candidateId}`,
          initialParams: passInitialParams,
        },
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
        rows: credRows,
        sort,
        order: order as 'asc' | 'desc',
        pagination: {
          page,
          hasNext,
          pageSize,
          basePath: `/candidates/${candidateId}`,
          initialParams: credInitialParams,
        },
      }}
      pipeline={pipelineSection}
      showShare
    />
  )
}