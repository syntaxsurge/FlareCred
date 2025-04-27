/**
 * Pricing metadata shared by frontend UI and server-side logic.
 * All amounts are expressed in wei and **must** match the on-chain
 * SubscriptionManager configuration.
 */

export const PLAN_KEYS = ['free', 'base', 'plus'] as const

/** Union type for plan keys (`'free' | 'base' | 'plus'`). */
export type PlanKey = typeof PLAN_KEYS[number]

/** Native FLR token decimals (18). */
export const FLR_DECIMALS = 18

export interface PlanMeta {
  /** Unique key used internally and on-chain (`planKey` param). */
  key: PlanKey
  /** Human-readable label. */
  name: string
  /** Bullet-point feature list for marketing copy. */
  features: string[]
  /** Optional flag to visually highlight this tier in UI. */
  highlight?: boolean
  /** On-chain price in wei (0 wei = free tier). */
  priceWei: bigint
}

/**
 * Immutable price & feature table.
 * ⚠️  Keep this array **sorted** in display order for the pricing grid.
 */
export const PLAN_META: readonly PlanMeta[] = [
  {
    key: 'free',
    name: 'Free',
    highlight: true,
    priceWei: 0n,
    features: [
      'Unlimited Credentials',
      'Unlimited Skill Passes',
      'Team Workspace',
      'Basic Email Support',
      'Public Recruiter Profile',
    ],
  },
  {
    key: 'base',
    name: 'Base',
    priceWei: 5_000_000_000_000_000_000n, // 5 FLR
    features: [
      'Everything in Free',
      'Up to 5 Recruiter Seats',
      '50 AI Skill Checks / month',
      '50 Credential Verifications / month',
      'Advanced Talent Search Filters',
      'Exportable Reports',
    ],
  },
  {
    key: 'plus',
    name: 'Plus',
    priceWei: 10_000_000_000_000_000_000n, // 10 FLR
    features: [
      'Everything in Base',
      'Unlimited Recruiter Seats',
      'Unlimited Skill Checks & Verifications',
      'Custom Branding & Domain',
      'API Access',
      'Priority Issuer Application Review',
    ],
  },
] as const

/**
 * Helper: return strongly-typed plan metadata.
 *
 * @param key  Plan identifier (`'free' | 'base' | 'plus'`)
 */
export function getPlanMeta(key: PlanKey): PlanMeta {
  const meta = PLAN_META.find((p) => p.key === key)
  if (!meta) throw new Error(`Unknown plan key: ${key}`)
  return meta
}