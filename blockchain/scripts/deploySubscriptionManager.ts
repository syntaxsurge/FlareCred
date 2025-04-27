import { network, run, ethers } from 'hardhat'
import { adminAddress, platformAddress } from './config'

const SubscriptionManager = artifacts.require('SubscriptionManager')

async function main(): Promise<void> {
  console.log(`\n🚀  Deploying SubscriptionManager to ‘${network.name}’…`)

  /* ------------------------------------------------------------------ */
  /*                  Plan prices configured via env vars               */
  /* ------------------------------------------------------------------ */
  const basePrice =
    BigInt(process.env.SUBSCRIPTION_PRICE_WEI_BASE ?? '5000000000000000000') // 5 FLR default
  const plusPrice =
    BigInt(process.env.SUBSCRIPTION_PRICE_WEI_PLUS ?? '10000000000000000000') // 10 FLR default

  const args: [string, bigint, bigint] = [adminAddress, basePrice, plusPrice]
  const mgr = await SubscriptionManager.new(...args)
  console.log(`✅  SubscriptionManager deployed at ${mgr.address}`)

  /* ------------------------------ Verify ----------------------------- */
  if (!['hardhat', 'localhost'].includes(network.name)) {
    try {
      await run('verify:verify', {
        address: mgr.address,
        constructorArguments: args,
      })
      console.log('🔎  Verified on explorer')
    } catch (err) {
      console.warn('⚠️   Verification skipped / failed:', (err as Error).message)
    }
  }

  /* ------------------------- Grant ADMIN_ROLE ------------------------ */
  const ADMIN_ROLE = await mgr.ADMIN_ROLE()
  await mgr.grantRole(ADMIN_ROLE, platformAddress)
  console.log(`🔑  ADMIN_ROLE granted → ${platformAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })