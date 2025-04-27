/**
 * Credential-related constants shared across client and server layers.
 * Proof types correspond to Flare Data Connector verification categories.
 */
export const PROOF_TYPES = ['EVM', 'JSON', 'PAYMENT', 'ADDRESS'] as const

export type ProofType = (typeof PROOF_TYPES)[number]