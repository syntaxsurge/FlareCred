/**
 * Centralised domain-level type declarations.
 * Extend this barrel as additional shared interfaces emerge.
 */

/** User / team role identifiers used across the app */
export type Role = 'candidate' | 'recruiter' | 'issuer' | 'admin'

/**
 * Generic pagination metadata reused by table and list views.
 */
export interface Pagination {
  /** 1-indexed current page */
  page: number
  /** Whether another page exists */
  hasNext: boolean
  /** Rows per page */
  pageSize: number
  /** Base pathname for building links */
  basePath: string
  /** Querystring params to persist across navigation */
  initialParams: Record<string, string>
}

/**
 * Lightweight recruiter-pipeline summary used by forms and dropdowns.
 */
export interface Pipeline {
  id: number
  name: string
}