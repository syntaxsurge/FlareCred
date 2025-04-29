/**
 * Shared table-row interfaces for DataTable-based UI components.
 * Keeping these in one place avoids duplication and drift between views.
 */

export interface CandidateDirectoryRow {
  id: number
  name: string | null
  email: string
  verified: number
}

export interface InvitationRow {
  id: number
  team: string
  role: string
  inviter: string | null
  status: string
  invitedAt: Date
}

export interface PipelineRow {
  id: number
  name: string
  description: string | null
  createdAt: string
}

export interface AdminIssuerRow {
  id: number
  name: string
  domain: string
  owner: string
  category: string
  industry: string
  status: string
}

export interface CandidateCredentialRow {
  id: number
  title: string
  category: string
  type: string
  issuer: string | null
  status: string
  fileUrl: string | null
  vcJson: string | null
}

export interface TalentRow {
  id: number
  name: string | null
  email: string
  bio: string | null
  verified: number
  topScore: number | null
}