import { ethers } from 'ethers'

/**
 * Private key of the platform signer that owns PLATFORM_ROLE on the
 * `CredentialNFT` contract.  **Never** expose this in client bundles.
 */
const PK = process.env.PLATFORM_SIGNER_PRIVATE_KEY
if (!PK) {
  throw new Error('PLATFORM_SIGNER_PRIVATE_KEY env var not set')
}

const signer = new ethers.Wallet(PK)

/**
 * Return an ECDSA signature authorising the tuple (to, vcHash, uri).
 * The on-chain contract recreates the same digest with
 * `keccak256(abi.encodePacked(to, vcHash, keccak256(bytes(uri))))`.
 */
export async function signCredentialMint(
  to: string,
  vcHash: string,
  uri: string = '',
): Promise<string> {
  const digest = ethers.solidityPackedKeccak256(
    ['address', 'bytes32', 'bytes32'],
    [ethers.getAddress(to), vcHash, ethers.keccak256(ethers.toUtf8Bytes(uri))],
  )
  return signer.signMessage(ethers.getBytes(digest))
}
