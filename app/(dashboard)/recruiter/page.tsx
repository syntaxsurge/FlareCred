import { redirect } from 'next/navigation'

import { getUser } from '@/lib/db/queries/queries'

/**
 * /recruiter
 *
 * • Logged-out users are guided to the recruiter sign-up screen.
 * • Logged-in recruiters land on their workspace.
 * • Other roles are bounced home.
 */
export default async function RecruiterIndexPage() {
  const user = await getUser()

  if (!user) {
    redirect('/sign-up?role=recruiter')
  }

  if (user.role === 'recruiter') {
    redirect('/recruiter/talent')
  }

  redirect('/')
}
