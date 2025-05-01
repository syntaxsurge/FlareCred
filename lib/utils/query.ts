/**
 * Shared helpers for pages that read Next.js `searchParams`.
 * Keeps all tiny utilities in one place to avoid repetition.
 */
export type Query = Record<string, string | string[] | undefined>

/** Safely return the first (string) value of a query param. */
export function getParam(params: Query, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

/**
 * Uniformly resolve the `searchParams` that Next.js can pass either as an
 * object or a `Promise` of that object (depending on framework version).
 */
export async function resolveSearchParams(
  searchParams?: Query | Promise<Query>,
): Promise<Query> {
  if (!searchParams) return {}
  // If it's already an object just return it, otherwise await the promise.
  return (searchParams as any).then
    ? await (searchParams as Promise<Query>)
    : (searchParams as Query)
}

/**
 * Return a shallow object containing only the specified keys whose values
 * exist (and are non-empty) in the supplied `Query`. Useful for preserving
 * pagination, sort and filter state in URL constructions.
 */
export function pickParams(params: Query, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of keys) {
    const val = getParam(params, k)
    if (val !== undefined && val !== '') {
      out[k] = val
    }
  }
  return out
}