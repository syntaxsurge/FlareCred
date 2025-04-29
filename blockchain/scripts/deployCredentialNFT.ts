/**
 * Deploys the CredentialNFT contract, verifies it, and assigns initial roles.
 *
 * Usage:
 *   pnpm hardhat run blockchain/scripts/deployCredentialNFT.ts --network <network>
 */

import { network, run } from "hardhat";

import { adminAddress, issuerAddresses, platformAddress } from "./config";
import type { CredentialNFTInstance } from "../typechain-types";
import { updateEnvLog } from "./utils/logEnv";

const CredentialNFT = artifacts.require("CredentialNFT");

async function main(): Promise<void> {
  console.log(`\n🚀  Deploying CredentialNFT to ‘${network.name}’…`);
  const args: [string] = [adminAddress];

  const nft: CredentialNFTInstance = await CredentialNFT.new(...args);
  console.log(`✅  CredentialNFT deployed at ${nft.address}`);

  /* Persist address for env -------------------------------------------- */
  updateEnvLog("NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS", nft.address);

  /* ------------------------------------------------------------------ */
  /*                       Optional Etherscan verify                     */
  /* ------------------------------------------------------------------ */
  if (!["hardhat", "localhost"].includes(network.name)) {
    try {
      await run("verify:verify", {
        address: nft.address,
        constructorArguments: args,
      });
      console.log("🔎  Verified on block-explorer");
    } catch (err) {
      console.warn("⚠️   Verification skipped / failed:", (err as Error).message);
    }
  }

  /* ------------------------------------------------------------------ */
  /*                      Seed initial on-chain roles                    */
  /* ------------------------------------------------------------------ */
  const ISSUER_ROLE = await nft.ISSUER_ROLE();
  const PLATFORM_ROLE = await nft.PLATFORM_ROLE();

  for (const issuer of issuerAddresses) {
    await nft.grantRole(ISSUER_ROLE, issuer);
    console.log(`🔑  ISSUER_ROLE granted → ${issuer}`);
  }

  await nft.grantRole(PLATFORM_ROLE, platformAddress);
  console.log(`🔑  PLATFORM_ROLE granted → ${platformAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
