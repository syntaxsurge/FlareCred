/**
 * Credential-related constants shared across client and server layers.
 *
 * ─ PROOF_TYPES ────────────────────────────────────────────────────────────
 *   Categories supported by the Flare Data Connector on-chain verifier.
 *
 * ─ CREDENTIAL_TYPES ──────────────────────────────────────────────────────
 *   Fine-grained credential sub-types that may appear in the
 *   `candidate_credentials.type` column (UI select, validation, etc.).
 *   Extend this list whenever a new sub-type is introduced so client and
 *   server logic stay in sync.
 */

export const PROOF_TYPES = ['EVM', 'JSON', 'PAYMENT', 'ADDRESS'] as const
export type ProofType = (typeof PROOF_TYPES)[number]

export const CREDENTIAL_TYPES = ['github_repo'] as const
export type CredentialType = (typeof CREDENTIAL_TYPES)[number]

/**
 * Returns true when `type` represents a GitHub repository contribution
 * credential (comparison is case-insensitive and ignores surrounding spaces).
 */
export function isGithubRepoCredential(type: string): boolean {
  return type.trim().toLowerCase() === 'github_repo'
}
