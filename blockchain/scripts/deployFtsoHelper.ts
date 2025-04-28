/**
 * Deploys the FtsoHelper contract and records the address in deployment.log.
 *
 * Usage:
 *   pnpm hardhat run blockchain/scripts/deployFtsoHelper.ts --network <network>
 */

import { network, run } from 'hardhat'
import { updateEnvLog } from './utils/logEnv'
import type { FtsoHelperInstance } from '../typechain-types'

const FtsoHelper = artifacts.require('FtsoHelper')

async function main(): Promise<void> {
  console.log(`\n🚀  Deploying FtsoHelper to ‘${network.name}’…`)

  const helper: FtsoHelperInstance = await FtsoHelper.new()
  console.log(`✅  FtsoHelper deployed at ${helper.address}`)

  /* Persist address for env file ----------------------------------------- */
  updateEnvLog('NEXT_PUBLIC_FTSO_HELPER_ADDRESS', helper.address)

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