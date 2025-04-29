import { eq } from 'drizzle-orm'

import { db } from '../drizzle'
import { skillQuizzes, skillQuizQuestions } from '../schema/candidate'

export async function seedQuizzes() {
  console.log('Seeding sample skill quizzes…')

  /* ------------------------------------------------------------------ */
  /*                Insert quiz headers when they are new               */
  /* ------------------------------------------------------------------ */

  const existingQuizzes = await db.select().from(skillQuizzes)
  const existingTitles = new Set(existingQuizzes.map((q) => q.title))

  const quizzesToInsert = [
    {
      title: 'JavaScript Fundamentals',
      description:
        'Assess basic to intermediate JavaScript skills, including syntax, arrays, objects, async patterns, and DOM manipulation.',
    },
    {
      title: 'React Basics',
      description:
        'Evaluate knowledge of React concepts like components, props, state, lifecycle methods, and hooks.',
    },
    {
      title: 'Node.js & Express',
      description:
        'Check familiarity with Node.js runtime and building REST APIs using Express, including middleware and routing.',
    },
    {
      title: 'HTML & CSS',
      description: 'Covers foundational web design, including semantic HTML and responsive CSS.',
    },
    {
      title: 'TypeScript Introduction',
      description:
        'Evaluate usage of TypeScript features like interfaces, types, generics, and compilation.',
    },
    {
      title: 'SQL & Database Basics',
      description:
        'Test knowledge of relational databases, SQL queries (SELECT, JOIN), and data modeling.',
    },
  ]

  const newQuizzes = quizzesToInsert.filter((quiz) => !existingTitles.has(quiz.title))
  if (newQuizzes.length) {
    await db.insert(skillQuizzes).values(newQuizzes)
    console.log('Inserted new quizzes:', newQuizzes.map((q) => q.title))
  }

  /* ------------------------------------------------------------------ */
  /*        Ensure every quiz has at least three demonstration          */
  /*                      questions for shuffling                       */
  /* ------------------------------------------------------------------ */

  const quizzes = await db.select().from(skillQuizzes)

  for (const quiz of quizzes) {
    const existingQs = await db
      .select()
      .from(skillQuizQuestions)
      .where(eq(skillQuizQuestions.quizId, quiz.id))

    if (existingQs.length >= 3) continue

    const missing = 3 - existingQs.length
    const qValues = Array.from({ length: missing }).map((_, idx) => ({
      quizId: quiz.id,
      prompt: `${quiz.title} – question ${existingQs.length + idx + 1}`,
    }))

    await db.insert(skillQuizQuestions).values(qValues)
    console.log(`Added ${missing} question(s) to "${quiz.title}"`)
  }

  console.log('✔ Quiz seeding complete.')
}