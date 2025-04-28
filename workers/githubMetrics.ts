/**
 * GitHub Metrics Worker
 * ---------------------
 * Fetches repository statistics via the GitHub REST v3 API, wraps the
 * response in an IJsonApi.Proof compatible payload, pins the resulting
 * JSON to IPFS, and logs the resulting CID to stdout.
 *
 * Usage:
 *   pnpm run worker:github -- <owner>/<repo>
 *
 * Environment variables:
 *   • GITHUB_TOKEN        – optional PAT for higher rate-limits
 *   • IPFS_PINATA_KEY     – optional Pinata API key for pinning
 *   • IPFS_PINATA_SECRET  – optional Pinata secret for pinning
 */

import { Octokit } from '@octokit/rest'
import { create as createIpfs } from 'ipfs-http-client'
import { formatIso } from '../lib/utils/time.js'
import process from 'node:process'
import crypto from 'node:crypto'
import { GITHUB_TOKEN, IPFS_PINATA_KEY, IPFS_PINATA_SECRET } from '@/lib/config.js'

/* -------------------------------------------------------------------------- */
/*                         C L I   &   E N V   P A R S E                      */
/* -------------------------------------------------------------------------- */

const arg = process.argv[2] ?? null
if (!arg || !/^[\w.-]+\/[\w.-]+$/.test(arg)) {
  console.error('❌  Usage: pnpm run worker:github -- <owner>/<repo>')
  process.exit(1)
}
const [owner, repo] = arg.split('/') as [string, string]

/* -------------------------------------------------------------------------- */
/*                          G I T H U B   F E T C H                           */
/* -------------------------------------------------------------------------- */

const octokit = new Octokit({ auth: GITHUB_TOKEN })

console.log(`ℹ️  Fetching repository data for ${owner}/${repo} …`)

let repoResponse
try {
  repoResponse = await octokit.rest.repos.get({ owner, repo })
} catch (err: any) {
  console.error(`❌  GitHub API error: ${err?.message || String(err)}`)
  process.exit(1)
}

const r = repoResponse.data

/* Extract the subset of fields we care about to keep the proof compact */
const metrics = {
  full_name: r.full_name,
  description: r.description,
  html_url: r.html_url,
  default_branch: r.default_branch,
  stargazers_count: r.stargazers_count,
  forks_count: r.forks_count,
  open_issues_count: r.open_issues_count,
  watchers_count: r.watchers_count,
  size: r.size,
  language: r.language,
  license: r.license?.spdx_id ?? r.license?.key ?? null,
  created_at: r.created_at,
  updated_at: r.updated_at,
  pushed_at: r.pushed_at,
}

/* -------------------------------------------------------------------------- */
/*                        P R O O F   C O N S T R U C T                       */
/* -------------------------------------------------------------------------- */

type JsonApiProof = {
  schema: string
  request: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    url: string
    headers?: Record<string, string>
    body?: unknown
  }
  response: {
    statusCode: number
    headers?: Record<string, string>
    body: unknown
  }
  timestamp: string
}

/** Canonical schema URI for JSON-API proofs per FDC spec */
const SCHEMA_URI = 'fdc:flareschema/jsonapi/1-0-0' // illustrative; not enforced on-chain

const proof: JsonApiProof = {
  schema: SCHEMA_URI,
  request: {
    method: 'GET',
    url: `https://api.github.com/repos/${owner}/${repo}`,
    headers: { Accept: 'application/vnd.github.v3+json' },
  },
  response: {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: metrics,
  },
  timestamp: formatIso(new Date()),
}

/* -------------------------------------------------------------------------- */
/*                         I P F S   P I N N I N G                            */
/* -------------------------------------------------------------------------- */

console.log('ℹ️  Pinning proof JSON to IPFS …')

/**
 * Build IPFS client; if Pinata credentials are provided, we authenticate via
 * the PSA endpoint, otherwise we fall back to unauthenticated Infura gateway.
 */
function createPinningClient() {
  if (IPFS_PINATA_KEY && IPFS_PINATA_SECRET) {
    const auth = Buffer.from(`${IPFS_PINATA_KEY}:${IPFS_PINATA_SECRET}`).toString('base64')
    return createIpfs({
      url: 'https://api.pinata.cloud/psa',
      headers: { Authorization: `Basic ${auth}` },
    })
  }

  // Public write gateway (unauthenticated) – suitable for development
  return createIpfs({ url: 'https://ipfs.infura.io:5001/api/v0' })
}

const ipfs = createPinningClient()

let cidStr: string
try {
  const { cid } = await ipfs.add(JSON.stringify(proof), {
    pin: true,
    wrapWithDirectory: false,
  })
  cidStr = cid.toString()
} catch (err: any) {
  console.error(`❌  IPFS pinning failed: ${err?.message || String(err)}`)
  process.exit(1)
}

/* -------------------------------------------------------------------------- */
/*                             O U T P U T                                    */
/* -------------------------------------------------------------------------- */

const digest = crypto.createHash('sha256').update(JSON.stringify(proof)).digest('hex')

console.log('✅  Proof pinned to IPFS')
console.log(`    CID: ${cidStr}`)
console.log(`    SHA-256 digest: ${digest}`)
console.log('\n┊ proof JSON ┊')
console.log(JSON.stringify(proof, null, 2))