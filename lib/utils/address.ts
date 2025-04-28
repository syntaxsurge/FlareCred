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

/* -------------------------------------------------------------------------- */
/*                         E N C O D I N G   H E L P E R                       */
/* -------------------------------------------------------------------------- */

/**
 * Return a 32-byte hex string: if `input` is already 32-byte hex it is returned
 * unchanged; otherwise the keccak-256 hash of its UTF-8 bytes is produced.
 *
 * @example
 *   toBytes32('hello')      // → keccak256('hello')
 *   toBytes32('0x…32bytes') // → unchanged
 */
export function toBytes32(input: string): string {
  return ethers.isHexString(input, 32)
    ? input
    : ethers.keccak256(ethers.toUtf8Bytes(input))
}