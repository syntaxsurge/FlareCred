/**
 * Shared table-row interfaces for DataTable-based UI components.
 * Keeping these in one place avoids duplication and drift between views.
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

/* --------------------------- Admin – Issuers ----------------------------- */
export interface AdminIssuerRow {
  id: number
  name: string
  domain: string
  owner: string
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
/** Row schema for /admin/credentials table. */
export interface AdminCredentialRow {
  id: number
  title: string
  candidate: string
  issuer: string | null
  status: string
  proofType: string | null
  vcJson: string | null
}

/** Row schema for /admin/users table. */
export interface AdminUserRow {
  id: number
  name: string | null
  email: string
  role: string
  createdAt: string
}

/* ------------------------ Issuer – Requests ------------------------------ */
/** Row schema for /issuer/requests table. */
export interface IssuerRequestRow {
  id: number
  title: string
  type: string
  candidate: string
  status: string
  vcJson?: string | null
}

/* ------------------ Recruiter – Candidate Credentials -------------------- */
/** Row schema for recruiter credential view. */
export interface RecruiterCredentialRow {
  id: number
  title: string
  category: string
  issuer: string | null
  status: string
  fileUrl: string | null
}