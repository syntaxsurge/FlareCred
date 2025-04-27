/* eslint-disable @typescript-eslint/naming-convention */

declare namespace NodeJS {
  interface ProcessEnv {
    /** Address of FtsoHelper contract providing FLR → USD price feed */
    readonly NEXT_PUBLIC_FTSO_HELPER_ADDRESS: string
  }
}

export {}