'use client'

import * as React from 'react'
import { Loader2, MoreHorizontal, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** Action descriptor used by the row-level dropdown. */
export interface TableRowAction<Row> {
  label: string
  icon: LucideIcon
  /** Click handler (ignored when `href` is supplied) */
  onClick?: (row: Row) => void | Promise<void>
  /** Optional external link rendered as <a>. */
  href?: string
  /** Visual variant – destructive actions get red styling. */
  variant?: 'default' | 'destructive'
  /** Disable predicate evaluated per-row. */
  disabled?: (row: Row) => boolean
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

interface Props<Row> {
  row: Row
  actions: TableRowAction<Row>[]
}

export function TableRowActions<Row>({ row, actions }: Props<Row>) {
  const [isPending, startTransition] = React.useTransition()

  /* -------------------------- Render helpers ----------------------------- */
  function renderAction(act: TableRowAction<Row>) {
    const Icon = act.icon
    const isDisabled = isPending || (act.disabled ? act.disabled(row) : false)
    const baseClass = cn(
      'cursor-pointer',
      act.variant === 'destructive' &&
        'font-semibold text-rose-600 hover:bg-rose-500/10 focus:bg-rose-500/10 dark:text-rose-400',
      isDisabled && 'cursor-not-allowed opacity-50',
    )

    /* Link action --------------------------------------------------------- */
    if (act.href) {
      return (
        <DropdownMenuItem key={act.label} asChild disabled={isDisabled}>
          <a
            href={act.href}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center'
          >
            <Icon className='mr-2 h-4 w-4' />
            {act.label}
          </a>
        </DropdownMenuItem>
      )
    }

    /* Click action -------------------------------------------------------- */
    return (
      <DropdownMenuItem
        key={act.label}
        onClick={() =>
          !isDisabled &&
          startTransition(async () => {
            await act.onClick?.(row)
          })
        }
        disabled={isDisabled}
        className={baseClass}
      >
        <Icon className='mr-2 h-4 w-4' />
        {act.label}
      </DropdownMenuItem>
    )
  }

  /* ------------------------------- UI ------------------------------------ */
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0' disabled={isPending}>
          {isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <MoreHorizontal className='h-4 w-4' />
          )}
          <span className='sr-only'>Open row menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='rounded-md p-1 shadow-lg'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map(renderAction)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}