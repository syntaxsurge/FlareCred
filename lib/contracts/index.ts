import { ethers } from 'ethers'
import type { InterfaceAbi } from 'ethers'

import {
  FLARE_RPC_URL,
  CHAIN_ID,
  DID_REGISTRY_ADDRESS,
  CREDENTIAL_NFT_ADDRESS,
  SUBSCRIPTION_MANAGER_ADDRESS,
  FDC_VERIFIER_ADDRESS,
  FTSO_HELPER_ADDRESS,
  RNG_HELPER_ADDRESS,
} from '@/lib/config'
import {
  DID_REGISTRY_ABI,
  CREDENTIAL_NFT_ABI,
  SUBSCRIPTION_MANAGER_ABI,
  FDC_VERIFIER_ABI,
  FTSO_HELPER_ABI,
  RNG_HELPER_ABI,
} from '@/lib/contracts/abis'

/* -------------------------------------------------------------------------- */
/*                              P R O V I D E R                               */
/* -------------------------------------------------------------------------- */

export const provider = new ethers.JsonRpcProvider(FLARE_RPC_URL, {
  name: 'flare',
  chainId: CHAIN_ID,
})

/* -------------------------------------------------------------------------- */
/*                         C O N T R A C T  F A C T O R Y                     */
/* -------------------------------------------------------------------------- */

/**
 * Helper that returns a read-only ethers.Contract connected to the shared provider.
 */
export const getContract = <T extends ethers.Contract = ethers.Contract>(
  address: string,
  abi: InterfaceAbi,
): T => new ethers.Contract(address, abi, provider) as T

/* -------------------------------------------------------------------------- */
/*                     R E A D - O N L Y   I N S T A N C E S                  */
/* -------------------------------------------------------------------------- */

export const didRegistry = getContract(DID_REGISTRY_ADDRESS, DID_REGISTRY_ABI)
export const credentialNft = getContract(CREDENTIAL_NFT_ADDRESS, CREDENTIAL_NFT_ABI)
export const subscriptionManager = getContract(
  SUBSCRIPTION_MANAGER_ADDRESS,
  SUBSCRIPTION_MANAGER_ABI,
)
export const ftsoHelper = getContract(FTSO_HELPER_ADDRESS, FTSO_HELPER_ABI)
export const rngHelper = getContract(RNG_HELPER_ADDRESS, RNG_HELPER_ABI)

/** Optional verifier (null when address is not configured). */
export const fdcVerifier = FDC_VERIFIER_ADDRESS
  ? getContract(FDC_VERIFIER_ADDRESS, FDC_VERIFIER_ABI)
  : null
