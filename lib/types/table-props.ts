/**
 * Generic props passed to all DataTable-based components.
 * Centralising this interface removes repetition across table views.
 */

export interface TableProps<T extends Record<string, any>> {
  rows: T[]
  sort: string
  order: 'asc' | 'desc'
  basePath: string
  initialParams: Record<string, string>
  searchQuery: string
}