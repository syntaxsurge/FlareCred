'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ethers } from 'ethers'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { createFlareDID } from '@/lib/contracts/flare'
import { provider } from '@/lib/contracts'
import { upsertEnv } from '@/lib/utils/env'

/* -------------------------------------------------------------------------- */
/*                                 V A L I D A T I O N                        */
/* -------------------------------------------------------------------------- */

const schema = z.object({
  /** Optional DID – when absent we auto-generate via the platform signer */
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

    try {
      /* ------------------------------------------------------------------ */
      /*                    Auto-generate when no DID supplied               */
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
        const { did: generatedDid } = await createFlareDID({ signer: platformSigner })
        newDid = generatedDid
      }

      /* ------------------------------------------------------------------ */
      /*                       Persist into environment                      */
      /* ------------------------------------------------------------------ */
      await upsertEnv('NEXT_PUBLIC_PLATFORM_ISSUER_DID', newDid)
    } catch (err: any) {
      return { error: `Failed to generate or update Flare DID: ${String(err)}` }
    }

    revalidatePath('/admin/platform-did')
    return { success: 'Platform DID updated.', did: newDid }
  },
)