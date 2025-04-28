import { format, formatDistanceToNow } from 'date-fns'

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
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(seconds / 3_600)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(seconds / 86_400)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`

  return date.toLocaleDateString()
}

/**
 * Format a `Date` object as an ISO-8601 string without modification.
 * Provided as a dedicated helper for consistency across the app and
 * to emphasise UTC semantics when serialising timestamps.
 *
 * @example
 *   formatIso(new Date()) // "2025-04-28T12:34:56.789Z"
 */
export function formatIso(date: Date): string {
  return date.toISOString()
}

export function prettyDate(
  date: Date | null,
  {
    placeholder = '—',
    relativeCutoffMs = 3 * 24 * 60 * 60 * 1_000,
    formatRelative = (d: Date) => formatDistanceToNow(d, { addSuffix: true }),
    formatAbsolute = (d: Date) => format(d, 'PPP'),
  } = {}
): string {
  if (!date) return placeholder;
  const diff = Math.abs(Date.now() - date.getTime());
  return diff < relativeCutoffMs
    ? formatRelative(date)
    : formatAbsolute(date);
}

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
