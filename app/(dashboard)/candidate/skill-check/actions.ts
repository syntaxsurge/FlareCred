'use server'

import { eq } from 'drizzle-orm'

import { issueFlareCredential } from '@/lib/flare'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { quizAttempts, skillQuizzes, candidates } from '@/lib/db/schema/candidate'
import { teams, teamMembers } from '@/lib/db/schema/core'

import { openAIAssess } from './openai'
import { PLATFORM_ISSUER_DID } from '@/lib/config'
import { extractAddressFromDid, toBytes32 } from '@/lib/utils/address'

/* -------------------------------------------------------------------------- */
/*                               A C T I O N                                  */
/* -------------------------------------------------------------------------- */

export async function startQuizAction(formData: FormData) {
  const user = await getUser()
  if (!user) return { score: 0, message: 'Not logged in.' }

  const quizId = formData.get('quizId')
  const answer = formData.get('answer')
  const seed = formData.get('seed') as string | null

  if (!quizId || !answer) return { score: 0, message: 'Invalid request.' }

  /* --------------------------- Seed validation --------------------------- */
  if (!seed || !/^0x[0-9a-fA-F]{1,64}$/.test(seed)) {
    return { score: 0, message: 'Invalid seed.' }
  }

  /* Ensure candidate record exists --------------------------------------- */
  let [candidateRow] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  if (!candidateRow) {
    const [newCand] = await db.insert(candidates).values({ userId: user.id, bio: '' }).returning()
    candidateRow = newCand
  }

  /* Require team DID ------------------------------------------------------ */
  const [teamRow] = await db
    .select({ did: teams.did })
    .from(teamMembers)
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, user.id))
    .limit(1)

  const subjectDid = teamRow?.did ?? null
  if (!subjectDid) {
    return { score: 0, message: 'Please create your team DID before taking a quiz.' }
  }

  /* Quiz lookup ----------------------------------------------------------- */
  const [quiz] = await db
    .select()
    .from(skillQuizzes)
    .where(eq(skillQuizzes.id, Number(quizId)))
    .limit(1)
  if (!quiz) return { score: 0, message: 'Quiz not found.' }

  /* AI grading ------------------------------------------------------------ */
  const { aiScore } = await openAIAssess(String(answer), quiz.title)
  const passed = aiScore >= 70
  let vcIssuedId: string | undefined
  let message = `You scored ${aiScore}. ${passed ? 'You passed!' : 'You failed.'}`

  if (passed) {
    /* Build VC JSON ------------------------------------------------------- */
    const vcPayload = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'SkillPassVC'],
      issuer: PLATFORM_ISSUER_DID,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: subjectDid,
        skillQuiz: quiz.title,
        score: aiScore,
        candidateName: user.name || user.email,
      },
    }
    const vcJsonText = JSON.stringify(vcPayload)
    const vcHash = toBytes32(vcJsonText)

    const to = extractAddressFromDid(subjectDid)
    if (!to) {
      message += ' (Invalid subject DID for anchoring.)'
    } else {
      try {
        const res = await issueFlareCredential({
          to,
          vcHash,
          uri: '', // off-chain VC stored in DB
          signerAddress: to,
        })
        vcIssuedId = res.txHash
        message += ' A Skill Pass credential has been anchored on-chain.'
      } catch (err: any) {
        message += ` (VC anchoring failed: ${String(err)})`
      }
    }
  }

  /* Persist attempt ------------------------------------------------------- */
  await db.insert(quizAttempts).values({
    candidateId: candidateRow.id,
    quizId: quiz.id,
    seed,
    score: aiScore,
    maxScore: 100,
    pass: passed ? 1 : 0,
    vcIssuedId,
  })

  return { score: aiScore, message }
}