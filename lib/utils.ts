import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { toast } from 'sonner'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildError(message: string) {
  return { error: message }
}

export function copyToClipboard(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success('Seed copied to clipboard'))
    .catch(() => toast.error('Failed to copy seed'))
}

export function shortenSeed(seed: string) {
  return seed.length <= 10 ? seed : `${seed.slice(0, 6)}…${seed.slice(-4)}`
}
