import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* -------------------------------------------------------------------------- */
/*                             P A T H   R E S O L V E                         */
/* -------------------------------------------------------------------------- */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const blockchainDir = path.join(rootDir, 'blockchain')

/* -------------------------------------------------------------------------- */
/*                               N E T W O R K                                */
/* -------------------------------------------------------------------------- */

/**
 * Resolve target Hardhat network in priority order:
 *   1. First CLI argument – `pnpm contracts:deploy <network>`
 *   2. NETWORK environment variable
 *   3. Fallback 'coston2'
 */
const cliNet = process.argv[2]?.trim()
const network = cliNet || process.env.NETWORK || 'coston2'

/* -------------------------------------------------------------------------- */
/*                          D E P L O Y  S C R I P T S                         */
/* -------------------------------------------------------------------------- */

const deployScripts = [
  'deployFtsoHelper.ts',
  'deployRngHelper.ts',
  'deployFlareCredVerifier.ts',
  'deployDIDRegistry.ts',
  'deployCredentialNFT.ts',
  'deploySubscriptionManager.ts',
] as const

/**
 * Spawn `pnpm --dir <blockchainDir> exec hardhat run <script> --network <net>`
 * inheriting stdio so the Hardhat output streams directly to the console.
 */
function runDeploy(script: string): void {
  const scriptPath = path.join(blockchainDir, 'scripts', script)
  console.log(`\n🚀  Deploying ${script} on '${network}'…`)

  const { status } = spawnSync(
    'pnpm',
    [
      '--dir',
      blockchainDir,
      'exec',
      'hardhat',
      'run',
      scriptPath,
      '--network',
      network,
    ],
    { stdio: 'inherit' },
  )

  if (status !== 0) {
    console.error(`❌  ${script} failed with exit code ${status}`)
    process.exit(status ?? 1)
  }
}

/* -------------------------------------------------------------------------- */
/*                              M A I N   F L O W                              */
/* -------------------------------------------------------------------------- */

for (const script of deployScripts) runDeploy(script)

console.log('\n✅  All contracts deployed successfully')