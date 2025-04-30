'use server'

import { eq } from 'drizzle-orm'

import { PLATFORM_ISSUER_DID } from '@/lib/config'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { candidates, skillQuizzes } from '@/lib/db/schema/candidate'
import { teams, teamMembers } from '@/lib/db/schema/core'
import { extractAddressFromDid, toBytes32 } from '@/lib/utils/address'
import { signCredentialMint } from '@/lib/utils/signature'

import { openAIAssess } from './openai'

/**
 * Runs the AI assessment and returns signing payloads _without_
 * writing anything to the database – the quiz attempt will be
 * inserted only after the user mints the credential.
 */
export async function startQuizAction(formData: FormData) {
  const user = await getUser()
  if (!user) return { score: 0, message: 'Not logged in.' }

  /* ------------------------------------------------------------------ */
  /*                           Payload parse                            */
  /* ------------------------------------------------------------------ */
  const quizId = formData.get('quizId')
  const answer = formData.get('answer')
  const seed = formData.get('seed') as string | null

  if (!quizId || !answer) return { score: 0, message: 'Invalid request.' }
  if (!seed || !/^0x[0-9a-fA-F]{1,64}$/.test(seed)) return { score: 0, message: 'Invalid seed.' }

  /* ------------------------------------------------------------------ */
  /*                     Candidate profile ensure                       */
  /* ------------------------------------------------------------------ */
  let [candidateRow] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  if (!candidateRow) {
    const [created] = await db.insert(candidates).values({ userId: user.id, bio: '' }).returning()
    candidateRow = created
  }

  /* ------------------------------------------------------------------ */
  /*                           Team DID check                           */
  /* ------------------------------------------------------------------ */
  const [teamRow] = await db
    .select({ did: teams.did })
    .from(teamMembers)
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, user.id))
    .limit(1)

  const subjectDid = teamRow?.did ?? null
  if (!subjectDid) return { score: 0, message: 'Please create your team DID before taking a quiz.' }

  /* ------------------------------------------------------------------ */
  /*                           Quiz lookup                              */
  /* ------------------------------------------------------------------ */
  const [quiz] = await db
    .select()
    .from(skillQuizzes)
    .where(eq(skillQuizzes.id, Number(quizId)))
    .limit(1)
  if (!quiz) return { score: 0, message: 'Quiz not found.' }

  /* ------------------------------------------------------------------ */
  /*                          AI assessment                             */
  /* ------------------------------------------------------------------ */
  const { aiScore } = await openAIAssess(String(answer), quiz.title)
  const passed = aiScore >= 70

  /* Construct VC ----------------------------------------------------- */
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
  const vcJson = JSON.stringify(vcPayload)
  const vcHash = toBytes32(vcJson)

  let message = `You scored ${aiScore}. ${passed ? 'You passed!' : 'You failed.'}`

  let signature = ''
  if (passed) {
    /* Generate on-chain authorisation so the client can self-mint. */
    const toAddr = extractAddressFromDid(subjectDid)
    if (!toAddr) {
      return {
        score: aiScore,
        message: 'Failed to derive wallet address from your team DID.',
      }
    }
    signature = await signCredentialMint(toAddr, vcHash, '')
    message += ' Sign the next transaction to anchor your Skill Pass credential on-chain.'
  }

  /* No DB writes here – the attempt will be saved after mint success */

  return {
    score: aiScore,
    message,
    passed,
    vcHash,
    signature,
    vcJson,
    quizId: quiz.id,
    seed,
  }
}
