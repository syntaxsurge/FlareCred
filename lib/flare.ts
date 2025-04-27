import { ethers } from 'ethers'
import type { Log, LogDescription } from 'ethers'

/* -------------------------------------------------------------------------- */
/*                            E N V  &  V A L I D S                           */
/* -------------------------------------------------------------------------- */

function assertEnv(name: string, value: string | undefined): asserts value is string {
  if (!value) throw new Error(`Environment variable ${name} is not set`)
}

function assertAddress(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} is required`)
  try {
    return ethers.getAddress(value)
  } catch {
    throw new Error(`${name} is not a valid 0x address`)
  }
}

const {
  NEXT_PUBLIC_FLARE_RPC_URL,
  NEXT_PUBLIC_FLARE_CHAIN_ID,
  NEXT_PUBLIC_DID_REGISTRY_ADDRESS: _NEXT_PUBLIC_DID_REGISTRY_ADDRESS,
  NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS: _NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS,
  NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS: _NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS,
  NEXT_PUBLIC_FDC_VERIFIER_ADDRESS: _NEXT_PUBLIC_FDC_VERIFIER_ADDRESS,
  /** ------------- NEW ORACLE HELPER ADDRESS ----------------------------- */
  NEXT_PUBLIC_FTSO_HELPER_ADDRESS: _NEXT_PUBLIC_FTSO_HELPER_ADDRESS,
  /** --------------------------------------------------------------------- */
  PRIVATE_KEY,
} = process.env as Record<string, string | undefined>

assertEnv('NEXT_PUBLIC_FLARE_RPC_URL', NEXT_PUBLIC_FLARE_RPC_URL)

const NEXT_PUBLIC_DID_REGISTRY_ADDRESS = assertAddress(
  'NEXT_PUBLIC_DID_REGISTRY_ADDRESS',
  _NEXT_PUBLIC_DID_REGISTRY_ADDRESS,
)
const NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS = assertAddress(
  'NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS',
  _NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS,
)
const NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS = assertAddress(
  'NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS',
  _NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS,
)
const NEXT_PUBLIC_FDC_VERIFIER_ADDRESS = assertAddress(
  'NEXT_PUBLIC_FDC_VERIFIER_ADDRESS',
  _NEXT_PUBLIC_FDC_VERIFIER_ADDRESS,
)
/** ---------------------- ORACLE HELPER ADDRESS -------------------------- */
const NEXT_PUBLIC_FTSO_HELPER_ADDRESS = assertAddress(
  'NEXT_PUBLIC_FTSO_HELPER_ADDRESS',
  _NEXT_PUBLIC_FTSO_HELPER_ADDRESS,
)
/** ---------------------------------------------------------------------- */
const CHAIN_ID = Number(NEXT_PUBLIC_FLARE_CHAIN_ID ?? '114')

/* -------------------------------------------------------------------------- */
/*                               P R O V I D E R                              */
/* -------------------------------------------------------------------------- */

const provider = new ethers.JsonRpcProvider(NEXT_PUBLIC_FLARE_RPC_URL, {
  name: 'flare',
  chainId: CHAIN_ID,
})

/* Optional relayer signer — lets the server submit transactions when a
   PRIVATE_KEY is available (e.g. platform DID generation).               */
const defaultSigner: ethers.Signer | null = PRIVATE_KEY
  ? new ethers.Wallet(PRIVATE_KEY, provider)
  : null

/* -------------------------------------------------------------------------- */
/*                                    ABIs                                    */
/* -------------------------------------------------------------------------- */

const DID_REGISTRY_ABI = [
  'function createDID(bytes32 docHash) external',
  'function didOf(address owner) view returns (string)',
] as const

const CREDENTIAL_NFT_ABI = [
  'event CredentialMinted(address indexed to,uint256 indexed tokenId,bytes32 vcHash,string uri)',
  'function mintCredential(address to,bytes32 vcHash,string uri) external returns (uint256)',
  'function getVcHash(uint256 tokenId) external view returns (bytes32)',
] as const

const SUBSCRIPTION_MANAGER_ABI = [
  'function paySubscription(address team,uint8 planKey) payable',
  'function paidUntil(address team) view returns (uint256)',
  'function planPriceWei(uint8) view returns (uint256)',
  'event SubscriptionPaid(address indexed team,uint8 planKey,uint256 paidUntil)',
] as const

const FDC_VERIFIER_ABI = [
  'function verifyEVM(bytes) view returns (bool)',
  'function verifyJson(bytes) view returns (bool)',
  'function verifyPayment(bytes) view returns (bool)',
  'function verifyAddress(bytes) view returns (bool)',
] as const

/** ------------------ ORACLE HELPER ABI & INTERFACE ----------------------- */
const FTSO_HELPER_ABI = [
  'function flrUsdPriceWei() view returns (uint256 priceWei, uint256 timestamp)',
] as const
/** ------------------------------------------------------------------------ */

/* -------------------------------------------------------------------------- */
/*                            R E A D  C O N T R A C T S                      */
/* -------------------------------------------------------------------------- */

const didRegistryRead = new ethers.Contract(
  NEXT_PUBLIC_DID_REGISTRY_ADDRESS,
  DID_REGISTRY_ABI,
  provider,
)
const credentialNftRead = new ethers.Contract(
  NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS,
  CREDENTIAL_NFT_ABI,
  provider,
)
const subscriptionManagerRead = new ethers.Contract(
  NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS,
  SUBSCRIPTION_MANAGER_ABI,
  provider,
)

const fdcVerifierRead: ethers.Contract | null = NEXT_PUBLIC_FDC_VERIFIER_ADDRESS
  ? new ethers.Contract(NEXT_PUBLIC_FDC_VERIFIER_ADDRESS, FDC_VERIFIER_ABI, provider)
  : null

/* -------------------------------------------------------------------------- */
/*                        O R A C L E   P R I C E   R E A D E R               */
/* -------------------------------------------------------------------------- */

/**
 * Reads the on-chain FLR/USD price in wei precision along with its timestamp.
 */
export async function readFlrUsdPriceWei(): Promise<{
  priceWei: bigint
  timestamp: number
}> {
  const iface = new ethers.Interface(FTSO_HELPER_ABI)
  const data = iface.encodeFunctionData('flrUsdPriceWei')
  const raw = await provider.call({ to: NEXT_PUBLIC_FTSO_HELPER_ADDRESS, data })
  const [priceWei, ts] = iface.decodeFunctionResult('flrUsdPriceWei', raw) as [bigint, bigint]
  return { priceWei, timestamp: Number(ts) }
}

/**
 * Convenience helper converting wei-denominated price to a plain USD number.
 */
export function formatUsd(priceWei: bigint): number {
  return Number(priceWei) / 1e18
}

/* -------------------------------------------------------------------------- */
/*                                   Utils                                    */
/* -------------------------------------------------------------------------- */

function toBytes32(input: string): string {
  // Accept raw 32-byte hex or derive keccak-256 hash of arbitrary data
  if (ethers.isHexString(input, 32)) return input
  return ethers.keccak256(ethers.toUtf8Bytes(input))
}

type SignerArgs = { signer?: ethers.Signer; signerAddress?: string }

function resolveSigner(args?: SignerArgs): ethers.Signer {
  if (args?.signer) return args.signer
  if (args?.signerAddress) {
    const addr = assertAddress('signerAddress', args.signerAddress)
    return new ethers.VoidSigner(addr, provider)
  }
  if (defaultSigner) return defaultSigner
  throw new Error('No signer available; provide signer or set PRIVATE_KEY')
}

/* -------------------------------------------------------------------------- */
/*                        F D C   P R O O F   C H E C K                       */
/* -------------------------------------------------------------------------- */

/**
 * Calls the on-chain FlareCredVerifier to confirm an FDC proof is valid.
 * Throws on failure with the underlying revert reason for precise UI feedback.
 */
export async function verifyFdcProof(proofType: string, proofData: any): Promise<boolean> {
  if (!fdcVerifierRead) {
    throw new Error('FDC verifier contract address is not configured')
  }

  /* Resolve method name --------------------------------------------------- */
  const fnMap: Record<string, string> = {
    EVM: 'verifyEVM',
    JSON: 'verifyJson',
    PAYMENT: 'verifyPayment',
    ADDRESS: 'verifyAddress',
  }
  const fn = fnMap[proofType.toUpperCase()]
  if (!fn) throw new Error(`Unsupported proofType '${proofType}'`)

  /* Normalise proof input -------------------------------------------------- */
  let arg: any = proofData
  if (typeof proofData === 'string') {
    try {
      arg = JSON.parse(proofData)
    } catch {
      // keep raw string (e.g. tx-hash) – ABI enc will coerce to bytes
    }
  }

  /* Static call – surface revert reasons ---------------------------------- */
  try {
    // ethers v6: readonly call is already static
    const ok: boolean = await (fdcVerifierRead as any)[fn](arg)
    if (!ok) throw new Error('Proof verification failed')
    return true
  } catch (err: any) {
    // Bubble revert reason up
    throw new Error(err?.shortMessage || err?.reason || err?.message || 'Proof verification failed')
  }
}

/* -------------------------------------------------------------------------- */
/*                               P U B L I C  API                             */
/* -------------------------------------------------------------------------- */

/* ---------- DID ---------- */
export async function createFlareDID(args?: SignerArgs & { docHash?: string }) {
  const signer = resolveSigner(args)
  const writable = new ethers.Contract(
    NEXT_PUBLIC_DID_REGISTRY_ADDRESS,
    DID_REGISTRY_ABI,
    signer,
  )
  const docHash = args?.docHash ?? ethers.ZeroHash

  const tx = await writable.createDID(docHash)
  const receipt = await tx.wait()

  const owner = await signer.getAddress()
  const did: string = await didRegistryRead.didOf(owner)

  return { did, txHash: receipt.hash }
}

/* ---------- Credential NFT ---------- */
export async function issueFlareCredential(
  args: SignerArgs & { to: string; vcHash: string; uri: string },
) {
  const signer = resolveSigner(args)
  const writable = new ethers.Contract(
    NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS,
    CREDENTIAL_NFT_ABI,
    signer,
  )

  const toAddr = ethers.getAddress(args.to)
  const tx = await writable.mintCredential(toAddr, toBytes32(args.vcHash), args.uri)
  const receipt = await tx.wait()

  /* Parse CredentialMinted event for tokenId */
  const intf = writable.interface
  const log = receipt.logs.find((l: Log) => {
    try {
      const desc = intf.parseLog(l) as LogDescription | null
      return desc !== null && desc.name === 'CredentialMinted'
    } catch {
      return false
    }
  })

  if (!log) throw new Error('CredentialMinted event not found')

  const parsed = intf.parseLog(log as Log) as LogDescription | null
  if (!parsed) throw new Error('Failed to parse event log')

  const tokenId = parsed.args.tokenId as bigint

  return { tokenId, txHash: receipt.hash }
}

export async function verifyFlareCredential(tokenId: bigint, expectedVcHash: string) {
  const stored = await credentialNftRead.getVcHash(tokenId)
  return stored.toLowerCase() === toBytes32(expectedVcHash).toLowerCase()
}

/* ---------- Subscription ---------- */

export async function paySubscription(
  args: SignerArgs & { planKey: number },
): Promise<{ txHash: string; paidUntil: Date }> {
  const signer = resolveSigner(args)
  const writable = new ethers.Contract(
    NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS,
    SUBSCRIPTION_MANAGER_ABI,
    signer,
  )

  const planKey = args.planKey
  const price: bigint = await subscriptionManagerRead.planPriceWei(planKey)
  if (price === 0n) throw new Error('Unknown plan key')

  const team = await signer.getAddress()
  const tx = await writable.paySubscription(team, planKey, { value: price })
  const receipt = await tx.wait()

  const paidUntilSec: bigint = await subscriptionManagerRead.paidUntil(team)
  return { txHash: receipt.hash, paidUntil: new Date(Number(paidUntilSec) * 1000) }
}

export async function checkSubscription(teamAddress: string): Promise<Date | null> {
  const addr = ethers.getAddress(teamAddress)
  const ts: bigint = await subscriptionManagerRead.paidUntil(addr)
  if (ts === 0n) return null
  return new Date(Number(ts) * 1000)
}

/* -------------------------------------------------------------------------- */
/*                               E X P O R T S                                */
/* -------------------------------------------------------------------------- */

export { provider }