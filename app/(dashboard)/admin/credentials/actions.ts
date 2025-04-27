'use server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { candidateCredentials } from '@/lib/db/schema/candidate'

export const deleteCredentialAction = validatedActionWithUser(
  z.object({
    credentialId: z.coerce.number(),
  }),
  async ({ credentialId }, _formData, user) => {
    if (user.role !== 'admin') return { error: 'Unauthorized.' }

    await db.delete(candidateCredentials).where(eq(candidateCredentials.id, credentialId))

    return { success: 'Credential deleted.' }
  },
)
