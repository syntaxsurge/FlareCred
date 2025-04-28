import { ethers } from 'ethers'
import type { Log, LogDescription, InterfaceAbi } from 'ethers'

import {
  provider,
  didRegistry,
  credentialNft,
  subscriptionManager,
  ftsoHelper,
  rngHelper,
  fdcVerifier,
} from './index'

import {
  DID_REGISTRY_ABI,
  CREDENTIAL_NFT_ABI,
  SUBSCRIPTION_MANAGER_ABI,
} from '@/lib/contracts/abis'

import {
  DID_REGISTRY_ADDRESS,
  CREDENTIAL_NFT_ADDRESS,
  SUBSCRIPTION_MANAGER_ADDRESS,
} from '@/lib/config'

import { toBytes32 } from '@/lib/utils/address'

/* -------------------------------------------------------------------------- */
/*                         F T S O   &   R N G   W R A P P E R S              */
/* -------------------------------------------------------------------------- */

/**
 * Return the live FLR/USD oracle price in wei and its last-updated timestamp.
 */
export async function readFlrUsdPriceWei(): Promise<{
  priceWei: bigint
  timestamp: number
}> {
  const [priceWei, ts] = (await ftsoHelper.flrUsdPriceWei()) as [bigint, bigint]
  return { priceWei, timestamp: Number(ts) }
}

/** Convenience helper to convert a wei-denominated FLR price to USD. */
export const formatUsd = (priceWei: bigint): number => Number(priceWei) / 1e18

/**
 * Return a provably random number ∈ [0, bound) derived from Flare RNG.
 */
export async function randomMod(bound: number | bigint): Promise<bigint> {
  const b = typeof bound === 'number' ? BigInt(bound) : bound
  if (b <= 0n) throw new Error('bound must be positive')
  return (await rngHelper.randomMod(b)) as bigint
}

/* -------------------------------------------------------------------------- */
/*                               F D C  P R O O F S                           */
/* -------------------------------------------------------------------------- */

export async function verifyFdcProof(
  proofType: string,
  proofData: unknown,
): Promise<boolean> {
  if (!fdcVerifier)
    throw new Error('FDC verifier contract address is not configured')

  const fnMap: Record<string, string> = {
    EVM: 'verifyEVM',
    JSON: 'verifyJson',
    PAYMENT: 'verifyPayment',
    ADDRESS: 'verifyAddress',
  }
  const fn = fnMap[proofType.toUpperCase()]
  if (!fn) throw new Error(`Unsupported proofType '${proofType}'`)

  let arg: unknown = proofData
  if (typeof proofData === 'string') {
    try {
      arg = JSON.parse(proofData)
    } catch {
      /* keep raw string */
    }
  }

  try {
    const ok: boolean = await (fdcVerifier as any)[fn](arg)
    if (!ok) throw new Error('Proof verification failed')
    return true
  } catch (err: any) {
    throw new Error(
      err?.shortMessage || err?.reason || err?.message || 'Proof verification failed',
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                W R I T E   A P I                           */
/* -------------------------------------------------------------------------- */

type SignerArgs = { signer?: ethers.Signer; signerAddress?: string }

function resolveSigner({ signer, signerAddress }: SignerArgs = {}): ethers.Signer {
  if (signer) return signer
  if (signerAddress) return new ethers.VoidSigner(ethers.getAddress(signerAddress), provider)
  throw new Error('Signer is required – provide signer or signerAddress')
}

/* ----------------------------- DID  -------------------------------------- */

export async function createFlareDID(
  args?: SignerArgs & { docHash?: string },
) {
  const signer = resolveSigner(args)
  const registryWrite = new ethers.Contract(
    DID_REGISTRY_ADDRESS,
    DID_REGISTRY_ABI as InterfaceAbi,
    signer,
  )
  const receipt = await (
    await registryWrite.createDID(args?.docHash ?? ethers.ZeroHash)
  ).wait()

  return {
    did: await didRegistry.didOf(await signer.getAddress()),
    txHash: receipt.hash,
  }
}

/* ---------------------- Credential NFT ----------------------------------- */

export async function issueFlareCredential(
  args: SignerArgs & { to: string; vcHash: string; uri: string },
) {
  const signer = resolveSigner(args)
  const nftWrite = new ethers.Contract(
    CREDENTIAL_NFT_ADDRESS,
    CREDENTIAL_NFT_ABI as InterfaceAbi,
    signer,
  )
  const receipt = await (
    await nftWrite.mintCredential(
      ethers.getAddress(args.to),
      toBytes32(args.vcHash),
      args.uri,
    )
  ).wait()

  /* Extract event for tokenId */
  const parsedLog = receipt.logs
    .map((l: Log): LogDescription | null => {
      try {
        return nftWrite.interface.parseLog(l)
      } catch {
        return null
      }
    })
    .find(
      (d): d is LogDescription => !!d && d.name === 'CredentialMinted',
    )

  if (!parsedLog) throw new Error('CredentialMinted event not found')

  return { tokenId: parsedLog.args.tokenId as bigint, txHash: receipt.hash }
}

export async function verifyFlareCredential(
  tokenId: bigint,
  expectedVcHash: string,
): Promise<boolean> {
  return (
    (await credentialNft.getVcHash(tokenId)).toLowerCase() ===
    toBytes32(expectedVcHash).toLowerCase()
  )
}

/* ------------------------ Subscription ----------------------------------- */

export async function paySubscription(
  args: SignerArgs & { planKey: number },
): Promise<{ txHash: string; paidUntil: Date }> {
  const signer = resolveSigner(args)
  const mgrWrite = new ethers.Contract(
    SUBSCRIPTION_MANAGER_ADDRESS,
    SUBSCRIPTION_MANAGER_ABI as InterfaceAbi,
    signer,
  )

  const price: bigint = await subscriptionManager.planPriceWei(args.planKey)
  if (price === 0n) throw new Error('Unknown plan key')

  const receipt = await (
    await mgrWrite.paySubscription(await signer.getAddress(), args.planKey, {
      value: price,
    })
  ).wait()

  const paid = await subscriptionManager.paidUntil(await signer.getAddress())
  return { txHash: receipt.hash, paidUntil: new Date(Number(paid) * 1000) }
}

export async function checkSubscription(team: string): Promise<Date | null> {
  const ts: bigint = await subscriptionManager.paidUntil(ethers.getAddress(team))
  return ts === 0n ? null : new Date(Number(ts) * 1000)
}