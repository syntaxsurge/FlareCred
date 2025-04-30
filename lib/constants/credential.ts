/* -------------------------------------------------------------------------- */
/*                    Credential-related runtime constants                    */
/* -------------------------------------------------------------------------- */

import type { ProofType } from '@/lib/types/credential'

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

/** Convenience re-export so components can `import type { ProofType }…` from here. */
export type { ProofType }