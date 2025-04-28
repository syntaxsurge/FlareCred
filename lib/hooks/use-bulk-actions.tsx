'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'

import { type BulkAction } from '@/components/ui/tables/data-table'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * Lightweight config describing a bulk-selection action.
 * The hook automatically wraps the `handler` inside a React Transition so tables
 * no longer need to re-implement `useTransition` boilerplate or manage
 * disabled-state logic for long-running tasks.
 */
export interface BulkActionConfig<Row extends Record<string, any>> {
  label: string
  icon: LucideIcon
  variant?: 'default' | 'destructive' | 'outline'
  /** Async/Sync task that operates on the selected row set. */
  handler: (rows: Row[]) => Promise<void> | void
  /** Optional visibility predicate – hide when it returns false. */
  isAvailable?: (rows: Row[]) => boolean
  /** Extra disabled predicate in addition to the intrinsic pending flag. */
  isDisabled?: (rows: Row[]) => boolean
}

/* -------------------------------------------------------------------------- */
/*                                   Hook                                     */
/* -------------------------------------------------------------------------- */

/**
 * Converts an array of {@link BulkActionConfig}s into DataTable-compatible
 * {@link BulkAction}s with a shared pending state and automatic disabling.
 *
 * ```ts
 * const bulkActions = useBulkActions<RowType>([
 *   {
 *     label: 'Delete',
 *     icon: Trash2,
 *     variant: 'destructive',
 *     handler: async rows => {
 *       await Promise.all(rows.map(r => deleteFn(r.id)))
 *       router.refresh()
 *     },
 *   },
 *   // more actions…
 * ])
 * ```
 */
export function useBulkActions<Row extends Record<string, any>>(
  configs: BulkActionConfig<Row>[],
): BulkAction<Row>[] {
  const [isPending, startTransition] = React.useTransition()

  /* Memoise the mapped actions to avoid recreating objects on each render. */
  return React.useMemo<BulkAction<Row>[]>(() => {
    return configs.map((cfg) => ({
      label: cfg.label,
      icon: cfg.icon,
      variant: cfg.variant,
      isAvailable: cfg.isAvailable,
      /* Wrap the caller-supplied handler inside a transition. */
      onClick: (rows) => startTransition(async () => cfg.handler(rows)),
      /* Disable while pending or when the caller predicate returns true. */
      isDisabled: (rows) =>
        isPending || (cfg.isDisabled ? cfg.isDisabled(rows) : false),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(configs), isPending])
}