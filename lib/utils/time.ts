/**
 * Convert a past date to a short, human-friendly relative time string.
 *
 * @example
 *   relativeTime(new Date(Date.now() - 90_000)) // "1 minute ago"
 */
export function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1_000)

  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  const hours = Math.floor(seconds / 3_600)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(seconds / 86_400)
  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  return date.toLocaleDateString()
}

/* -------------------------------------------------------------------------- */
/*                            D A T E   U T I L I T Y                         */
/* -------------------------------------------------------------------------- */

/**
 * Return a new `Date` advanced by `n` calendar months.
 *
 * @example
 *   addMonths(new Date('2025-01-31'), 1) // → 2025-02-28 (handles overflow)
 */
export function addMonths(date: Date, n: number): Date {
  const d = new Date(date) // clone
  const day = d.getDate()

  d.setMonth(d.getMonth() + n)

  /* Handle month overflow (e.g. 31 Jan + 1 month → 28/29 Feb) */
  if (d.getDate() < day) {
    d.setDate(0) // step back to last day of previous month
  }

  return d
}