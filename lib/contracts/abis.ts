/**
 * Centralised contract ABIs imported from Hardhat build artifacts.
 *
 * Reading the artefacts produced during `hardhat compile` keeps the UI in sync
 * with the latest Solidity interfaces while avoiding manual ABI duplication.
 *
 * This version exports each ABI as a hybrid type that satisfies both
 * `viem` `Abi` _and_ ethers `InterfaceAbi`, letting us consume the very same
 * constants across wagmi/viem write-helpers and ethers read-only instances
 * without unsafe casts or TypeScript complaints.
 */

import type { Abi } from 'viem'
import type { InterfaceAbi } from 'ethers'

import DIDRegistryArtifact from '../../blockchain/artifacts/contracts/DIDRegistry.sol/DIDRegistry.json'
import CredentialNFTArtifact from '../../blockchain/artifacts/contracts/CredentialNFT.sol/CredentialNFT.json'
import SubscriptionManagerArtifact from '../../blockchain/artifacts/contracts/SubscriptionManager.sol/SubscriptionManager.json'
import FlareCredVerifierArtifact from '../../blockchain/artifacts/contracts/FlareCredVerifier.sol/FlareCredVerifier.json'
import FtsoHelperArtifact from '../../blockchain/artifacts/contracts/FtsoHelper.sol/FtsoHelper.json'
import RngHelperArtifact from '../../blockchain/artifacts/contracts/RngHelper.sol/RngHelper.json'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

/**
 * Intersection type that is assignable to both viem `Abi` and
 * ethers `InterfaceAbi`.  This enables seamless use of a single ABI constant
 * across wagmi `writeContract` (expects `Abi`) and ethers `Contract`
 * factories (expect `InterfaceAbi`) without repetitive casting.
 */
type DualAbi = Abi & InterfaceAbi

/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

export const DID_REGISTRY_ABI = DIDRegistryArtifact.abi as unknown as DualAbi
export const CREDENTIAL_NFT_ABI = CredentialNFTArtifact.abi as unknown as DualAbi
export const SUBSCRIPTION_MANAGER_ABI =
  SubscriptionManagerArtifact.abi as unknown as DualAbi
export const FDC_VERIFIER_ABI =
  FlareCredVerifierArtifact.abi as unknown as DualAbi
export const FTSO_HELPER_ABI = FtsoHelperArtifact.abi as unknown as DualAbi
export const RNG_HELPER_ABI = RngHelperArtifact.abi as unknown as DualAbi