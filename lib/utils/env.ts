import { ethers } from 'ethers'

export type EnvKind = 'string' | 'number' | 'address'

/* Detect browser runtime to avoid referencing Node APIs on the client */
const isBrowser = typeof window !== 'undefined'

/**
 * Read and validate an environment variable.
 *
 * In the browser we first look for the key inside `window.__NEXT_PUBLIC_ENV__`,
 * which is hydrated at runtime via <PublicEnvScript>. This removes the need to
 * inline public variables during the build step while still allowing secret
 * server-only vars to throw when missing.
 */
export function getEnv(
  name: string,
  {
    kind = 'string',
    optional = false,
  }: { kind?: EnvKind; optional?: boolean } = {},
): string | number | undefined {
  let raw: string | undefined

  if (isBrowser) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    raw = (window as any).__NEXT_PUBLIC_ENV__?.[name] ?? process.env[name]
  } else {
    raw = process.env[name]
  }

  /* Skip hard failure on the client – secrets are server-only */
  if ((raw === undefined || raw === '') && !optional) {
    if (isBrowser) return undefined
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

/**
 * Add or update a KEY=value entry in the project’s .env file (server only).
 */
export async function upsertEnv(key: string, value: string): Promise<void> {
  if (isBrowser) {
    throw new Error('upsertEnv can only be invoked on the server')
  }

  /* Dynamically import Node core modules so they are tree-shaken from client bundles */
  const fs = await import('node:fs/promises')
  const path = await import('node:path')

  const ENV_PATH = path.resolve(process.cwd(), '.env')

  let contents = ''
  try {
    contents = await fs.readFile(ENV_PATH, 'utf8')
  } catch {
    /* .env does not exist yet – will be created */
  }

  const lines = contents.split('\n')
  const pattern = new RegExp(`^${key}=.*$`)
  let found = false

  const newLines = lines.map((ln) => {
    if (pattern.test(ln)) {
      found = true
      return `${key}=${value}`
    }
    return ln
  })

  if (!found) newLines.push(`${key}=${value}`)

  await fs.writeFile(ENV_PATH, newLines.join('\n'), 'utf8')
}