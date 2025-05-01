import { redirect } from 'next/navigation'

import { getUser } from '@/lib/db/queries/queries'
import type { Role } from '@/lib/types'

/**
 * Server-side page guard.
 * Ensures a wallet-authenticated user exists and, when {@link allowedRoles}
 * is non-empty, that the user’s role is included – otherwise redirects.
 *
 * @param allowedRoles  Whitelisted roles (empty = any authenticated user)
 * @returns             The authenticated user record
 */
export async function requireAuth(allowedRoles: readonly Role[] = []) {
  const user = await getUser()
  if (!user) redirect('/connect-wallet')
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role as Role)) {
    redirect('/dashboard')
  }
  return user
}
