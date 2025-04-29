/**
 * Shared UI-layer data and prop interfaces.
 * Keeping these in one place removes duplication and enforces strict typing across the app.
 */

import type { ReactNode, ElementType } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Stage } from '@/lib/constants/recruiter'
import type { MemberRow } from './table-rows'
import type { CredentialStatus } from '@/lib/db/schema/candidate'

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
  extends React.ComponentProps<typeof import('@/components/ui/button').Button> {
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

/* -------------------------------------------------------------------------- */
/*                         Newly centralised component props                  */
/* -------------------------------------------------------------------------- */

/** Props for the issuer-side CredentialActions component. */
export interface CredentialActionsProps {
  credentialId: number
  status: CredentialStatus
  /** True when credential.type === 'github_repo' */
  isGithub: boolean
}

/** Props for the recruiter EditCandidateModal component. */
export interface EditCandidateModalProps {
  pipelineCandidateId: number
  currentStage: Stage
  children: ReactNode
}

/** Props for the admin IssuerStatusButtons component. */
export interface IssuerStatusButtonsProps {
  issuerId: number
  status: string
}

/* -------------------------------------------------------------------------- */
/*                         Candidate Highlights Board                         */
/* -------------------------------------------------------------------------- */

/** Props for the candidate HighlightsBoard component. */
export interface HighlightsBoardProps {
  selectedExperience: HighlightCredential[]
  selectedProject: HighlightCredential[]
  available: HighlightCredential[]
}

/** Props for the profile header component. */
export interface ProfileHeaderProps {
  name: string | null
  email: string
  walletAddress?: string
  avatarSrc?: string | null
  profilePath?: string
  showShare?: boolean
  stats?: ProfileStat[]
  socials?: SocialLink[]
  children?: ReactNode
}

/** Props for the recruiter PipelineBoard component. */
export interface PipelineBoardProps {
  pipelineId: number
  initialData: Record<Stage, PipelineCandidateCard[]>
}

/* -------------------------------------------------------------------------- */
/*                        Newly centralised component props                   */
/* -------------------------------------------------------------------------- */

/** Props for the encapsulated page section card component. */
export interface PageCardProps {
  /** Lucide icon component */
  icon: ElementType
  /** Card title text */
  title: string
  /** Optional small description below the title */
  description?: string
  /** Optional right-aligned header actions (e.g. buttons) */
  actions?: ReactNode
  /** Main body content */
  children: ReactNode
  /** Extra classes applied to the Card wrapper */
  className?: string
}

/** Props for the universal status badge component. */
export interface StatusBadgeProps {
  /** Status string used for colour/icon mapping */
  status: string
  /** Additional class names */
  className?: string
  /** Show status-specific icon. Defaults to false. */
  showIcon?: boolean
  /** 'left' | 'right'; icon placement relative to text. Defaults to 'left'. */
  iconPosition?: 'left' | 'right'
  /** Optional number to display after the label (e.g. count). */
  count?: number
}

/** Generic application modal props shared across the app. */
export interface AppModalProps {
  /** Direct LucideIcon component (client only) */
  icon?: LucideIcon
  /** String identifier mapped through ICON_MAP (SSR safe) */
  iconKey?: string
  /** Bold heading text */
  title: string
  /** Helper text under the title */
  description?: string
  /** CTA label (ignored when custom children provided) */
  buttonText?: string
  /** Route pushed on CTA click (ignored when custom children provided) */
  redirectTo?: string
  /** Optional custom body; when provided, default button section is omitted */
  children?: ReactNode
  /** If true, modal cannot be closed (no outside-click close & no X). */
  required?: boolean
}