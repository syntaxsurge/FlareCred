'use server'

import { eq, and } from 'drizzle-orm'
import { ethers } from 'ethers'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { isGithubRepoCredential } from '@/lib/constants/credential'
import { issueFlareCredential, verifyFdcProof } from '@/lib/contracts/flare'
import { provider } from '@/lib/contracts'
import { db } from '@/lib/db/drizzle'
import { candidateCredentials, CredentialStatus, candidates } from '@/lib/db/schema/candidate'
import { users, teams, teamMembers } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'
import { buildError } from '@/lib/utils'
import { extractAddressFromDid, toBytes32 } from '@/lib/utils/address'

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

    /* 2b. enforce FDC proof ------------------------------------------------- */
    let parsedProof: unknown = cred.proofData
    try {
      parsedProof =
        typeof cred.proofData === 'string'
          ? (() => {
              try {
                return JSON.parse(cred.proofData)
              } catch {
                return cred.proofData
              }
            })()
          : cred.proofData

      await verifyFdcProof(cred.proofType, parsedProof)
    } catch (err: any) {
      return buildError(`FDC verification failed: ${err?.message ?? String(err)}`)
    }

    /* Extract tx-hash (if present) for later deep-link --------------------- */
    let proofTx: string | undefined
    try {
      if (cred.proofType === 'EVM' || cred.proofType === 'PAYMENT') {
        if (
          typeof cred.proofData === 'string' &&
          cred.proofData.startsWith('0x') &&
          cred.proofData.length === 66
        ) {
          proofTx = cred.proofData
        } else {
          const obj = JSON.parse(cred.proofData)
          if (typeof obj.txHash === 'string') proofTx = obj.txHash
        }
      }
    } catch {
      /* ignore */
    }

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
      /* ---------- credentialSubject assembly ---------- */
      const credentialSubject: Record<string, unknown> = {
        id: subjectDid,
        title: cred.title,
        type: cred.type,
        candidateName: candRow.candUser.name || candRow.candUser.email || 'Unknown',
      }

      if (
        isGithubRepoCredential(cred.type) &&
        typeof parsedProof === 'object' &&
        parsedProof !== null &&
        'request' in parsedProof &&
        typeof (parsedProof as any).request?.url === 'string'
      ) {
        credentialSubject.githubRepo = (parsedProof as any).request.url
      }

      const vcPayload = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'FlareCredCredential'],
        issuer: issuer.did,
        issuanceDate: new Date().toISOString(),
        credentialSubject,
      } as const

      vcJsonText = JSON.stringify(vcPayload)
      const vcHash = toBytes32(vcJsonText)

      /* Anchor on Flare ---------------------------------------------------- */
      const to = extractAddressFromDid(subjectDid)
      if (!to) return buildError('Malformed subject DID.')

      /* ---------------- Platform signer injection ------------------------ */
      const PK = process.env.PLATFORM_SIGNER_PRIVATE_KEY
      if (!PK) return buildError('Platform signer private key not configured.')
      const platformSigner = new ethers.Wallet(PK, provider)

      try {
        const res = await issueFlareCredential({
          to,
          vcHash,
          uri: '', // off-chain VC stored in DB; IPFS pinning can update later
          signer: platformSigner,
        })
        tokenId = res.tokenId.toString()
        txHash = res.txHash
      } catch (err: any) {
        return buildError(`Failed to anchor credential: ${err?.message || String(err)}`)
      }
    }

    /* Build new vcJson payload -------------------------------------------- */
    let newVcJson: string
    try {
      const baseVcObj =
        cred.vcJson && !vcJsonText
          ? JSON.parse(cred.vcJson)
          : { vc: JSON.parse(vcJsonText as string) }

      const merged: any = {
        ...baseVcObj,
        tokenId: tokenId ?? baseVcObj.tokenId,
        txHash: txHash ?? baseVcObj.txHash,
      }
      if (proofTx) merged.proofTx = proofTx
      newVcJson = JSON.stringify(merged)
    } catch {
      // Fallback minimal
      newVcJson = JSON.stringify({
        tokenId,
        txHash,
        proofTx,
      })
    }

    /* 5. persist ----------------------------------------------------------- */
    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.VERIFIED,
        verified: true,
        verifiedAt: new Date(),
        vcJson: newVcJson,
      })
      .where(eq(candidateCredentials.id, cred.id))

    return { success: 'Credential verified, proof confirmed, and NFT anchored on Flare.' }
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