'use server'

import OpenAI from 'openai'

/**
 * If OPENAI_API_KEY is missing, return a random score.
 * Otherwise, ask GPT-4o to grade the answer 0-100.
 */
const openAiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
})

export async function openAIAssess(
  answer: string,
  quizTitle: string,
): Promise<{ aiScore: number }> {
  if (!process.env.OPENAI_API_KEY) {
    return { aiScore: Math.floor(Math.random() * 100) }
  }

  const completion = await openAiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a strict exam grader. Respond ONLY with an integer 0-100.',
      },
      {
        role: 'user',
        content: `Quiz topic: ${quizTitle}\nCandidate answer: ${answer}\nGrade (0-100):`,
      },
    ],
  })

  const raw = completion.choices[0].message?.content?.trim() ?? ''
  const parsed = parseInt(raw.replace(/[^0-9]/g, ''), 10)
  return { aiScore: isNaN(parsed) ? Math.floor(Math.random() * 100) : parsed }
}
