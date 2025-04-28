import { ethers } from 'ethers'

type EnvKind = 'string' | 'number' | 'address'

/**
 * Read and validate an environment variable.
 *
 * @param name     Variable to fetch (e.g. `NEXT_PUBLIC_FLARE_RPC_URL`).
 * @param options  Validation options.
 * @throws         If the variable is missing (unless `optional`) or fails validation.
 */
export function getEnv(
  name: string,
  {
    kind = 'string',
    optional = false,
  }: { kind?: EnvKind; optional?: boolean } = {},
): string | number | undefined {
  const raw = process.env[name]
  if ((raw === undefined || raw === '') && !optional) {
    throw new Error(`Environment variable ${name} is not set`)
  }
  if (raw === undefined || raw === '') return undefined

  switch (kind) {
    case 'number': {
      const num = Number(raw)
      if (Number.isNaN(num)) throw new Error(`${name} is not a valid number`)
      return num
    }
    case 'address':
      try {
        return ethers.getAddress(raw)
      } catch {
        throw new Error(`${name} is not a valid 0x address`)
      }
    default:
      return raw
  }
}