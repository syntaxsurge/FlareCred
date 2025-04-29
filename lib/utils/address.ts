import { ethers } from 'ethers'

/**
 * Check whether a string is a valid 20-byte EVM/Flare address.
 *
 * @example
 *   isValidAddress('0x1234…') // → true | false
 */
export function isValidAddress(value: string | null | undefined): boolean {
  if (typeof value !== 'string') return false
  try {
    return ethers.isAddress(value.trim())
  } catch {
    return false
  }
}

/**
 * Normalise a supplied address to its EIP-55 checksum form.
 *
 * @throws Error if the input is not a valid address.
 * @example
 *   normaliseAddress('0xabc…') // → '0xAbc…'
 */
export function normaliseAddress(value: string): string {
  return ethers.getAddress(value.trim())
}

/**
 * Extracts an Ethereum address from a DID (`did:flare:0x…`) or a raw address (`0x…`).
 * Accepts a string, an empty string, or null; returns a checksummed address string or null if invalid.
 *
 * @param value - The input containing a DID, raw address, an empty string, or null.
 * @returns A `0x…` checksummed address string, or null if input is null, empty after trimming, or invalid.
 */
export function extractAddressFromDid(value: string | null): `0x${string}` | null {
  if (!value) return null

  const trimmed = value.trim()
  if (trimmed === '') return null

  const didMatch = trimmed.match(/^did:flare:(0x[0-9a-fA-F]{40})$/)
  if (didMatch) return didMatch[1] as `0x${string}`

  const rawMatch = trimmed.match(/^0x[0-9a-fA-F]{40}$/)
  if (rawMatch) return rawMatch[0] as `0x${string}`

  return null
}

/**
 * Ensures a 32-byte hex string:
 * - If `input` is already a 0x-prefixed 32-byte hex, it’s returned unchanged.
 * - Otherwise, returns the keccak-256 hash of its UTF-8 bytes.
 *
 * @param input  Any string to hash or a 0x…32-byte hex to pass through.
 * @returns      A 0x…32-byte hex string.
 */
export function toBytes32(input: string): string {
  const trimmed = input.trim()
  return ethers.isHexString(trimmed, 32) ? trimmed : ethers.keccak256(ethers.toUtf8Bytes(trimmed))
}

export function truncateAddress(addr?: string | null) {
  if (!addr) return '—'
  return addr.length <= 10 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
