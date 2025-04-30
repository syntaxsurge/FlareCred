import type { JobRow } from '@/lib/types/tables'

import { getPipelinesPage } from './pipelines'

/**
 * Fetch a paginated, searchable, sortable list of public job openings
 * backed by recruiter pipelines.
 */
export async function getJobOpeningsPage(
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'recruiter' | 'createdAt' = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ jobs: JobRow[]; hasNext: boolean }> {
  /* Map UI sort key to underlying sort column */
  const mappedSort: 'name' | 'createdAt' = sortBy === 'recruiter' ? 'name' : sortBy

  const { pipelines, hasNext } = await getPipelinesPage(
    page,
    pageSize,
    mappedSort,
    order,
    searchTerm,
    undefined, // no recruiterId filter – public listing
  )

  /* Convert to JobRow shape expected by the tools/jobs page */
  const jobs: JobRow[] = pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    recruiter: p.recruiterName,
    description: p.description,
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : p.createdAt.toISOString(),
  }))

  return { jobs, hasNext }
}