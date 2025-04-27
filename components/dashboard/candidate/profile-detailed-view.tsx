'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { format, formatDistanceToNow } from 'date-fns'
import {
  BookOpen,
  Briefcase,
  Award,
  BarChart4,
  ChevronDown,
  ChevronUp,
  Download,
  Globe2,
  ExternalLink,
} from 'lucide-react'
import { FaTwitter } from 'react-icons/fa'
import { SiGithub, SiLinkedin } from 'react-icons/si'

import CredentialsTable, {
  RowType as CredRow,
} from '@/components/dashboard/recruiter/credentials-table'
import PipelineEntriesTable, {
  RowType as PipeRow,
} from '@/components/dashboard/recruiter/pipeline-entries-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import StatusBadge from '@/components/ui/status-badge'
import { TablePagination } from '@/components/ui/tables/table-pagination'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import ProfileHeader from './profile-header'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface StatusCounts {
  verified: number
  pending: number
  rejected: number
  unverified: number
}

export interface Pagination {
  page: number
  hasNext: boolean
  pageSize: number
  basePath: string
  initialParams: Record<string, string>
}

export interface CredentialsSection {
  rows: CredRow[]
  sort: string
  order: 'asc' | 'desc'
  pagination: Pagination
}

export interface PipelineSection {
  rows: PipeRow[]
  sort: string
  order: 'asc' | 'desc'
  pagination: Pagination
  addToPipelineForm?: React.ReactNode
}

export interface QuizAttempt {
  id: number
  quizId: number
  score: number | null
  maxScore: number | null
  createdAt: Date
}

export interface Experience {
  id: number
  title: string
  company: string | null
  type?: string | null
  link?: string | null
  status?: string | null
  createdAt: Date
}

export interface Project {
  id: number
  title: string
  link: string | null
  description: string | null
  status?: string | null
  createdAt: Date
}

export interface Socials {
  twitterUrl?: string | null
  githubUrl?: string | null
  linkedinUrl?: string | null
  websiteUrl?: string | null
}

export interface SnapshotMetrics {
  uniqueIssuers: number
  avgScore: number | null
  experienceCount: number
  projectCount: number
}

interface Props {
  candidateId: number
  name: string | null
  email: string
  avatarSrc?: string | null
  bio: string | null
  pipelineSummary?: string
  statusCounts: StatusCounts
  passes: QuizAttempt[]
  snapshot?: SnapshotMetrics
  credentials: CredentialsSection
  experiences: Experience[]
  projects: Project[]
  socials: Socials
  pipeline?: PipelineSection
  showShare?: boolean
}

/* -------------------------------------------------------------------------- */
/*                         D E F A U L T   V A L U E S                        */
/* -------------------------------------------------------------------------- */

const defaultSnapshot: SnapshotMetrics = {
  uniqueIssuers: 0,
  avgScore: null,
  experienceCount: 0,
  projectCount: 0,
}

/* -------------------------------------------------------------------------- */
/*                          U T I L I T Y   H O O K S                         */
/* -------------------------------------------------------------------------- */

function usePrettyDate(d?: Date | null) {
  return useMemo(() => {
    if (!d) return '—'
    const diff = Math.abs(Date.now() - d.getTime())
    const threeDays = 1000 * 60 * 60 * 24 * 3
    return diff < threeDays ? formatDistanceToNow(d, { addSuffix: true }) : format(d, 'PPP')
  }, [d])
}

/* -------------------------------------------------------------------------- */
/*                           H I G H L I G H T   L I S T                      */
/* -------------------------------------------------------------------------- */

function HighlightList<T>({
  title,
  icon: Icon,
  items,
  renderItem,
}: {
  title?: string
  icon: React.ElementType
  items: T[]
  renderItem: (item: T) => React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, 5)

  return (
    <div className='space-y-6'>
      {title && (
        <div className='flex items-center gap-2'>
          <Icon className='text-primary h-5 w-5' />
          <h4 className='text-lg font-semibold'>{title}</h4>
        </div>
      )}

      <div className='flex flex-col gap-4'>
        {visible.map((it, i) => (
          <div key={i}>{renderItem(it)}</div>
        ))}
      </div>

      {items.length > 5 && (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setExpanded((p) => !p)}
          className='text-primary gap-1'
        >
          {expanded ? (
            <>
              Show Less <ChevronUp className='h-4 w-4' />
            </>
          ) : (
            <>
              Show More ({items.length - 5}) <ChevronDown className='h-4 w-4' />
            </>
          )}
        </Button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              M A I N   V I E W                             */
/* -------------------------------------------------------------------------- */

export default function CandidateDetailedProfileView({
  candidateId,
  name,
  email,
  avatarSrc,
  bio,
  pipelineSummary,
  statusCounts,
  passes,
  snapshot = defaultSnapshot,
  credentials,
  experiences,
  projects,
  socials,
  pipeline,
  showShare = true,
}: Props) {
  const totalCredentials =
    statusCounts.verified + statusCounts.pending + statusCounts.rejected + statusCounts.unverified
  const profilePath = `/candidates/${candidateId}`

  const socialIcons = [
    { href: socials.twitterUrl, icon: FaTwitter, label: 'Twitter' },
    { href: socials.githubUrl, icon: SiGithub, label: 'GitHub' },
    { href: socials.linkedinUrl, icon: SiLinkedin, label: 'LinkedIn' },
    { href: socials.websiteUrl, icon: Globe2, label: 'Website' },
  ].filter((s) => !!s.href) as { href: string; icon: React.ElementType; label: string }[]

  return (
    <section className='space-y-10'>
      <ProfileHeader
        name={name}
        email={email}
        avatarSrc={avatarSrc}
        profilePath={profilePath}
        showShare={showShare}
        stats={[
          { label: 'Credentials', value: totalCredentials },
          { label: 'Skill Passes', value: passes.length },
          { label: 'Pipelines', value: pipelineSummary || '—' },
        ]}
        socials={socialIcons}
      />

      <div className='grid gap-8 lg:grid-cols-[280px_1fr]'>
        {/* SIDEBAR */}
        <aside className='space-y-8'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Download className='h-5 w-5' />
                Résumé PDF
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-muted-foreground text-sm'>
                Generate a professionally formatted résumé summarizing your profile, credentials,
                experiences, and projects.
              </p>
              <Button variant='secondary' className='w-full gap-2' asChild>
                <a href={`/api/candidates/${candidateId}/resume`} download>
                  <Download className='h-4 w-4' />
                  Download PDF
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className='sticky top-24'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <BarChart4 className='h-5 w-5' />
                Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <dt className='text-muted-foreground'>Issuers</dt>
                  <dd className='text-lg font-bold'>{snapshot.uniqueIssuers}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Avg Score</dt>
                  <dd className='text-lg font-bold'>
                    {snapshot.avgScore !== null ? `${snapshot.avgScore}%` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Experience</dt>
                  <dd className='text-lg font-bold'>{snapshot.experienceCount}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Projects</dt>
                  <dd className='text-lg font-bold'>{snapshot.projectCount}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>

        {/* MAIN */}
        <main className='space-y-12'>
          {bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='whitespace-pre-line'>{bio}</p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue='experience' className='space-y-6'>
            <TabsList className='w-full'>
              <TabsTrigger value='experience' className='gap-2'>
                <Briefcase className='h-4 w-4' />
                Experience
              </TabsTrigger>
              <TabsTrigger value='projects' className='gap-2'>
                <BookOpen className='h-4 w-4' />
                Projects
              </TabsTrigger>
            </TabsList>

            <TabsContent value='experience' className='space-y-4'>
              {experiences.length === 0 ? (
                <p className='text-muted-foreground'>No experience highlights yet.</p>
              ) : (
                <ScrollArea className='max-h-[500px] pr-3'>
                  <HighlightList
                    title='' /* omit header */
                    icon={Briefcase}
                    items={experiences}
                    renderItem={(exp) => (
                      <div className='bg-background/50 rounded-lg border p-4'>
                        <div className='flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-4'>
                          <div className='flex-1 space-y-0.5'>
                            <h5 className='flex items-center gap-2 text-base font-semibold'>
                              {exp.title}
                              {exp.link && (
                                <Link
                                  href={exp.link}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-muted-foreground hover:text-primary'
                                >
                                  <ExternalLink className='h-4 w-4' />
                                  <span className='sr-only'>View file</span>
                                </Link>
                              )}
                            </h5>
                            {exp.company && (
                              <p className='text-muted-foreground text-sm'>{exp.company}</p>
                            )}
                            {exp.type && (
                              <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                                {exp.type}
                              </p>
                            )}
                          </div>
                          <div className='flex-shrink-0 self-start sm:self-center'>
                            <StatusBadge status={(exp.status ?? 'unverified') as string} showIcon />
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value='projects' className='space-y-4'>
              {projects.length === 0 ? (
                <p className='text-muted-foreground'>No project highlights yet.</p>
              ) : (
                <ScrollArea className='max-h-[500px] pr-3'>
                  <HighlightList
                    title='' /* omit header */
                    icon={BookOpen}
                    items={projects}
                    renderItem={(proj) => (
                      <div className='bg-background/50 rounded-lg border p-4'>
                        <div className='flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-4'>
                          <div className='flex-1 space-y-0.5'>
                            <h5 className='flex items-center gap-2 text-base font-semibold'>
                              {proj.title}
                              {proj.link && (
                                <Link
                                  href={proj.link}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-muted-foreground hover:text-primary'
                                >
                                  <ExternalLink className='h-4 w-4' />
                                  <span className='sr-only'>Visit link</span>
                                </Link>
                              )}
                            </h5>
                            {proj.description && <p className='text-sm'>{proj.description}</p>}
                          </div>
                          <div className='flex-shrink-0 self-start sm:self-center'>
                            <StatusBadge
                              status={(proj.status ?? 'unverified') as string}
                              showIcon
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          <Card id='credentials'>
            <CardHeader>
              <CardTitle className='flex flex-wrap items-center gap-2'>
                Credentials
                <StatusBadge status='verified' showIcon count={statusCounts.verified} />
                <StatusBadge status='pending' showIcon count={statusCounts.pending} />
                <StatusBadge status='rejected' showIcon count={statusCounts.rejected} />
                <StatusBadge status='unverified' showIcon count={statusCounts.unverified} />
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <CredentialsTable
                rows={credentials.rows}
                sort={credentials.sort}
                order={credentials.order}
                basePath={credentials.pagination.basePath}
                initialParams={credentials.pagination.initialParams}
                searchQuery={credentials.pagination.initialParams['q'] ?? ''}
              />
              <TablePagination
                page={credentials.pagination.page}
                hasNext={credentials.pagination.hasNext}
                basePath={credentials.pagination.basePath}
                initialParams={credentials.pagination.initialParams}
                pageSize={credentials.pagination.pageSize}
              />
            </CardContent>
          </Card>

          {pipeline && (
            <Card id='pipeline-entries'>
              <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
                <CardTitle>Pipeline Entries</CardTitle>
                {pipeline.addToPipelineForm}
              </CardHeader>
              <CardContent className='space-y-4'>
                <PipelineEntriesTable
                  rows={pipeline.rows}
                  sort={pipeline.sort}
                  order={pipeline.order}
                  basePath={pipeline.pagination.basePath}
                  initialParams={pipeline.pagination.initialParams}
                  searchQuery={pipeline.pagination.initialParams['pipeQ'] ?? ''}
                />
                <TablePagination
                  page={pipeline.pagination.page}
                  hasNext={pipeline.pagination.hasNext}
                  basePath={pipeline.pagination.basePath}
                  initialParams={pipeline.pagination.initialParams}
                  pageSize={pipeline.pagination.pageSize}
                />
              </CardContent>
            </Card>
          )}

          <Card id='skill-passes'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Award className='h-5 w-5' />
                Skill Passes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {passes.length === 0 ? (
                <p className='text-muted-foreground text-sm'>No passes yet.</p>
              ) : (
                <ul className='space-y-3'>
                  {passes.map((p) => (
                    <li
                      key={p.id}
                      className='bg-muted flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2'
                    >
                      <span className='font-medium'>
                        Quiz #{p.quizId} • Score {p.score ?? '—'}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {usePrettyDate(p.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </section>
  )
}
