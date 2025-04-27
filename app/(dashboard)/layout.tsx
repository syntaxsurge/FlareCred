'use client'

import { useEffect, useState } from 'react'

import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Mail,
  ShieldCheck,
  Award,
  BookOpen,
  Key,
  Settings as Cog,
  Users as UsersIcon,
  Activity,
  Shield,
  Menu,
  Tag,
  User,
  Star,
} from 'lucide-react'

import { SidebarNav, type SidebarNavItem } from '@/components/dashboard/sidebar-nav'
import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/auth'

/* -------------------------------------------------------------------------- */
/*                         P E N D I N G   C O U N T S                        */
/* -------------------------------------------------------------------------- */

type PendingCounts = {
  invitations: number
  issuerRequests: number
  adminPendingIssuers: number
}

/* -------------------------------------------------------------------------- */
/*                           R O L E - B A S E D  N A V                       */
/* -------------------------------------------------------------------------- */

function roleNav(role?: string, counts?: PendingCounts): SidebarNavItem[] {
  switch (role) {
    case 'candidate':
      return [
        { href: '/candidate/profile', icon: User, label: 'Profile' },
        { href: '/candidate/highlights', icon: Star, label: 'Profile Highlight' },
        { href: '/candidate/credentials', icon: BookOpen, label: 'Credentials' },
        { href: '/candidate/skill-check', icon: Award, label: 'Skill Quiz' },
        { href: '/candidate/create-did', icon: Key, label: 'Create DID' },
      ]
    case 'recruiter':
      return [
        { href: '/recruiter/talent', icon: Users, label: 'Talent' },
        { href: '/recruiter/pipelines', icon: FolderKanban, label: 'Pipelines' },
      ]
    case 'issuer':
      return [
        {
          href: '/issuer/requests',
          icon: Mail,
          label: 'Requests',
          badgeCount: counts?.issuerRequests,
        },
        { href: '/issuer/onboard', icon: ShieldCheck, label: 'Organisation' },
      ]
    case 'admin':
      return [
        { href: '/admin/users', icon: Users, label: 'Users' },
        { href: '/admin/credentials', icon: Award, label: 'Credentials' },
        {
          href: '/admin/issuers',
          icon: ShieldCheck,
          label: 'Issuers',
          badgeCount: counts?.adminPendingIssuers,
        },
        { href: '/admin/platform-did', icon: Key, label: 'Platform DID' },
      ]
    default:
      return []
  }
}

function roleTitle(role?: string): string {
  switch (role) {
    case 'candidate':
      return 'Candidate Tools'
    case 'recruiter':
      return 'Recruiter Workspace'
    case 'issuer':
      return 'Issuer Console'
    case 'admin':
      return 'Admin'
    default:
      return ''
  }
}

/* -------------------------------------------------------------------------- */
/*                               S H E L L  U I                               */
/* -------------------------------------------------------------------------- */

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { userPromise } = useUser()
  const [user, setUser] = useState<any | null | undefined>(undefined)
  const [counts, setCounts] = useState<PendingCounts>({
    invitations: 0,
    issuerRequests: 0,
    adminPendingIssuers: 0,
  })

  /* Resolve user once (suspense-safe) */
  useEffect(() => {
    let mounted = true
    userPromise.then((u) => mounted && setUser(u))
    return () => {
      mounted = false
    }
  }, [userPromise])

  /* Fetch pending counts for sidebar badges */
  useEffect(() => {
    fetch('/api/pending-counts', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) =>
        setCounts({
          invitations: d.invitations ?? 0,
          issuerRequests: d.issuerRequests ?? 0,
          adminPendingIssuers: d.adminPendingIssuers ?? 0,
        }),
      )
      .catch(() => {})
  }, [])

  /* Primary navigation — always visible */
  const mainNav: SidebarNavItem[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/invitations', icon: Mail, label: 'Invitations', badgeCount: counts.invitations },
    { href: '/pricing', icon: Tag, label: 'Pricing' },
  ]

  /* Settings navigation */
  const settingsNav: SidebarNavItem[] = [
    { href: '/settings/general', icon: Cog, label: 'General' },
    { href: '/settings/team', icon: UsersIcon, label: 'Team' },
    { href: '/settings/activity', icon: Activity, label: 'Activity' },
    { href: '/settings/security', icon: Shield, label: 'Security' },
  ]

  const intrinsicNav = roleNav(user?.role, counts)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function SidebarContent() {
    return (
      <>
        <SidebarNav title='Main' items={mainNav} />
        {intrinsicNav.length > 0 && (
          <SidebarNav title={roleTitle(user?.role)} items={intrinsicNav} />
        )}
        {user && <SidebarNav title='Settings' items={settingsNav} />}
      </>
    )
  }

  return (
    <div className='mx-auto flex min-h-[calc(100dvh-64px)] w-full max-w-7xl'>
      {/* Desktop sidebar */}
      <aside className='bg-background ring-border/30 sticky top-16 hidden h-[calc(100dvh-64px)] w-64 overflow-y-auto border-r shadow-sm ring-1 lg:block'>
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className='flex min-w-0 flex-1 flex-col'>
        {/* Mobile header */}
        <div className='bg-background sticky top-16 z-20 flex items-center justify-between border-b p-4 lg:hidden'>
          <span className='font-medium capitalize'>{user?.role ?? 'Dashboard'}</span>
          <Button variant='ghost' size='icon' onClick={() => setSidebarOpen((p) => !p)}>
            <Menu className='h-6 w-6' />
            <span className='sr-only'>Toggle sidebar</span>
          </Button>
        </div>

        {/* Mobile off-canvas */}
        {sidebarOpen && (
          <aside className='bg-background ring-border/30 fixed top-16 z-40 h-[calc(100dvh-64px)] w-64 overflow-y-auto border-r shadow-md ring-1 lg:hidden'>
            <SidebarContent />
          </aside>
        )}

        <main className='flex-1 overflow-y-auto p-4'>{children}</main>
      </div>
    </div>
  )
}
