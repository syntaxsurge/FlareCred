'use server'

import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { ethers } from 'ethers'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { issueFlareCredential } from '@/lib/flare'
import { db } from '@/lib/db/drizzle'
import { candidateCredentials, CredentialStatus, candidates } from '@/lib/db/schema/candidate'
import { users, teams, teamMembers } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'

/* -------------------------------------------------------------------------- */
/*                               U T I L S                                    */
/* -------------------------------------------------------------------------- */

function buildError(message: string) {
  return { error: message }
}

function didToAddress(did: string | null | undefined): string | null {
  if (!did) return null
  const m = did.match(/^did:flare:(0x[0-9a-fA-F]{40})$/)
  return m ? m[1] : null
}

function toVcHash(json: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(json))
}

/* -------------------------------------------------------------------------- */
/*                       A P P R O V E  /  S I G N  V C                       */
/* -------------------------------------------------------------------------- */

export const approveCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _, user) => {
    /* 1. issuer ownership -------------------------------------------------- */
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)
    if (!issuer) return buildError('Issuer not found.')
    if (!issuer.did) return buildError('Link a DID before approving credentials.')

    /* 2. credential row ---------------------------------------------------- */
    const [cred] = await db
      .select()
      .from(candidateCredentials)
      .where(
        and(
          eq(candidateCredentials.id, credentialId),
          eq(candidateCredentials.issuerId, issuer.id),
        ),
      )
      .limit(1)
    if (!cred) return buildError('Credential not found for this issuer.')
    if (cred.status === CredentialStatus.VERIFIED) return buildError('Credential already verified.')

    /* 3. subject DID ------------------------------------------------------- */
    const [candRow] = await db
      .select({ cand: candidates, candUser: users })
      .from(candidates)
      .leftJoin(users, eq(candidates.userId, users.id))
      .where(eq(candidates.id, cred.candidateId))
      .limit(1)
    if (!candRow?.candUser) return buildError('Candidate user not found.')

    const [teamRow] = await db
      .select({ did: teams.did })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, candRow.candUser.id))
      .limit(1)
    const subjectDid = teamRow?.did
    if (!subjectDid)
      return buildError('Candidate has no DID – ask them to create one before verification.')

    /* 4. Prepare VC JSON & on-chain data ----------------------------------- */
    let vcJsonText: string | undefined = cred.vcJson ?? undefined
    let tokenId: string | undefined
    let txHash: string | undefined

    if (!vcJsonText) {
      const vcPayload = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'FlareCredCredential'],
        issuer: issuer.did,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: subjectDid,
          title: cred.title,
          type: cred.type,
          candidateName: candRow.candUser.name || candRow.candUser.email || 'Unknown',
        },
      }
      vcJsonText = JSON.stringify(vcPayload)
      const vcHash = toVcHash(vcJsonText)

      /* Anchor on Flare ---------------------------------------------------- */
      const to = didToAddress(subjectDid)
      if (!to) return buildError('Malformed subject DID.')

      try {
        const res = await issueFlareCredential({
          to,
          vcHash,
          uri: '', // off-chain VC stored in DB; IPFS pinning can update later
        })
        tokenId = res.tokenId.toString()
        txHash = res.txHash
      } catch (err: any) {
        return buildError(`Failed to anchor credential: ${err?.message || String(err)}`)
      }
    }

    /* 5. persist ----------------------------------------------------------- */
    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.VERIFIED,
        verified: true,
        verifiedAt: new Date(),
        vcJson:
          vcJsonText &&
          JSON.stringify({
            vc: JSON.parse(vcJsonText),
            tokenId,
            txHash,
          }),
      })
      .where(eq(candidateCredentials.id, cred.id))

    return { success: 'Credential verified and anchored on Flare.' }
  },
)

/* -------------------------------------------------------------------------- */
/*                              R E J E C T                                   */
/* -------------------------------------------------------------------------- */

export const rejectCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)
    if (!issuer) return buildError('Issuer not found.')

    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.REJECTED,
        verified: false,
        verifiedAt: new Date(),
      })
      .where(
        and(
          eq(candidateCredentials.id, credentialId),
          eq(candidateCredentials.issuerId, issuer.id),
        ),
      )

    return { success: 'Credential rejected.' }
  },
)

/* -------------------------------------------------------------------------- */
/*                            U N V E R I F Y                                 */
/* -------------------------------------------------------------------------- */

export const unverifyCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)
    if (!issuer) return buildError('Issuer not found.')

    const [cred] = await db
      .select()
      .from(candidateCredentials)
      .where(
        and(
          eq(candidateCredentials.id, credentialId),
          eq(candidateCredentials.issuerId, issuer.id),
        ),
      )
      .limit(1)
    if (!cred) return buildError('Credential not found for this issuer.')
    if (cred.status !== CredentialStatus.VERIFIED)
      return buildError('Only verified credentials can be unverified.')

    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.UNVERIFIED,
        verified: false,
        verifiedAt: null,
      })
      .where(eq(candidateCredentials.id, cred.id))

    return { success: 'Credential marked unverified.' }
  },
)