'use server'

import { revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { createFlareDID } from '@/lib/contracts/flare'
import { db } from '@/lib/db/drizzle'
import { candidateCredentials, CredentialStatus } from '@/lib/db/schema/candidate'
import { issuers, IssuerStatus } from '@/lib/db/schema/issuer'

/* -------------------------------------------------------------------------- */
/*                               U P D A T E                                  */
/* -------------------------------------------------------------------------- */

const updateIssuerStatusSchema = z
  .object({
    issuerId: z.coerce.number(),
    status: z.enum([IssuerStatus.PENDING, IssuerStatus.ACTIVE, IssuerStatus.REJECTED]),
    rejectionReason: z.string().max(2000).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.status === IssuerStatus.REJECTED && !val.rejectionReason) {
      ctx.addIssue({
        code: 'custom',
        message: 'Rejection reason is required when rejecting an issuer.',
        path: ['rejectionReason'],
      })
    }
  })

const _updateIssuerStatus = validatedActionWithUser(
  updateIssuerStatusSchema,
  async ({ issuerId, status, rejectionReason }, _formData, user) => {
    if (user.role !== 'admin') return { error: 'Unauthorized.' }

    /* ------------------------------------------------------------------ */
    /* Fetch current issuer record                                        */
    /* ------------------------------------------------------------------ */
    const [issuer] = await db.select().from(issuers).where(eq(issuers.id, issuerId)).limit(1)
    if (!issuer) return { error: 'Issuer not found.' }

    let didToPersist: string | undefined

    /* ------------------------------------------------------------------ */
    /* If verifying and issuer lacks DID → create one via Flare           */
    /* ------------------------------------------------------------------ */
    if (status === IssuerStatus.ACTIVE && !issuer.did) {
      try {
        const { did } = await createFlareDID()
        didToPersist = did
      } catch (err) {
        console.error('Failed to create Flare DID for issuer', issuerId, err)
        return { error: 'Could not generate DID while verifying issuer.' }
      }
    }

    /* ------------------------------------------------------------------ */
    /* Persist changes                                                    */
    /* ------------------------------------------------------------------ */
    await db
      .update(issuers)
      .set({
        status,
        rejectionReason: status === IssuerStatus.REJECTED ? rejectionReason ?? null : null,
        ...(didToPersist ? { did: didToPersist } : {}),
      })
      .where(eq(issuers.id, issuerId))

    revalidatePath('/admin/issuers')
    return {
      success: `Issuer status updated to ${status}${didToPersist ? ' and Flare DID generated.' : '.'}`,
    }
  },
)

export const updateIssuerStatusAction = async (...args: Parameters<typeof _updateIssuerStatus>) => {
  'use server'
  return _updateIssuerStatus(...args)
}

/* -------------------------------------------------------------------------- */
/*                               D E L E T E                                  */
/* -------------------------------------------------------------------------- */

const deleteIssuerSchema = z.object({
  issuerId: z.coerce.number(),
})

const _deleteIssuer = validatedActionWithUser(
  deleteIssuerSchema,
  async ({ issuerId }, _formData, user) => {
    if (user.role !== 'admin') return { error: 'Unauthorized.' }

    await db.transaction(async (tx) => {
      /* Unlink any credentials that referenced this issuer */
      await tx
        .update(candidateCredentials)
        .set({
          issuerId: null,
          status: CredentialStatus.UNVERIFIED,
          verified: false,
          verifiedAt: null,
        })
        .where(eq(candidateCredentials.issuerId, issuerId))

      /* Finally remove the issuer row */
      await tx.delete(issuers).where(eq(issuers.id, issuerId))
    })

    revalidatePath('/admin/issuers')
    return { success: 'Issuer deleted.' }
  },
)

export const deleteIssuerAction = async (...args: Parameters<typeof _deleteIssuer>) => {
  'use server'
  return _deleteIssuer(...args)
}