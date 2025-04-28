/**
 * Deploys the DIDRegistry contract and (optionally) verifies it, then mints an
 * initial Decentralised Identifier (DID) for the platform so the front-end can
 * use it immediately.
 *
 * Usage:
 *   pnpm hardhat run blockchain/scripts/deployDIDRegistry.ts --network <network>
 */

import { network, run, ethers } from 'hardhat'
import { adminAddress, platformAddress } from './config'
import type { DIDRegistryInstance } from '../typechain-types'
import { updateEnvLog } from './utils/logEnv'

const DIDRegistry = artifacts.require('DIDRegistry')

async function main(): Promise<void> {
  console.log(`\n🚀  Deploying DIDRegistry to ‘${network.name}’…`)
  const args: [string] = [adminAddress]

  const registry: DIDRegistryInstance = await DIDRegistry.new(...args)
  console.log(`✅  DIDRegistry deployed at ${registry.address}`)

  /* Persist address for front-end env ------------------------------------ */
  updateEnvLog('NEXT_PUBLIC_DID_REGISTRY_ADDRESS', registry.address)

  /* -------------------------------------------------------------------- */
  /*                     Mint platform DID immediately                     */
  /* -------------------------------------------------------------------- */
  if (!platformAddress) {
    console.warn('⚠️  PLATFORM_ADDRESS env var not set – skipping DID mint')
  } else {
    try {
      const ZERO_HASH = ethers.constants.HashZero
      await registry.createDID(ZERO_HASH, { from: platformAddress })
      const did = await registry.didOf(platformAddress)
      console.log(`🎉  Platform DID created → ${did}`)

      /* Persist DID for env file ---------------------------------------- */
      updateEnvLog('PLATFORM_ISSUER_DID', did)
    } catch (err) {
      console.warn('⚠️  Failed to mint platform DID:', (err as Error).message)
    }
  }

  /* -------------------------------------------------------------------- */
  /*                        Optional explorer verification                 */
  /* -------------------------------------------------------------------- */
  if (!['hardhat', 'localhost'].includes(network.name)) {
    try {
      await run('verify:verify', {
        address: registry.address,
        constructorArguments: args,
      })
      console.log('🔎  Verified on block-explorer')
    } catch (err) {
      console.warn('⚠️  Verification skipped / failed:', (err as Error).message)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })