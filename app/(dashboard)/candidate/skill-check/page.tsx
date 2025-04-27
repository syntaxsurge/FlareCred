import { eq } from 'drizzle-orm'
import { Bot } from 'lucide-react'

import { DidRequiredModal } from '@/components/dashboard/candidate/did-required-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PageCard from '@/components/ui/page-card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { skillQuizzes } from '@/lib/db/schema/candidate'
import { teams, teamMembers } from '@/lib/db/schema/core'

import StartQuizForm from './start-quiz-form'

export const revalidate = 0

export default async function SkillCheckPage() {
  /* ---------------- Authentication ---------------- */
  const user = await getUser()
  if (!user) return <div>Please sign in</div>

  const [{ did } = {}] = await db
    .select({ did: teams.did })
    .from(teamMembers)
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, user.id))
    .limit(1)

  if (!did) return <DidRequiredModal />

  /* -------------------- Data --------------------- */
  const quizzes = await db.select().from(skillQuizzes)

  /* -------------------- UI ----------------------- */
  return (
    <PageCard
      icon={Bot}
      title='AI Skill Check'
      description='Pass a quiz to instantly earn a verifiable Skill Pass credential.'
    >
      {quizzes.length === 0 ? (
        <p className='text-muted-foreground'>No quizzes found. Seed the database first.</p>
      ) : (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {quizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className='group relative overflow-hidden transition-shadow hover:shadow-xl'
            >
              <CardHeader>
                <CardTitle className='line-clamp-2 min-h-[3rem]'>{quiz.title}</CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col gap-4'>
                <p className='text-muted-foreground line-clamp-3 flex-1 text-sm'>
                  {quiz.description}
                </p>
                <StartQuizForm quiz={quiz} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageCard>
  )
}
