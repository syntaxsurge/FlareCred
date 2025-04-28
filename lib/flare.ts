import { ethers } from 'ethers'
import type { Log, LogDescription } from 'ethers'

import {
  DID_REGISTRY_ABI,
  CREDENTIAL_NFT_ABI,
  SUBSCRIPTION_MANAGER_ABI,
  FDC_VERIFIER_ABI,
  FTSO_HELPER_ABI,
  RNG_HELPER_ABI,
} from '@/lib/abis'
import { getEnv } from '@/lib/utils/env'
import { toBytes32 } from '@/lib/utils/address'

/* -------------------------------------------------------------------------- */
/*                          E N V I R O N M E N T   I O                       */
/* -------------------------------------------------------------------------- */

const FLARE_RPC_URL                = getEnv('NEXT_PUBLIC_FLARE_RPC_URL') as string
const CHAIN_ID                     = getEnv('NEXT_PUBLIC_FLARE_CHAIN_ID', { kind: 'number' }) as number

const DID_REGISTRY_ADDRESS         = getEnv('NEXT_PUBLIC_DID_REGISTRY_ADDRESS', {
  kind: 'address',
}) as string
const CREDENTIAL_NFT_ADDRESS       = getEnv('NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS', {
  kind: 'address',
}) as string
const SUBSCRIPTION_MANAGER_ADDRESS = getEnv('NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS', {
  kind: 'address',
}) as string
const FDC_VERIFIER_ADDRESS         = getEnv('NEXT_PUBLIC_FDC_VERIFIER_ADDRESS', {
  kind: 'address',
  optional: true,
}) as string | undefined
const FTSO_HELPER_ADDRESS          = getEnv('NEXT_PUBLIC_FTSO_HELPER_ADDRESS', {
  kind: 'address',
}) as string
const RNG_HELPER_ADDRESS           = getEnv('NEXT_PUBLIC_RNG_HELPER_ADDRESS', {
  kind: 'address',
}) as string

/* -------------------------------------------------------------------------- */
/*                                P R O V I D E R                             */
/* -------------------------------------------------------------------------- */

export const provider = new ethers.JsonRpcProvider(FLARE_RPC_URL, {
  name: 'flare',
  chainId: CHAIN_ID,
})

const contract = (addr: string, abi: readonly string[]) => new ethers.Contract(addr, abi, provider)

/* -------------------------------------------------------------------------- */
/*                             R E A D  C O N T R A C T S                     */
/* -------------------------------------------------------------------------- */

const didRegistryRead         = contract(DID_REGISTRY_ADDRESS, DID_REGISTRY_ABI)
const credentialNftRead       = contract(CREDENTIAL_NFT_ADDRESS, CREDENTIAL_NFT_ABI)
const subscriptionManagerRead = contract(SUBSCRIPTION_MANAGER_ADDRESS, SUBSCRIPTION_MANAGER_ABI)
const fdcVerifierRead: ethers.Contract | null =
  FDC_VERIFIER_ADDRESS ? contract(FDC_VERIFIER_ADDRESS, FDC_VERIFIER_ABI) : null

/* -------------------------------------------------------------------------- */
/*                       P R I C E   &   R N G   H E L P E R S                */
/* -------------------------------------------------------------------------- */

export async function readFlrUsdPriceWei(): Promise<{ priceWei: bigint; timestamp: number }> {
  const iface = new ethers.Interface(FTSO_HELPER_ABI)
  const raw   = await provider.call({
    to  : FTSO_HELPER_ADDRESS,
    data: iface.encodeFunctionData('flrUsdPriceWei'),
  })
  const [priceWei, ts] = iface.decodeFunctionResult(
    'flrUsdPriceWei',
    raw,
  ) as unknown as [bigint, bigint]
  return { priceWei, timestamp: Number(ts) }
}

export const formatUsd = (priceWei: bigint): number => Number(priceWei) / 1e18

export async function randomMod(bound: number | bigint): Promise<bigint> {
  if ((typeof bound === 'number' && bound <= 0) || (typeof bound === 'bigint' && bound <= 0n)) {
    throw new Error('bound must be positive')
  }
  const iface = new ethers.Interface(RNG_HELPER_ABI)
  const raw   = await provider.call({
    to  : RNG_HELPER_ADDRESS,
    data: iface.encodeFunctionData('randomMod', [BigInt(bound)]),
  })
  const [rnd] = iface.decodeFunctionResult('randomMod', raw) as unknown as [bigint]
  return rnd
}

/* -------------------------------------------------------------------------- */
/*                                  U T I L S                                 */
/* -------------------------------------------------------------------------- */

type SignerArgs = { signer?: ethers.Signer; signerAddress?: string }

function resolveSigner(args?: SignerArgs): ethers.Signer {
  if (args?.signer) return args.signer
  if (args?.signerAddress) {
    return new ethers.VoidSigner(ethers.getAddress(args.signerAddress), provider)
  }
  throw new Error('Signer is required – provide signer or signerAddress')
}

/* -------------------------------------------------------------------------- */
/*                         F D C   P R O O F   C H E C K                      */
/* -------------------------------------------------------------------------- */

export async function verifyFdcProof(proofType: string, proofData: unknown): Promise<boolean> {
  if (!fdcVerifierRead) throw new Error('FDC verifier contract address is not configured')

  const fnMap: Record<string, string> = {
    EVM    : 'verifyEVM',
    JSON   : 'verifyJson',
    PAYMENT: 'verifyPayment',
    ADDRESS: 'verifyAddress',
  }

  const fn = fnMap[proofType.toUpperCase()]
  if (!fn) throw new Error(`Unsupported proofType '${proofType}'`)

  let arg: unknown = proofData
  if (typeof proofData === 'string') {
    try {
      arg = JSON.parse(proofData)
    } catch {/* keep raw string */}
  }

  try {
    const ok: boolean = await (fdcVerifierRead as any)[fn](arg)
    if (!ok) throw new Error('Proof verification failed')
    return true
  } catch (err: any) {
    throw new Error(err?.shortMessage || err?.reason || err?.message || 'Proof verification failed')
  }
}

/* -------------------------------------------------------------------------- */
/*                                P U B L I C  API                            */
/* -------------------------------------------------------------------------- */

export async function createFlareDID(args?: SignerArgs & { docHash?: string }) {
  const signer   = resolveSigner(args)
  const registry = new ethers.Contract(DID_REGISTRY_ADDRESS, DID_REGISTRY_ABI, signer)
  const receipt  = await (await registry.createDID(args?.docHash ?? ethers.ZeroHash)).wait()
  return { did: await didRegistryRead.didOf(await signer.getAddress()), txHash: receipt.hash }
}

export async function issueFlareCredential(
  args: SignerArgs & { to: string; vcHash: string; uri: string },
) {
  const signer   = resolveSigner(args)
  const nftWrite = new ethers.Contract(CREDENTIAL_NFT_ADDRESS, CREDENTIAL_NFT_ABI, signer)
  const receipt  = await (
    await nftWrite.mintCredential(
      ethers.getAddress(args.to),
      toBytes32(args.vcHash),
      args.uri,
    )
  ).wait()

  const parsedLog = receipt.logs
    .map((l: Log): LogDescription | null => {
      try {
        return nftWrite.interface.parseLog(l)
      } catch {
        return null
      }
    })
    .find(
      (desc: LogDescription | null): desc is LogDescription =>
        !!desc && desc.name === 'CredentialMinted',
    )

  if (!parsedLog) throw new Error('CredentialMinted event not found')

  return { tokenId: parsedLog.args.tokenId as bigint, txHash: receipt.hash }
}

export const verifyFlareCredential = async (tokenId: bigint, expectedVcHash: string) =>
  (await credentialNftRead.getVcHash(tokenId)).toLowerCase() ===
  toBytes32(expectedVcHash).toLowerCase()

export async function paySubscription(
  args: SignerArgs & { planKey: number },
): Promise<{ txHash: string; paidUntil: Date }> {
  const signer   = resolveSigner(args)
  const mgrWrite = new ethers.Contract(SUBSCRIPTION_MANAGER_ADDRESS, SUBSCRIPTION_MANAGER_ABI, signer)

  const price: bigint = await subscriptionManagerRead.planPriceWei(args.planKey)
  if (price === 0n) throw new Error('Unknown plan key')

  const receipt = await (
    await mgrWrite.paySubscription(await signer.getAddress(), args.planKey, { value: price })
  ).wait()

  const paid = await subscriptionManagerRead.paidUntil(await signer.getAddress())
  return { txHash: receipt.hash, paidUntil: new Date(Number(paid) * 1000) }
}

export const checkSubscription = async (team: string): Promise<Date | null> => {
  const ts = await subscriptionManagerRead.paidUntil(ethers.getAddress(team))
  return ts === 0n ? null : new Date(Number(ts) * 1000)
}