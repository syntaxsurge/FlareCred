import OpenAI from 'openai'

import { OPENAI_API_KEY } from '@/lib/config'
import { strictGraderMessages, summariseProfileMessages } from '@/lib/ai/prompts'

/* -------------------------------------------------------------------------- */
/*                           S H A R E D   O P E N A I                        */
/* -------------------------------------------------------------------------- */

/** Singleton OpenAI client reused across the application. */
export const openAiClient = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

/* -------------------------------------------------------------------------- */
/*                               C H A T   API                                */
/* -------------------------------------------------------------------------- */

/**
 * Wrapper around <code>openAiClient.chat.completions.create</code>.
 *
 * When `stream` is `true` the raw
 * `ChatCompletion` object is returned; otherwise the helper
 * extracts and returns the assistant-message `content` string.
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
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  const completion = await openAiClient.chat.completions.create(
    {
      model,
      messages,
      stream,
      ...opts,
    } as OpenAI.Chat.Completions.ChatCompletionCreateParams,
  )

  /* Narrow the return value based on the compile-time <Stream> boolean. */
  if (stream) {
    return completion as Stream extends true
      ? OpenAI.Chat.Completions.ChatCompletion
      : never
  }

  const message =
    (completion as OpenAI.Chat.Completions.ChatCompletion).choices[0]?.message?.content ?? ''

  return message as Stream extends true ? never : string
}

/* -------------------------------------------------------------------------- */
/*                             Q U I Z   G R A D E R                          */
/* -------------------------------------------------------------------------- */

/**
 * Grade a free-text quiz answer (0-100) using GPT-4o.
 * Falls back to a pseudo-random score when no API key is set.
 */
export async function openAIAssess(
  answer: string,
  quizTitle: string,
): Promise<{ aiScore: number }> {
  if (!OPENAI_API_KEY) {
    return { aiScore: Math.floor(Math.random() * 101) }
  }

  const raw = await chatCompletion(strictGraderMessages(quizTitle, answer), {
    model: 'gpt-4o',
  })

  const parsed = parseInt(String(raw).replace(/[^0-9]/g, ''), 10)
  return { aiScore: Number.isNaN(parsed) ? Math.floor(Math.random() * 101) : parsed }
}

/* -------------------------------------------------------------------------- */
/*                       P R O F I L E   S U M M A R I S E R                   */
/* -------------------------------------------------------------------------- */

/**
 * Produce an ≈N-word professional summary of a raw candidate profile.
 */
export async function summariseCandidateProfile(
  profile: string,
  words = 120,
): Promise<string> {
  const summary = await chatCompletion(
    summariseProfileMessages(profile, words),
    { model: 'gpt-4o' },
  )

  return summary.trim()
}