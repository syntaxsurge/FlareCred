/* -------------------------------------------------------------------------- */
/*                    Credential-related runtime constants                    */
/* -------------------------------------------------------------------------- */

import type { ProofType, CredentialType } from '@/lib/types/credential'

/**
 * Ordered list of supported proof mechanisms.
 *
 * • `NONE`    – no structured proof; the attached file itself is taken as evidence.
 * • `EVM`     – transaction hash anchoring an on-chain attestation.
 * • `JSON`    – raw JSON object produced by an external data-connector (e.g. GitHub).
 * • `PAYMENT` – transaction hash proving receipt of payment.
 * • `ADDRESS` – cryptographic proof of address ownership.
 */
export const PROOF_TYPES = ['NONE', 'EVM', 'JSON', 'PAYMENT', 'ADDRESS'] as const

/* -------------------------------------------------------------------------- */
/*                       Credential-type helpers                              */
/* -------------------------------------------------------------------------- */

/** Identifier for "Open-Source Contribution” credentials backed by GitHub data. */
export const GITHUB_REPO_CREDENTIAL_TYPE: CredentialType = 'github_repo'

/**
 * Type-guard that returns `true` when the supplied credential type
 * corresponds to a GitHub repository contribution credential.
 *
 * @param type – Credential "type” field (may be null / undefined).
 */
export function isGithubRepoCredential(
  type: string | null | undefined,
): type is 'github_repo' {
  return type === GITHUB_REPO_CREDENTIAL_TYPE
}
