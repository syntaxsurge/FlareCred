/* -------------------------------------------------------------------------- */
/*                       C E N T R A L I S E D   P R O M P T S                */
/* -------------------------------------------------------------------------- */

/**
 * Lightweight message object shape accepted by the OpenAI chat API.
 * (Avoids importing OpenAI types here to prevent circular dependencies.)
 */
export type PromptMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/* -------------------------------------------------------------------------- */
/*                          S T R I C T   G R A D E R                         */
/* -------------------------------------------------------------------------- */

/**
 * Build the message array used by the AI quiz-grader.
 *
 * @param quizTitle Title of the quiz being graded.
 * @param answer    Candidate’s free-text answer.
 */
export function strictGraderMessages(quizTitle: string, answer: string): PromptMessage[] {
  return [
    {
      role: 'system',
      content: 'You are a strict exam grader. Respond ONLY with an integer 0-100.',
    },
    {
      role: 'user',
      content: `Quiz topic: ${quizTitle}\nCandidate answer: ${answer}\nGrade (0-100):`,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                        P R O F I L E   S U M M A R Y                       */
/* -------------------------------------------------------------------------- */

/**
 * Build the message array used to summarise a raw candidate profile.
 *
 * @param profile Raw profile text.
 * @param words   Approximate word budget (default 120).
 */
export function summariseProfileMessages(
  profile: string,
  words = 120,
): PromptMessage[] {
  return [
    {
      role: 'system',
      content:
        `Summarise the following candidate profile in approximately ${words} words. ` +
        `Write in third-person professional tone without using personal pronouns.`,
    },
    {
      role: 'user',
      content: profile,
    },
  ]
}