import OpenAI from 'openai'

import { OPENAI_API_KEY } from '@/lib/config'

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

export type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam

/**
 * Thin convenience wrapper around <code>chat.completions.create</code>.
 *
 * When <code>stream</code> is <code>true</code> the caller receives the
 * streamed completion iterator; otherwise the message content string is
 * returned directly.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  {
    model = 'gpt-4o',
    stream = false,
    ...opts
  }: Partial<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming> & {
    model?: string
    stream?: boolean
  } = {},
) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  const completion = await openAiClient.chat.completions.create({
    model,
    messages,
    stream,
    ...opts,
  } as any)

  if (stream) return completion
  return completion.choices[0].message?.content ?? ''
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

  const raw = await chatCompletion(
    [
      {
        role: 'system',
        content: 'You are a strict exam grader. Respond ONLY with an integer 0-100.',
      },
      {
        role: 'user',
        content: `Quiz topic: ${quizTitle}\nCandidate answer: ${answer}\nGrade (0-100):`,
      },
    ],
    { model: 'gpt-4o' },
  )

  const parsed = parseInt(String(raw).replace(/[^0-9]/g, ''), 10)
  return { aiScore: isNaN(parsed) ? Math.floor(Math.random() * 101) : parsed }
}

/* -------------------------------------------------------------------------- */
/*                       P R O F I L E   S U M M A R I S E R                   */
/* -------------------------------------------------------------------------- */

/**
 * Produce an ~N-word professional summary of a raw candidate profile.
 */
export async function summariseCandidateProfile(profile: string, words = 120): Promise<string> {
  const summary = await chatCompletion(
    [
      {
        role: 'system',
        content:
          `Summarise the following candidate profile in approximately ${words} words. ` +
          `Write in third-person professional tone without using personal pronouns.`,
      },
      { role: 'user', content: profile },
    ],
    { model: 'gpt-4o' },
  )

  return summary.trim()
}