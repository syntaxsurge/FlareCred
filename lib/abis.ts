/**
 * Centralised contract ABIs imported from Hardhat build artifacts.
 *
 * Reading the artefacts produced during `hardhat compile` keeps the UI in sync
 * with the latest Solidity interfaces while avoiding manual ABI duplication.
 */

import type { Abi } from 'viem'

import DIDRegistryArtifact from '../blockchain/artifacts/contracts/DIDRegistry.sol/DIDRegistry.json'
import CredentialNFTArtifact from '../blockchain/artifacts/contracts/CredentialNFT.sol/CredentialNFT.json'
import SubscriptionManagerArtifact from '../blockchain/artifacts/contracts/SubscriptionManager.sol/SubscriptionManager.json'
import FlareCredVerifierArtifact from '../blockchain/artifacts/contracts/FlareCredVerifier.sol/FlareCredVerifier.json'
import FtsoHelperArtifact from '../blockchain/artifacts/contracts/FtsoHelper.sol/FtsoHelper.json'
import RngHelperArtifact from '../blockchain/artifacts/contracts/RngHelper.sol/RngHelper.json'

/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

export const DID_REGISTRY_ABI: Abi = DIDRegistryArtifact.abi as Abi
export const CREDENTIAL_NFT_ABI: Abi = CredentialNFTArtifact.abi as Abi
export const SUBSCRIPTION_MANAGER_ABI: Abi = SubscriptionManagerArtifact.abi as Abi
export const FDC_VERIFIER_ABI: Abi = FlareCredVerifierArtifact.abi as Abi
export const FTSO_HELPER_ABI: Abi = FtsoHelperArtifact.abi as Abi
export const RNG_HELPER_ABI: Abi = RngHelperArtifact.abi as Abi