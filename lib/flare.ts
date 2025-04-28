import { ethers } from 'ethers'
import type { Log, LogDescription } from 'ethers'

/* -------------------------------------------------------------------------- */
/*                          E N V I R O N M E N T   I O                       */
/* -------------------------------------------------------------------------- */

type EnvKind = 'string' | 'number' | 'address'

/**
 * Read and validate an environment variable.
 *
 * @param name         Variable to fetch (e.g. `NEXT_PUBLIC_FLARE_RPC_URL`).
 * @param kind         Desired type: `'string'` | `'number'` | `'address'`.
 * @param optional     Mark `true` only for non-required vars.
 */
function env(
  name: string,
  {
    kind = 'string',
    optional = false,
  }: { kind?: EnvKind; optional?: boolean } = {},
): string | number | undefined {
  const raw = process.env[name]
  if ((raw === undefined || raw === '') && !optional) {
    throw new Error(`Environment variable ${name} is not set`)
  }
  if (raw === undefined || raw === '') return undefined

  switch (kind) {
    case 'number': {
      const num = Number(raw)
      if (Number.isNaN(num)) throw new Error(`${name} is not a valid number`)
      return num
    }
    case 'address':
      try {
        return ethers.getAddress(raw)
      } catch {
        throw new Error(`${name} is not a valid 0x address`)
      }
    default:
      return raw
  }
}

/* -------------------------------------------------------------------------- */
/*                                  C O N S T S                               */
/* -------------------------------------------------------------------------- */

const FLARE_RPC_URL                = env('NEXT_PUBLIC_FLARE_RPC_URL') as string
const CHAIN_ID                     = env('NEXT_PUBLIC_FLARE_CHAIN_ID', { kind: 'number' }) as number

const DID_REGISTRY_ADDRESS         = env('NEXT_PUBLIC_DID_REGISTRY_ADDRESS', {
  kind: 'address',
}) as string
const CREDENTIAL_NFT_ADDRESS       = env('NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS', {
  kind: 'address',
}) as string
const SUBSCRIPTION_MANAGER_ADDRESS = env('NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS', {
  kind: 'address',
}) as string
const FDC_VERIFIER_ADDRESS         = env('NEXT_PUBLIC_FDC_VERIFIER_ADDRESS', {
  kind: 'address',
  optional: true,
}) as string | undefined
const FTSO_HELPER_ADDRESS          = env('NEXT_PUBLIC_FTSO_HELPER_ADDRESS', {
  kind: 'address',
}) as string
const RNG_HELPER_ADDRESS           = env('NEXT_PUBLIC_RNG_HELPER_ADDRESS', {
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

const FTSO_HELPER_ABI = [
  'function flrUsdPriceWei() view returns (uint256 priceWei, uint256 timestamp)',
] as const

const RNG_HELPER_ABI = ['function randomMod(uint256) view returns (uint256)'] as const

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

const toBytes32 = (input: string) =>
  ethers.isHexString(input, 32) ? input : ethers.keccak256(ethers.toUtf8Bytes(input))

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