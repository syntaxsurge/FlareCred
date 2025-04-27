'use client'

import * as React from 'react'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getAvatarInitials } from '@/lib/utils/avatar'

export interface UserAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  /** Optional remote image URL */
  src?: string | null
  /** User’s display name */
  name?: string | null
  /** Fallback — user’s email */
  email?: string | null
  /** How many characters to show in the fallback initials (default 2) */
  initialsLength?: number
}

/**
 * Drop‑in replacement for <Avatar> that auto‑generates fallback initials
 * and preserves all Avatar props / styling hooks.
 */
export function UserAvatar({
  src,
  name,
  email,
  initialsLength = 2,
  className,
  ...props
}: UserAvatarProps) {
  return (
    <Avatar className={cn(className)} {...props}>
      <AvatarImage src={src ?? undefined} alt={name ?? email ?? 'User avatar'} />
      {/* Explicitly style fallback to stay legible on any background */}
      <AvatarFallback className='bg-muted text-foreground'>
        {getAvatarInitials(name, email, initialsLength)}
      </AvatarFallback>
    </Avatar>
  )
}

export default UserAvatar
