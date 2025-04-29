/**
 * GitHub Metrics Worker
 * ---------------------
 * Fetches repository statistics via the GitHub REST v3 API, wraps the
 * response in a JSON-API proof object, stores it on IPFS through Helia,
 * then (optionally) pins the resulting CID on Pinata.
 *
 * Usage:
 *   pnpm run worker:github -- <owner>/<repo>
 *
 * Environment variables:
 *   • GITHUB_TOKEN        – optional PAT for higher rate-limits
 *   • IPFS_PINATA_KEY     – optional Pinata API key for pinning
 *   • IPFS_PINATA_SECRET  – optional Pinata secret for pinning
 */

import crypto from 'node:crypto'
import process from 'node:process'

import { strings } from '@helia/strings'
import { Octokit } from '@octokit/rest'
import { createHelia } from 'helia'

import { GITHUB_TOKEN, IPFS_PINATA_KEY, IPFS_PINATA_SECRET } from '@/lib/config.js'

import { formatIso } from '../lib/utils/time.js'

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

/* Extract a concise metrics subset to keep the proof lightweight */
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

/** Canonical schema URI for JSON-API proofs per FDC spec (illustrative) */
const SCHEMA_URI = 'fdc:flareschema/jsonapi/1-0-0'

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
/*                         I P F S   U P L O A D  (Helia)                     */
/* -------------------------------------------------------------------------- */

console.log('ℹ️  Initialising Helia node …')

const helia = await createHelia()
const s = strings(helia)

console.log('ℹ️  Adding proof JSON to IPFS via Helia …')
const cid = await s.add(JSON.stringify(proof))
const cidStr = cid.toString()

/* -------------------------------------------------------------------------- */
/*                     O P T I O N A L   R E M O T E   P I N                  */
/* -------------------------------------------------------------------------- */

async function pinWithPinata(cidStr: string) {
  if (!IPFS_PINATA_KEY || !IPFS_PINATA_SECRET) return
  console.log('ℹ️  Pinning CID to Pinata …')
  const auth = Buffer.from(`${IPFS_PINATA_KEY}:${IPFS_PINATA_SECRET}`).toString('base64')
  const res = await fetch('https://api.pinata.cloud/psa/pins', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cid: cidStr }),
  })
  if (!res.ok) {
    const msg = await res.text()
    console.warn(`⚠️  Pinata pin failed (${res.status}): ${msg}`)
  } else {
    console.log('✅  Pin queued on Pinata')
  }
}

await pinWithPinata(cidStr)

/* -------------------------------------------------------------------------- */
/*                             O U T P U T                                    */
/* -------------------------------------------------------------------------- */

const digest = crypto.createHash('sha256').update(JSON.stringify(proof)).digest('hex')

console.log('✅  Proof uploaded to IPFS')
console.log(`    CID: ${cidStr}`)
console.log(`    SHA-256 digest: ${digest}`)
console.log('\n┊ proof JSON ┊')
console.log(JSON.stringify(proof, null, 2))

/* Clean shutdown to ensure the process exits */
try {
  await helia.stop()
} catch {
  /* ignore */
}
