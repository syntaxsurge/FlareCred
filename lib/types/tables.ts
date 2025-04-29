import type { ActivityType } from '@/lib/db/schema'

export interface TableProps<T extends Record<string, any>> {
  /** Row data slice for the current page */
  rows: T[]
  /** Current sort column key */
  sort: string
  /** Current sort order */
  order: 'asc' | 'desc'
  /** Base pathname used in navigation helpers */
  basePath: string
  /** Query-string params that persist across navigations */
  initialParams: Record<string, string>
  /** Current search term */
  searchQuery: string
  /**
   * Whether the current viewer is the team owner – used by members tables
   * to enable privileged actions like role updates and removals.
   * Optional so other table views do not need to redeclare a custom props
   * interface just to add this single flag.
   */
  isOwner?: boolean
}

/* --------------------------------------------------------------------- */
/*                            Pagination                                 */
/* --------------------------------------------------------------------- */

/** Generic pager envelope returned by DB query helpers. */
export type PageResult<T> = {
  /** Row slice for the current page. */
  rows: T[]
  /** Whether another page exists beyond the current slice. */
  hasNext: boolean
}

export interface TablePaginationProps {
  /** 1-based current page number */
  page: number
  /** Whether another page exists beyond the current slice */
  hasNext: boolean
  /** Base pathname used when building navigation links */
  basePath: string
  /** Existing query-string parameters that must persist (excluding "page”) */
  initialParams: Record<string, string>
  /** Current page size */
  pageSize: number
  /** Optional selector options (defaults to 10 / 20 / 50) */
  pageSizeOptions?: number[]
}

/* --------------------------------------------------------------------- */
/*                         Directory & Public                            */
/* --------------------------------------------------------------------- */

export interface CandidateDirectoryRow {
  id: number
  name: string | null
  email: string
  verified: number
}

/* --------------------------------------------------------------------- */
/*                              Invitations                              */
/* --------------------------------------------------------------------- */

export interface InvitationRow {
  id: number
  team: string
  role: string
  inviter: string | null
  status: string
  invitedAt: Date
}

/* --------------------------------------------------------------------- */
/*                               Pipelines                               */
/* --------------------------------------------------------------------- */

export interface PipelineRow {
  id: number
  name: string
  description: string | null
  createdAt: string
}

/* --------------------------------------------------------------------- */
/*                  Recruiter – Pipeline Entries                         */
/* --------------------------------------------------------------------- */

export interface PipelineEntryRow {
  id: number
  pipelineId: number
  pipelineName: string
  stage: string
  /** ISO string when provided – not required by all views */
  addedAt?: string
}

/* --------------------------------------------------------------------- */
/*                         Admin – Issuer table                          */
/* --------------------------------------------------------------------- */

export interface AdminIssuerRow {
  id: number
  name: string
  domain: string
  owner: string | null
  category: string
  industry: string
  status: string
}

/* --------------------------------------------------------------------- */
/*                Candidate / Recruiter / Admin – Credentials            */
/* --------------------------------------------------------------------- */

/**
 * Credential row schema reused across candidate, recruiter and admin screens.
 * Optional properties cover view-specific needs while keeping a single source of truth.
 */
export interface CandidateCredentialRow {
  id: number
  title: string
  /** Broad category – education, experience, etc. */
  category?: string
  /** Fine-grained sub-type – e.g. ‘github_repo’. */
  type?: string
  issuer: string | null
  status: string
  /** Attached document / repo URL (nullable). */
  fileUrl?: string | null
  /** Optional FDC proof metadata. */
  proofType?: string | null
  proofData?: string | null
  /** Optional Verifiable Credential JSON blob. */
  vcJson?: string | null
}

/* --------------------------------------------------------------------- */
/*                       Recruiter – Talent Search                       */
/* --------------------------------------------------------------------- */

export interface TalentRow {
  id: number
  name: string | null
  email: string
  bio: string | null
  verified: number
  topScore: number | null
}

/* --------------------------------------------------------------------- */
/*                         Admin – Miscellaneous                         */
/* --------------------------------------------------------------------- */

export interface AdminCredentialRow {
  id: number
  title: string
  candidate: string
  issuer: string | null
  status: string
  proofType: string | null
  vcJson: string | null
}

export interface AdminUserRow {
  id: number
  name: string | null
  email: string
  role: string
  createdAt: string
}

/* --------------------------------------------------------------------- */
/*                       Issuer – Verification Requests                  */
/* --------------------------------------------------------------------- */

export interface IssuerRequestRow {
  id: number
  title: string
  type: string
  candidate: string
  status: string
  vcJson?: string | null
}

/* --------------------------------------------------------------------- */
/*                 Recruiter – Candidate Credentials                     */
/* --------------------------------------------------------------------- */

export interface RecruiterCredentialRow {
  id: number
  title: string
  category: string
  issuer: string | null
  status: string
  fileUrl: string | null
}

/* --------------------------------------------------------------------- */
/*                          Team Settings – Members                      */
/* --------------------------------------------------------------------- */

export interface MemberRow {
  id: number
  name: string
  email: string
  walletAddress?: string | null
  role: string
  joinedAt: string
}

/* --------------------------------------------------------------------- */
/*                        Settings – Activity Logs                       */
/* --------------------------------------------------------------------- */

export interface ActivityLogRow {
  id: number
  type: ActivityType
  ipAddress?: string | null
  timestamp: string
}

/* --------------------------------------------------------------------- */
/*                    Issuer Directory – Issuers                         */
/* --------------------------------------------------------------------- */

export interface IssuerDirectoryRow {
  id: number
  name: string
  domain: string
  category: string
  industry: string
  status: string
  logoUrl?: string | null
  did?: string | null
  createdAt: string
}
