/**
 * Deploys the FtsoHelper contract.
 *
 * Usage:
 *   pnpm hardhat run blockchain/scripts/deployFtsoHelper.ts --network <network>
 */

import { network, run } from 'hardhat'
import type { FtsoHelperInstance } from '../typechain-types'

const FtsoHelper = artifacts.require('FtsoHelper')

async function main(): Promise<void> {
  console.log(`\n🚀  Deploying FtsoHelper to ‘${network.name}’…`)

  const helper: FtsoHelperInstance = await FtsoHelper.new()
  console.log(`✅  FtsoHelper deployed at ${helper.address}`)

  /* Optional block-explorer verification */
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

  console.log('\n👉  Remember to set NEXT_PUBLIC_FTSO_HELPER_ADDRESS in your environment:')
  console.log(`NEXT_PUBLIC_FTSO_HELPER_ADDRESS=${helper.address}\n`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })