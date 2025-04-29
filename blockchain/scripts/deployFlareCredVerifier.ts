/**
 * Deploys the FlareCredVerifier delegate contract.
 *
 * Usage:
 *   pnpm hardhat run blockchain/scripts/deployFlareCredVerifier.ts --network <network>
 */

import { network, run } from "hardhat";

import type { FlareCredVerifierInstance } from "../typechain-types";
import { updateEnvLog } from "./utils/logEnv";

const FlareCredVerifier = artifacts.require("FlareCredVerifier");

async function main(): Promise<void> {
  console.log(`\n🚀  Deploying FlareCredVerifier to ‘${network.name}’…`);

  const verifier: FlareCredVerifierInstance = await FlareCredVerifier.new();
  console.log(`✅  FlareCredVerifier deployed at ${verifier.address}`);

  /* Persist address for env ------------------------------------------ */
  updateEnvLog("NEXT_PUBLIC_FDC_VERIFIER_ADDRESS", verifier.address);

  /* --------------------------- Explorer verify --------------------------- */
  if (!["hardhat", "localhost"].includes(network.name)) {
    try {
      await run("verify:verify", {
        address: verifier.address,
        constructorArguments: [],
      });
      console.log("🔎  Verified on explorer");
    } catch (err) {
      console.warn("⚠️   Verification skipped / failed:", (err as Error).message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
