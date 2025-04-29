import type { ActivityType } from '@/lib/db/schema'

/**
 * Shared table-row interfaces for DataTable-based UI components.
 * Centralising these definitions eliminates duplication and keeps schemas in sync.
 */

/* --------------------------- Directory & public -------------------------- */
export interface CandidateDirectoryRow {
  id: number
  name: string | null
  email: string
  verified: number
}

/* ------------------------------ Invitations ------------------------------ */
export interface InvitationRow {
  id: number
  team: string
  role: string
  inviter: string | null
  status: string
  invitedAt: Date
}

/* ------------------------------- Pipelines ------------------------------- */
export interface PipelineRow {
  id: number
  name: string
  description: string | null
  createdAt: string
}

/* ---------------- Recruiter – Pipeline Entries --------------------------- */
export interface PipelineEntryRow {
  id: number
  pipelineId: number
  pipelineName: string
  stage: string
}

/* --------------------------- Admin – Issuers ----------------------------- */
export interface AdminIssuerRow {
  id: number
  name: string
  domain: string
  owner: string | null
  category: string
  industry: string
  status: string
}

/* ------------------------ Candidate – Credentials ------------------------ */
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

/* ------------------------------ Recruiter -------------------------------- */
export interface TalentRow {
  id: number
  name: string | null
  email: string
  bio: string | null
  verified: number
  topScore: number | null
}

/* ---------------------------- Admin – Misc ------------------------------- */
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

/* ------------------------ Issuer – Requests ------------------------------ */
export interface IssuerRequestRow {
  id: number
  title: string
  type: string
  candidate: string
  status: string
  vcJson?: string | null
}

/* ---------------- Recruiter – Candidate Credentials --------------------- */
export interface RecruiterCredentialRow {
  id: number
  title: string
  category: string
  issuer: string | null
  status: string
  fileUrl: string | null
}

/* --------------------------- Team – Members ------------------------------ */
export interface MemberRow {
  id: number
  name: string
  email: string
  walletAddress?: string | null
  role: string
  joinedAt: string
}

/* -------------------- Settings – Activity Logs --------------------------- */
export interface ActivityLogRow {
  id: number
  type: ActivityType
  ipAddress?: string | null
  timestamp: string
}

/* ------------------- Issuer Directory – Issuers -------------------------- */
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