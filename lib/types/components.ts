/**
 * Shared UI-layer data and prop interfaces.
 * Keeping these in one place removes duplication and enforces strict typing across the app.
 */

import type { ReactNode, ElementType } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Button } from '@/components/ui/button'
import type { Stage } from '@/lib/constants/recruiter'
import type { MemberRow } from './table-rows'

/* -------------------------------------------------------------------------- */
/*                               Quick Actions                                */
/* -------------------------------------------------------------------------- */

/** Button-style quick action used in dashboards. */
export interface QuickAction {
  href: string
  label: string
  /** Filled (default) or outline button variant. */
  variant?: 'default' | 'outline'
}

/* -------------------------------------------------------------------------- */
/*                           Candidate Highlights                             */
/* -------------------------------------------------------------------------- */

/** Minimal credential slice used in the candidate highlights board. */
export interface HighlightCredential {
  id: number
  title: string
  category: 'EXPERIENCE' | 'PROJECT'
  type: string
  issuer: string | null
  fileUrl: string | null
}

/* -------------------------------------------------------------------------- */
/*                              Profile Header                                */
/* -------------------------------------------------------------------------- */

/** Simple label/value pair rendered as a stat pill. */
export interface ProfileStat {
  label: string
  value: ReactNode
}

/** Social link metadata displayed in profile headers. */
export interface SocialLink {
  href: string
  icon: ElementType
  label: string
}

/* -------------------------------------------------------------------------- */
/*                       Recruiter Pipeline Candidate                         */
/* -------------------------------------------------------------------------- */

/** Lightweight card representation for a candidate inside a pipeline. */
export interface PipelineCandidateCard {
  id: number
  candidateId: number
  name: string
  email: string
  stage: Stage
}

/* -------------------------------------------------------------------------- */
/*                                Quiz Meta                                   */
/* -------------------------------------------------------------------------- */

/** Quiz descriptor passed to the StartQuizForm modal. */
export interface QuizMeta {
  id: number
  title: string
  description?: string | null
}

/* -------------------------------------------------------------------------- */
/*                              Team Metadata                                 */
/* -------------------------------------------------------------------------- */

/** Subscription / DID metadata shown in team settings. */
export interface TeamMeta {
  planName: string | null
  subscriptionPaidUntil: Date | string | null
  did: string | null
}

/* -------------------------------------------------------------------------- */
/*                           Generic Data-table Types                         */
/* -------------------------------------------------------------------------- */

/** Column configuration consumed by the generic DataTable component. */
export interface Column<T extends Record<string, any>> {
  key: keyof T
  header: string | ReactNode
  render?: (value: T[keyof T], row: T) => ReactNode
  enableHiding?: boolean
  sortable?: boolean
  className?: string
}

/** Bulk-action descriptor returned by DataTable. */
export interface BulkAction<T extends Record<string, any>> {
  label: string
  icon: LucideIcon
  onClick: (selectedRows: T[]) => void | Promise<void>
  variant?: 'default' | 'destructive' | 'outline'
  isAvailable?: (rows: T[]) => boolean
  isDisabled?: (rows: T[]) => boolean
}

/** Config object accepted by the useBulkActions helper hook. */
export interface BulkActionConfig<Row extends Record<string, any>> {
  label: string
  icon: LucideIcon
  variant?: 'default' | 'destructive' | 'outline'
  handler: (rows: Row[]) => Promise<void> | void
  isAvailable?: (rows: Row[]) => boolean
  isDisabled?: (rows: Row[]) => boolean
}

/** Row-level dropdown action used by TableRowActions. */
export interface TableRowAction<Row> {
  label: string
  icon: LucideIcon
  /** Click handler (ignored when `href` is supplied). */
  onClick?: (row: Row) => void | Promise<void>
  /** Optional external link rendered as <a>. */
  href?: string
  /** Visual variant – destructive actions get red styling. */
  variant?: 'default' | 'destructive'
  /** Disable predicate evaluated per-row. */
  disabled?: (row: Row) => boolean
}

/* -------------------------------------------------------------------------- */
/*                              Navigation Items                              */
/* -------------------------------------------------------------------------- */

/** Sidebar navigation entry descriptor. */
export interface SidebarNavItem {
  href: string
  icon: LucideIcon
  label: string
  /** Optional numeric badge – hidden when zero/undefined. */
  badgeCount?: number
}

/* -------------------------------------------------------------------------- */
/*                           Action-button Helpers                            */
/* -------------------------------------------------------------------------- */

/** Standardised return shape for async UI actions. */
export type ActionResult = void | { success?: string; error?: string }

/** Prop contract for the universal async ActionButton component. */
export interface ActionButtonProps
  extends React.ComponentProps<typeof Button> {
  /** Async handler executed on click. */
  onAction: () => Promise<ActionResult>
  /** Optional label shown while pending; defaults to children. */
  pendingLabel?: ReactNode
}

/* -------------------------------------------------------------------------- */
/*                           Combobox / Select types                          */
/* -------------------------------------------------------------------------- */

/** Lightweight issuer record used by the IssuerSelect combobox. */
export interface IssuerOption {
  id: number
  name: string
  category: string
  industry: string
}

/* -------------------------------------------------------------------------- */
/*                      Charts data & component prop types                    */
/* -------------------------------------------------------------------------- */

/** Generic name/value pair used in pie-chart datasets. */
export interface Datum {
  name: string
  value: number
}

/** Time-series quiz-score datum. */
export interface ScoreDatum {
  date: string
  score: number
}

/** Credential-status slice used in candidate pie chart. */
export interface StatusDatum {
  name: string
  value: number
}

/** Stage/count tuple for recruiter pipeline bar chart. */
export interface StageDatum {
  stage: string
  count: number
}

/** Props for the Admin dashboard charts component. */
export interface AdminChartsProps {
  usersData: Datum[]
  issuerData: Datum[]
  credentialData: Datum[]
}

/** Props for the Candidate dashboard charts component. */
export interface CandidateChartsProps {
  scoreData: ScoreDatum[]
  statusData: StatusDatum[]
}

/** Props for the Issuer dashboard charts component. */
export interface IssuerChartsProps {
  pending: number
  verified: number
}

/** Props for the Recruiter dashboard charts component. */
export interface RecruiterChartsProps {
  stageData: StageDatum[]
  uniqueCandidates: number
}

/* -------------------------------------------------------------------------- */
/*                         Page-specific component props                      */
/* -------------------------------------------------------------------------- */

/** Props for the Team Settings page component. */
export interface SettingsProps {
  team: TeamMeta
  rows: MemberRow[]
  isOwner: boolean
  page: number
  hasNext: boolean
  pageSize: number
  sort: string
  order: 'asc' | 'desc'
  searchQuery: string
  basePath: string
  initialParams: Record<string, string>
}

/** Props for the WalletOnboardModal component. */
export interface WalletOnboardModalProps {
  isConnected: boolean
  user: any | null
}

/** Props for the AddCredentialDialog component. */
export interface AddCredentialDialogProps {
  /** Server action wrapper passed from the parent server component */
  addCredentialAction: (formData: FormData) => Promise<{ error?: string } | void>
  /** Whether the current user’s team already has a DID */
  hasDid: boolean
}