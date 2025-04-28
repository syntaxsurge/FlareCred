/**
 * Centralised contract ABIs used across the FlareCred frontend.
 *
 * These arrays are declared as <code>const</code> so that TypeScript infers literal
 * string types, preserving full type-safety when they are consumed by
 * ethers.js or viem helpers.
 */

export const DID_REGISTRY_ABI = [
  'function createDID(bytes32 docHash) external',
  'function didOf(address owner) view returns (string)',
] as const;

export const CREDENTIAL_NFT_ABI = [
  'event CredentialMinted(address indexed to,uint256 indexed tokenId,bytes32 vcHash,string uri)',
  'function mintCredential(address to,bytes32 vcHash,string uri) external returns (uint256)',
  'function getVcHash(uint256 tokenId) external view returns (bytes32)',
] as const;

export const SUBSCRIPTION_MANAGER_ABI = [
  'function paySubscription(address team,uint8 planKey) payable',
  'function paidUntil(address team) view returns (uint256)',
  'function planPriceWei(uint8) view returns (uint256)',
  'event SubscriptionPaid(address indexed team,uint8 planKey,uint256 paidUntil)',
] as const;

export const FDC_VERIFIER_ABI = [
  'function verifyEVM(bytes) view returns (bool)',
  'function verifyJson(bytes) view returns (bool)',
  'function verifyPayment(bytes) view returns (bool)',
  'function verifyAddress(bytes) view returns (bool)',
] as const;

export const FTSO_HELPER_ABI = [
  'function flrUsdPriceWei() view returns (uint256 priceWei, uint256 timestamp)',
] as const;

export const RNG_HELPER_ABI = [
  'function randomMod(uint256) view returns (uint256)',
] as const;