/* -------------------------------------------------------------------------- */
/*                         Credential domain-specific types                   */
/* -------------------------------------------------------------------------- */

/**
 * Enumeration of proof mechanisms supported by the credential verifier.
 */
export type ProofType = 'EVM' | 'JSON' | 'PAYMENT' | 'ADDRESS'

/**
 * Fine-grained credential sub-type identifiers.
 */
export type CredentialType = 'github_repo'