/**
 * Deploys the RngHelper contract.
 *
 * Usage:
 *   pnpm hardhat run blockchain/scripts/deployRngHelper.ts --network <network>
 */

import { network, run } from 'hardhat'
import type { RngHelperInstance } from '../typechain-types'

const RngHelper = artifacts.require('RngHelper')

async function main(): Promise<void> {
  console.log(`\n🚀  Deploying RngHelper to ‘${network.name}’…`)

  const helper: RngHelperInstance = await RngHelper.new()
  console.log(`✅  RngHelper deployed at ${helper.address}`)

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

  console.log('\n👉  Remember to set NEXT_PUBLIC_RNG_HELPER_ADDRESS in your environment:')
  console.log(`NEXT_PUBLIC_RNG_HELPER_ADDRESS=${helper.address}\n`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })