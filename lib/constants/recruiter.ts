/**
 * Recruiter pipeline stages (shared by UI & server actions)
 */
export const STAGES = ['sourced', 'screening', 'interview', 'offer'] as const

/** Convenience type for a single stage value */
export type Stage = (typeof STAGES)[number]
