/**
 * Deploys the DIDRegistry contract and (optionally) verifies it.
 *
 * Usage:
 *   pnpm hardhat run blockchain/scripts/deployDIDRegistry.ts --network <network>
 */

import { network, run } from 'hardhat'
import { adminAddress } from './config'
import type { DIDRegistryInstance } from '../typechain-types'

const DIDRegistry = artifacts.require('DIDRegistry')

async function main(): Promise<void> {
  console.log(`\n🚀  Deploying DIDRegistry to ‘${network.name}’…`)
  const args: [string] = [adminAddress]

  const registry: DIDRegistryInstance = await DIDRegistry.new(...args)
  console.log(`✅  DIDRegistry deployed at ${registry.address}`)

  /* ------------------------------------------------------------------ */
  /*                       Optional Etherscan verify                     */
  /* ------------------------------------------------------------------ */
  if (!['hardhat', 'localhost'].includes(network.name)) {
    try {
      await run('verify:verify', {
        address: registry.address,
        constructorArguments: args,
      })
      console.log('🔎  Verified on block-explorer')
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