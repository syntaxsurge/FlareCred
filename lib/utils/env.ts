import { ethers } from 'ethers'

import fs from 'fs/promises'
import path from 'path'

type EnvKind = 'string' | 'number' | 'address'
const ENV_PATH = path.resolve(process.cwd(), '.env')

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


export async function upsertEnv(key: string, value: string) {
  let contents = ''
  try {
    contents = await fs.readFile(ENV_PATH, 'utf8')
  } catch {
    /* .env may not exist yet – will create */
  }

  const lines = contents.split('\n')
  const regex = new RegExp(`^${key}=.*$`)
  let found = false

  const newLines = lines.map((ln) => {
    if (regex.test(ln)) {
      found = true
      return `${key}=${value}`
    }
    return ln
  })

  if (!found) newLines.push(`${key}=${value}`)

  await fs.writeFile(ENV_PATH, newLines.join('\n'), 'utf8')
}