export const PROOF_TYPES = ['EVM', 'JSON', 'PAYMENT', 'ADDRESS'] as const

/**
 * Returns true when `type` represents a GitHub repository contribution
 * credential (comparison is case-insensitive and ignores surrounding spaces).
 */
export function isGithubRepoCredential(type: string): boolean {
  return type.trim().toLowerCase() === 'github_repo'
}