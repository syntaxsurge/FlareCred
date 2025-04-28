/**
 * Centralised domain-level type declarations.
 * Shared primitives live here; feature-specific types are isolated in their own barrels and
 * re-exported for ergonomic access via this root module.
 */

/* -------------------------------------------------------------------------- */
/*                                 Core types                                 */
/* -------------------------------------------------------------------------- */

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
  /** Query-string params to persist across navigation */
  initialParams: Record<string, string>
}

/* -------------------------------------------------------------------------- */
/*                            Domain-specific barrels                         */
/* -------------------------------------------------------------------------- */

export * from './candidate'
export * from './recruiter'
export * from './table-rows'