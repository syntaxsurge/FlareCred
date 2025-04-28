'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { createFlareDID } from '@/lib/flare'
import { upsertEnv } from '@/lib/utils/env'


/* -------------------------------------------------------------------------- */
/*                               A C T I O N                                  */
/* -------------------------------------------------------------------------- */

const schema = z.object({
  /** Optional DID – when absent we auto-generate via Flare */
  did: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^did:flare:0x[0-9a-fA-F]{40}$/.test(v), {
      message: 'Invalid Flare DID (expected did:flare:0x…) format.',
    }),
})

export const upsertPlatformDidAction = validatedActionWithUser(
  schema,
  async ({ did }, _formData, user) => {
    if (user.role !== 'admin') return { error: 'Unauthorized.' }

    let newDid = did?.trim()

    /* Auto-generate via Flare when no DID provided */
    if (!newDid) {
      try {
        const res = await createFlareDID()
        newDid = res.did
      } catch (err: any) {
        return { error: `Failed to generate Flare DID: ${String(err)}` }
      }
    }

    try {
      await upsertEnv('PLATFORM_ISSUER_DID', newDid!)
    } catch (err: any) {
      return { error: `Failed to update .env: ${String(err)}` }
    }

    revalidatePath('/admin/platform-did')
    return { success: 'Platform DID updated.', did: newDid }
  },
)