export interface PlanMeta {
  /** Unique key used internally */
  key: 'free' | 'base' | 'plus'
  /** Human-friendly label */
  name: string
  /** Marketing feature bullets */
  features: string[]
  /** Highlight this card in marketing pages */
  highlight?: boolean
}

/**
 * Static copy for each pricing tier. Stripe handles live pricing; we only
 * describe qualitative differences here so both the landing & in-app pages
 * stay in sync.
 */
export const PLAN_META: PlanMeta[] = [
  {
    key: 'free',
    name: 'Free',
    highlight: true,
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
