export interface PlanMeta {
  /** Unique key used internally */
  key: 'free' | 'base' | 'plus'
  /** Human-friendly label */
  name: string
  /** Marketing feature bullets */
  features: string[]
  /** Highlight this card in marketing pages */
  highlight?: boolean
  /** On-chain price in wei (0 for free tier) */
  priceWei: bigint
}

/**
 * Static copy for each pricing tier.
 * Prices are denominated in wei and should match the on-chain
 * SubscriptionManager contract configuration.
 */
export const PLAN_META: PlanMeta[] = [
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
]