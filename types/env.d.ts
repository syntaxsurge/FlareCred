/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Global ProcessEnv typings for compile-time safety when accessing
 * environment variables throughout the code-base.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** Address of FtsoHelper contract providing FLR → USD price feed */
    readonly NEXT_PUBLIC_FTSO_HELPER_ADDRESS: `0x${string}`
    /** Address of RngHelper contract providing verifiable randomness */
    readonly NEXT_PUBLIC_RNG_HELPER_ADDRESS: `0x${string}`

    /** GitHub Personal Access Token used by the GitHub metrics worker (optional) */
    readonly GITHUB_TOKEN?: string
    /** Pinata API key for IPFS pinning (optional) */
    readonly IPFS_PINATA_KEY?: string
    /** Pinata secret key for IPFS pinning (optional) */
    readonly IPFS_PINATA_SECRET?: string
  }
}

export {}