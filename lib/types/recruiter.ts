/**
 * Recruiter-domain type declarations.
 * Keep strictly recruiter-specific data models here; shared primitives live in the root barrel.
 */

/**
 * Lightweight recruiter pipeline summary used by forms and dropdowns.
 */
export interface Pipeline {
  id: number
  name: string
}