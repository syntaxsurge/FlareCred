'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ethers } from 'ethers'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { createFlareDID } from '@/lib/contracts/flare'
import { provider, didRegistry } from '@/lib/contracts'
import { upsertEnv } from '@/lib/utils/env'

/* -------------------------------------------------------------------------- */
/*                                V A L I D A T I O N                         */
/* -------------------------------------------------------------------------- */

const schema = z.object({
  /** Optional DID – when absent we auto-generate via the platform signer. */
  did: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^did:flare:0x[0-9a-fA-F]{40}$/.test(v), {
      message: 'Invalid Flare DID (expected did:flare:0x…)',
    }),
})

/* -------------------------------------------------------------------------- */
/*                                   A C T I O N                              */
/* -------------------------------------------------------------------------- */

export const upsertPlatformDidAction = validatedActionWithUser(
  schema,
  async ({ did }, _formData, user) => {
    if (user.role !== 'admin') return { error: 'Unauthorized.' }

    let newDid = did?.trim()

    /* ------------------------------------------------------------------ */
    /*                  Auto-generate or fetch existing DID               */
    /* ------------------------------------------------------------------ */
    if (!newDid) {
      const pk = process.env.PLATFORM_SIGNER_PRIVATE_KEY
      if (!pk) {
        return {
          error:
            'PLATFORM_SIGNER_PRIVATE_KEY env var not configured – cannot generate a platform DID.',
        }
      }

      const platformSigner = new ethers.Wallet(pk, provider)

      try {
        /* Attempt fresh mint ------------------------------------------------ */
        const { did: generatedDid } = await createFlareDID({ signer: platformSigner })
        newDid = generatedDid
      } catch (err: any) {
        const msg =
          err?.shortMessage || err?.reason || err?.message || (typeof err === 'string' ? err : '')
        const alreadyExists = /DID already exists/i.test(msg)

        if (!alreadyExists) {
          /* Unknown failure – bubble up ------------------------------------ */
          return { error: `Failed to create Flare DID: ${msg}` }
        }

        /* DID already minted – fetch from registry ------------------------- */
        try {
          newDid = await didRegistry.didOf(await platformSigner.getAddress())
          if (!newDid) {
            return {
              error:
                'DID already exists on-chain but could not be retrieved; verify contract state.',
            }
          }
        } catch (fetchErr: any) {
          return {
            error: `Failed to fetch existing DID from registry: ${
              fetchErr?.message || String(fetchErr)
            }`,
          }
        }
      }
    }

    /* ------------------------------------------------------------------ */
    /*                     Persist DID into environment                    */
    /* ------------------------------------------------------------------ */
    try {
      await upsertEnv('NEXT_PUBLIC_PLATFORM_ISSUER_DID', newDid!)
    } catch (envErr: any) {
      return { error: `Failed to persist DID to environment: ${String(envErr)}` }
    }

    revalidatePath('/admin/platform-did')
    return { success: 'Platform DID updated.', did: newDid }
  },
)