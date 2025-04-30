import type { JobRow } from '@/lib/types/tables'

import { getPipelinesPage } from './pipelines'

/* -------------------------------------------------------------------------- */
/*                     P U B L I C   J O B   O P E N I N G S                  */
/* -------------------------------------------------------------------------- */

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
  /* --------------------------- Query execution --------------------------- */
  const mappedSort: 'name' | 'createdAt' = sortBy === 'recruiter' ? 'name' : sortBy

  const { pipelines, hasNext } = await getPipelinesPage(
    page,
    pageSize,
    mappedSort,
    order,
    searchTerm,
    undefined, // no recruiterId filter – public listing
  )

  /* ---------------------------- Normalisation ---------------------------- */
  const jobs: JobRow[] = pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    recruiter: p.recruiterName,
    description: p.description,
    // createdAt is already serialised to an ISO string by getPipelinesPage
    createdAt: p.createdAt,
  }))

  return { jobs, hasNext }
}