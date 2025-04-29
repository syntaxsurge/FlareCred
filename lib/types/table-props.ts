export interface TableProps<T extends Record<string, any>> {
  /** Row data slice for the current page */
  rows: T[]
  /** Current sort column key */
  sort: string
  /** Current sort order */
  order: 'asc' | 'desc'
  /** Base pathname used in navigation helpers */
  basePath: string
  /** Query-string params that persist across navigations */
  initialParams: Record<string, string>
  /** Current search term */
  searchQuery: string
  /**
   * Whether the current viewer is the team owner – used by members tables
   * to enable privileged actions like role updates and removals.
   * Optional so other table views do not need to redeclare a custom props
   * interface just to add this single flag.
   */
  isOwner?: boolean
}
