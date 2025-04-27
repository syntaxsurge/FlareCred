import { asc, desc, eq, and } from 'drizzle-orm'

import CandidateDetailedProfileView from '@/components/dashboard/candidate/profile-detailed-view'
import { type RowType as CredRowType } from '@/components/dashboard/recruiter/credentials-table'
import { db } from '@/lib/db/drizzle'
import {
  getCandidateCredentialsSection,
  type StatusCounts,
} from '@/lib/db/queries/candidate-details'
import { candidates, users, quizAttempts, issuers } from '@/lib/db/schema'
import {
  candidateCredentials,
  candidateHighlights,
  CredentialCategory,
  CredentialStatus,
} from '@/lib/db/schema/candidate'

export const revalidate = 0

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Params = { id: string }
type Query = Record<string, string | string[] | undefined>

type Experience = {
  id: number
  title: string
  company: string | null
  type: string | null
  link: string | null
  createdAt: Date
  status?: string | null
}

type Project = {
  id: number
  title: string
  link: string | null
  description: string | null
  createdAt: Date
  status?: string | null
}

/** Raw row returned from the highlights query */
type HighlightRow = {
  id: number
  title: string
  createdAt: Date
  issuerName: string | null
  link: string | null
  description: string | null
  status: string | null
  sortOrder: number | null
  /** String literals returned by DB enum; matches keys of CredentialCategory */
  category: keyof typeof CredentialCategory
}

/* Helpers */
const first = (p: Query, k: string) => (Array.isArray(p[k]) ? p[k]?.[0] : p[k])

/* -------------------------------------------------------------------------- */
/*                                    PAGE                                    */
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

  /* ------------------------- Candidate row ------------------------------ */
  const [row] = await db
    .select({ cand: candidates, userRow: users })
    .from(candidates)
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(eq(candidates.id, candidateId))
    .limit(1)

  if (!row) return <div>Candidate not found.</div>

  /* ------------------ Experiences & Projects --------------------------- */
  const highlightBase = () =>
    db
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

  const experienceRowsRaw = await highlightBase()
    .where(
      and(
        eq(candidateHighlights.candidateId, candidateId),
        eq(candidateCredentials.category, CredentialCategory.EXPERIENCE),
      ),
    )
    .orderBy(asc(candidateHighlights.sortOrder))

  const projectRowsRaw = await highlightBase()
    .where(
      and(
        eq(candidateHighlights.candidateId, candidateId),
        eq(candidateCredentials.category, CredentialCategory.PROJECT),
      ),
    )
    .orderBy(asc(candidateHighlights.sortOrder))

  const experienceRows: HighlightRow[] = experienceRowsRaw as HighlightRow[]
  const projectRows: HighlightRow[] = projectRowsRaw as HighlightRow[]

  const experiences: Experience[] = experienceRows.map(
    (e): Experience => ({
      id: e.id,
      title: e.title,
      company: e.issuerName,
      type: e.description,
      link: e.link,
      createdAt: e.createdAt,
      status: e.status,
    }),
  )

  const projects: Project[] = projectRows.map(
    (p): Project => ({
      id: p.id,
      title: p.title,
      link: p.link,
      description: p.description,
      createdAt: p.createdAt,
      status: p.status,
    }),
  )

  /* ---------------------- Paged credentials ---------------------------- */
  const page = Math.max(1, Number(first(q, 'page') ?? '1'))
  const sizeRaw = Number(first(q, 'size') ?? '10')
  const pageSize = [10, 20, 50].includes(sizeRaw) ? sizeRaw : 10

  const allowedSortKeys = ['createdAt', 'status', 'title', 'issuer'] as const
  type SortKey = (typeof allowedSortKeys)[number]
  const sortRaw = (first(q, 'sort') ?? 'status') as string
  const sort: SortKey = allowedSortKeys.includes(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : 'status'

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
    sort,
    order as 'asc' | 'desc',
    searchTerm,
  )

  const credRows: CredRowType[] = rawCredRows.map(
    (c): CredRowType => ({
      id: c.id,
      title: c.title,
      category: (c as any).category ?? CredentialCategory.OTHER,
      issuer: (c as any).issuer ?? null,
      status: (c as any).status as CredentialStatus,
      fileUrl: (c as any).fileUrl ?? null,
    }),
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

  /* ------------------------ Quiz passes ------------------------------- */
  const passes = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.candidateId, candidateId))
    .orderBy(desc(quizAttempts.createdAt))

  /* ---------------------------- View ---------------------------------- */
  return (
    <CandidateDetailedProfileView
      candidateId={candidateId}
      name={row.userRow?.name ?? null}
      email={row.userRow?.email ?? ''}
      avatarSrc={(row.userRow as any)?.image ?? null}
      bio={row.cand.bio ?? null}
      statusCounts={statusCounts as StatusCounts}
      passes={passes}
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
      showShare
    />
  )
}
