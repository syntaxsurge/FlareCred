/**
 * Deploys DIDRegistry, verifies it, and pre-mints the platform DID.
 *
 * Usage:
 *   pnpm hardhat run blockchain/scripts/deployDIDRegistry.ts --network <network>
 */

import { ZeroHash } from "ethers";
import { network, run } from "hardhat";

import { adminAddress, platformAddress } from "./config";
import type { DIDRegistryInstance } from "../typechain-types";
import { updateEnvLog } from "./utils/logEnv";

const DIDRegistry = artifacts.require("DIDRegistry");

async function main(): Promise<void> {
  console.log(`\n🚀  Deploying DIDRegistry to ‘${network.name}’…`);
  const args: [string] = [adminAddress];

  const registry: DIDRegistryInstance = await DIDRegistry.new(...args);
  console.log(`✅  DIDRegistry deployed at ${registry.address}`);

  /* Persist contract address */
  updateEnvLog("NEXT_PUBLIC_DID_REGISTRY_ADDRESS", registry.address);

  /* ------------------ Mint platform DID via adminCreateDID ----------------- */
  if (!platformAddress) {
    console.warn("⚠️  PLATFORM_ADDRESS env var not set – skipping DID mint");
  } else {
    try {
      await registry.adminCreateDID(platformAddress, ZeroHash, { from: adminAddress });
      const did = await registry.didOf(platformAddress);
      console.log(`🎉  Platform DID created → ${did}`);
      updateEnvLog("NEXT_PUBLIC_PLATFORM_ISSUER_DID", did);
    } catch (err) {
      console.warn("⚠️  Failed to mint platform DID:", (err as Error).message);
    }
  }

  /* -------------------------- Explorer verification ------------------------ */
  if (!["hardhat", "localhost"].includes(network.name)) {
    try {
      await run("verify:verify", {
        address: registry.address,
        constructorArguments: args,
      });
      console.log("🔎  Verified on block-explorer");
    } catch (err) {
      console.warn("⚠️  Verification skipped / failed:", (err as Error).message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
