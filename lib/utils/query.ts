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
 * Uniformly resolve the `searchParams` that Next.js 15 can pass
 * either as an object or a `Promise` of that object.
 */
export async function resolveSearchParams(
  searchParams?: Query | Promise<Query>,
): Promise<Query> {
  if (!searchParams) return {}
  // If it's already an object just return it, otherwise await the promise.
  return (searchParams as any).then ? await (searchParams as Promise<Query>) : (searchParams as Query)
}