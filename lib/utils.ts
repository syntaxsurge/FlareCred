import { clsx, type ClassValue } from 'clsx'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function copyToClipboard(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success('Copied to clipboard'))
    .catch(() => toast.error('Failed to copy text'))
}

export function buildLink(
  basePath: string,
  init: Record<string, string>,
  overrides: Record<string, any>,
) {
  const sp = new URLSearchParams(init)
  Object.entries(overrides).forEach(([k, v]) => sp.set(k, String(v)))
  Array.from(sp.entries()).forEach(([k, v]) => {
    if (v === '') sp.delete(k)
  })
  const qs = sp.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

/**
 * Parses vcJson and returns proofTx if it exists.
 */
export function getProofTx(vcJson: string | null | undefined): string | null {
  if (!vcJson) return null
  try {
    const obj = JSON.parse(vcJson)
    if (typeof obj.proofTx === 'string') return obj.proofTx
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Convert enum-like or snake_case strings to human-readable lowercase text.
 * e.g. "PENDING_APPROVAL" → "pending approval", "active" → "active".
 */
export function prettify(text?: string | null): string {
  return text ? text.replaceAll('_', ' ').toLowerCase() : '—'
}
