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