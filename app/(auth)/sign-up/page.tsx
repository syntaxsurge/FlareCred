import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getUser } from '@/lib/db/queries/queries'

import { Login } from '../login'

/**
 * Sign-up entry point.
 *
 * • If the user is already authenticated, forward to /dashboard.
 * • Otherwise render the <Login> component in sign-up mode.
 *   The visible role selector now decides the default role,
 *   so no automatic query-param redirect is needed.
 */
export default async function SignUpPage() {
  const user = await getUser()
  if (user) redirect('/dashboard')

  return (
    <Suspense>
      <Login mode='signup' />
    </Suspense>
  )
}
