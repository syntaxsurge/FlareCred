/**
 * Shared UI-layer data and prop interfaces.
 * Keeping these in one place reduces duplication and enforces strict typing across components.
 */

import type { ReactNode, ElementType } from 'react'
import type { Stage } from '@/lib/constants/recruiter'

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