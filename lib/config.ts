import { getEnv } from '@/lib/utils/env'

/* -------------------------------------------------------------------------- */
/*                       E N V I R O N M E N T   C O N F I G                  */
/* -------------------------------------------------------------------------- */

export const OPENAI_API_KEY = getEnv('OPENAI_API_KEY') as string
export const GITHUB_TOKEN = getEnv('GITHUB_TOKEN') as string
export const IPFS_PINATA_KEY = getEnv('IPFS_PINATA_KEY') as string
export const IPFS_PINATA_SECRET = getEnv('IPFS_PINATA_SECRET') as string

export const FLARE_RPC_URL = getEnv('NEXT_PUBLIC_FLARE_RPC_URL') as string

export const CHAIN_ID = getEnv('NEXT_PUBLIC_FLARE_CHAIN_ID', {
  kind: 'number',
}) as number

export const DID_REGISTRY_ADDRESS = getEnv('NEXT_PUBLIC_DID_REGISTRY_ADDRESS', {
  kind: 'address',
}) as `0x${string}`

export const CREDENTIAL_NFT_ADDRESS = getEnv('NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS', {
  kind: 'address',
}) as `0x${string}`

export const SUBSCRIPTION_MANAGER_ADDRESS = getEnv(
  'NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS',
  { kind: 'address' },
) as `0x${string}`

export const FDC_VERIFIER_ADDRESS = getEnv('NEXT_PUBLIC_FDC_VERIFIER_ADDRESS', {
  kind: 'address',
  optional: true,
}) as `0x${string}`

export const FTSO_HELPER_ADDRESS = getEnv('NEXT_PUBLIC_FTSO_HELPER_ADDRESS', {
  kind: 'address',
}) as `0x${string}`

export const RNG_HELPER_ADDRESS = getEnv('NEXT_PUBLIC_RNG_HELPER_ADDRESS', {
  kind: 'address',
}) as `0x${string}`

export const NEXT_PUBLIC_PLATFORM_ISSUER_DID = getEnv('NEXT_PUBLIC_PLATFORM_ISSUER_DID') as string

export const WALLETCONNECT_PROJECT_ID = getEnv('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID') as string
