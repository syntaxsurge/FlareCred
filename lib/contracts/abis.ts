import type { InterfaceAbi } from 'ethers'
import type { Abi } from 'viem'

import CredentialNFTArtifact from './abis/CredentialNFT.json'
import DIDRegistryArtifact from './abis/DIDRegistry.json'
import FlareCredVerifierArtifact from './abis/FlareCredVerifier.json'
import FtsoHelperArtifact from './abis/FtsoHelper.json'
import RngHelperArtifact from './abis/RngHelper.json'
import SubscriptionManagerArtifact from './abis/SubscriptionManager.json'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

/**
 * Intersection type assignable to both viem `Abi` and ethers `InterfaceAbi`.
 */
type DualAbi = Abi & InterfaceAbi

/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

export const DID_REGISTRY_ABI = DIDRegistryArtifact.abi as unknown as DualAbi
export const CREDENTIAL_NFT_ABI = CredentialNFTArtifact.abi as unknown as DualAbi
export const SUBSCRIPTION_MANAGER_ABI = SubscriptionManagerArtifact.abi as unknown as DualAbi
export const FDC_VERIFIER_ABI = FlareCredVerifierArtifact.abi as unknown as DualAbi
export const FTSO_HELPER_ABI = FtsoHelperArtifact.abi as unknown as DualAbi
export const RNG_HELPER_ABI = RngHelperArtifact.abi as unknown as DualAbi
