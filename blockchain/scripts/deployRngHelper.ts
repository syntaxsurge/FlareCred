/**
 * Deploys the RngHelper contract and records the address in deployment.log.
 *
 * Usage:
 *   pnpm hardhat run blockchain/scripts/deployRngHelper.ts --network <network>
 */

import { network, run } from 'hardhat'
import { updateEnvLog } from './utils/logEnv'
import type { RngHelperInstance } from '../typechain-types'

const RngHelper = artifacts.require('RngHelper')

async function main(): Promise<void> {
  console.log(`\n🚀  Deploying RngHelper to ‘${network.name}’…`)

  const helper: RngHelperInstance = await RngHelper.new()
  console.log(`✅  RngHelper deployed at ${helper.address}`)

  /* Persist address for env file ----------------------------------------- */
  updateEnvLog('NEXT_PUBLIC_RNG_HELPER_ADDRESS', helper.address)

  /* ----------------------- Optional explorer verify --------------------- */
  if (!['hardhat', 'localhost'].includes(network.name)) {
    try {
      await run('verify:verify', {
        address: helper.address,
        constructorArguments: [],
      })
      console.log('🔎  Verified on explorer')
    } catch (err) {
      console.warn('⚠️   Verification skipped / failed:', (err as Error).message)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })