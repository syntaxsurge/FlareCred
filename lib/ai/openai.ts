import OpenAI from 'openai'

import { OPENAI_API_KEY } from '@/lib/config'
import {
  strictGraderMessages,
  summariseProfileMessages,
} from '@/lib/ai/prompts'

/* -------------------------------------------------------------------------- */
/*                           S H A R E D   O P E N A I                        */
/* -------------------------------------------------------------------------- */

/**
 * Singleton client reused across the application to avoid constructing
 * multiple HTTP pools and to keep API-key handling in one place.
 */
const openAiClient = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

/* -------------------------------------------------------------------------- */
/*                               C H A T   API                                */
/* -------------------------------------------------------------------------- */

/**
 * Generic wrapper around `openAiClient.chat.completions.create`.
 *
 * When `stream` is `true` the full `ChatCompletion` object is returned,
 * otherwise the assistant message content string is returned.
 */
export async function chatCompletion<Stream extends boolean = false>(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  {
    model = 'gpt-4o',
    stream = false as Stream,
    ...opts
  }: Partial<
    OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
  > & { stream?: Stream } = {},
): Promise<
  Stream extends true
    ? OpenAI.Chat.Completions.ChatCompletion
    : string
> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  const completion = await openAiClient.chat.completions.create({
    model,
    messages,
    stream,
    ...opts,
  } as any)

  return (stream
    ? completion
    : completion.choices[0].message?.content ?? '') as any
}

/* -------------------------------------------------------------------------- */
/*                             Q U I Z   G R A D E R                          */
/* -------------------------------------------------------------------------- */

/**
 * Grade a free-text quiz answer 0-100 using GPT-4o.
 * Falls back to a pseudo-random score when no API key is set (dev mode).
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
  return { aiScore: isNaN(parsed) ? Math.floor(Math.random() * 101) : parsed }
}

/* -------------------------------------------------------------------------- */
/*                       P R O F I L E   S U M M A R I S E R                   */
/* -------------------------------------------------------------------------- */

/**
 * Produce an ~N-word professional summary of a raw candidate profile.
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