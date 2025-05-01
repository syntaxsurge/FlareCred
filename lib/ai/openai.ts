import OpenAI from 'openai'

import { OPENAI_API_KEY } from '@/lib/config'
import {
  strictGraderMessages,
  summariseProfileMessages,
  candidateFitMessages,
} from '@/lib/ai/prompts'

/* -------------------------------------------------------------------------- */
/*                           S I N G L E T O N   C L I E N T                  */
/* -------------------------------------------------------------------------- */

export const openAiClient = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

/* -------------------------------------------------------------------------- */
/*                       G E N E R I C   C H A T   W R A P P E R              */
/* -------------------------------------------------------------------------- */

/**
 * Wrapper around <code>openAiClient.chat.completions.create</code>.
 *
 * When <code>stream</code> is <code>true</code> the raw
 * <code>ChatCompletion</code> object is returned; otherwise the helper
 * extracts and returns the assistant-message <code>content</code> string.
 */
export async function chatCompletion<Stream extends boolean = false>(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  {
    model = 'gpt-4o',
    stream = false as Stream,
    ...opts
  }: Partial<OpenAI.Chat.Completions.ChatCompletionCreateParams> & {
    stream?: Stream
  } = {},
): Promise<
  Stream extends true
    ? OpenAI.Chat.Completions.ChatCompletion
    : string
> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured.')

  const completion = await openAiClient.chat.completions.create(
    { model, messages, stream, ...opts } as OpenAI.Chat.Completions.ChatCompletionCreateParams,
  )

  if (stream) return completion as any

  const message =
    (completion as OpenAI.Chat.Completions.ChatCompletion).choices[0]?.message?.content ?? ''

  return message.trim() as any
}

/* -------------------------------------------------------------------------- */
/*                       Q U I Z   A S S E S S M E N T                        */
/* -------------------------------------------------------------------------- */

export async function openAIAssess(
  answer: string,
  quizTitle: string,
): Promise<{ aiScore: number }> {
  if (!OPENAI_API_KEY) return { aiScore: Math.floor(Math.random() * 101) }

  const raw = await chatCompletion(strictGraderMessages(quizTitle, answer))
  const parsed = parseInt(raw.replace(/[^0-9]/g, ''), 10)
  return { aiScore: Number.isNaN(parsed) ? Math.floor(Math.random() * 101) : parsed }
}

/* -------------------------------------------------------------------------- */
/*                      C A N D I D A T E   P R O F I L E                     */
/* -------------------------------------------------------------------------- */

export async function summariseCandidateProfile(
  profile: string,
  words = 120,
): Promise<string> {
  const summary = await chatCompletion(summariseProfileMessages(profile, words))
  return summary
}

/* -------------------------------------------------------------------------- */
/*                     R E C R U I T E R   F I T   S U M M A R Y              */
/* -------------------------------------------------------------------------- */

/**
 * Generate a structured "Why hire this candidate” summary tailored to a
 * recruiter’s pipelines.  Returns the raw JSON string produced by the LLM.
 *
 * @param pipelinesStr  Concatenated recruiter pipeline descriptions (<=20)
 * @param profileStr    Candidate profile text (bio + credentials)
 */
export async function generateCandidateFitSummary(
  pipelinesStr: string,
  profileStr: string,
): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI features disabled – no API key.')

  return await chatCompletion(candidateFitMessages(pipelinesStr, profileStr))
}