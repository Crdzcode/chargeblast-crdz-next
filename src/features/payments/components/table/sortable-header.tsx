'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';

import { cn } from '@/lib/cn';

import type { ColumnConfig } from '../../model/columns';
import type { SortDirection, SortField } from '../../model/query';

const REVEAL_ON_HOVER = 'opacity-0 group-focus-within/th:opacity-100 group-hover/th:opacity-100';

/**
 * Column header with a sort button, a drag handle and a resize handle. Like
 * Stripe, the default sort (newest first) only shows its arrow on hover or
 * focus, and a quiet header (Status) only shows its label then.
 */
export function SortableHeader({
  column,
  width,
  sortBy,
  sortDirection,
  isDefaultSort,
  onToggleSort,
  onResizeStart,
  onResizeKey,
}: {
  readonly column: ColumnConfig;
  readonly width: number;
  readonly sortBy: SortField;
  readonly sortDirection: SortDirection;
  readonly isDefaultSort: boolean;
  readonly onToggleSort: (field: SortField) => void;
  readonly onResizeStart: (event: PointerEvent<HTMLSpanElement>, column: ColumnConfig) => void;
  readonly onResizeKey: (event: KeyboardEvent<HTMLSpanElement>, column: ColumnConfig) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });
  const active = column.sortField !== null && column.sortField === sortBy;
  const ariaSort = active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined;
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    width,
  };
  const SortIcon = active && sortDirection === 'asc' ? ArrowUp : ArrowDown;
  const labelClassName = cn('truncate', column.quietHeader && !active && REVEAL_ON_HOVER);
  // Inactive columns hint at sorting on hover. The default sort (newest
  // first) only shows its arrow on hover too; any other sort shows it always.
  let iconVisibility = 'opacity-0 group-hover/th:opacity-40';
  if (active) iconVisibility = isDefaultSort ? REVEAL_ON_HOVER : 'opacity-100';

  return (
    <th
      ref={setNodeRef}
      scope="col"
      // Screen readers get the plain label; the handles inside have their own
      // names.
      aria-label={column.label}
      aria-sort={ariaSort}
      style={style}
      className={cn(
        'group/th relative h-9 border-y border-y-line-strong border-b-line bg-canvas px-2 text-[13px] font-semibold whitespace-nowrap text-fg',
        column.align === 'right' ? 'text-right' : 'text-left',
        isDragging && 'z-10 shadow-popover',
      )}
    >
      <span
        className={cn(
          'flex min-w-0 items-center gap-0.5',
          column.align === 'right' && 'justify-end',
          // Lines the label up with the amount instead of the currency code beside it.
          column.id === 'amount' && 'pr-10',
        )}
      >
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Reorder ${column.label} column`}
          className="absolute top-1/2 left-0 inline-flex h-5 w-2.5 -translate-y-1/2 cursor-grab items-center justify-center rounded-sm text-fg-disabled opacity-0 transition-opacity group-hover/th:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3" aria-hidden />
        </button>
        {column.sortField === null ? (
          <span className={labelClassName}>{column.label}</span>
        ) : (
          <button
            type="button"
            onClick={() => column.sortField && onToggleSort(column.sortField)}
            className="relative inline-flex max-w-full min-w-0 items-center rounded-sm hover:text-primary-text"
          >
            <span className={labelClassName}>{column.label}</span>
            {/* Positioned outside the label so right-aligned labels still line
                up with their values. */}
            <SortIcon
              className={cn(
                'absolute top-1/2 size-3 -translate-y-1/2 transition-opacity',
                column.align === 'right' ? 'right-full mr-1' : 'left-full ml-1',
                iconVisibility,
              )}
              aria-hidden
            />
          </button>
        )}
      </span>
      <span
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${column.label} column`}
        aria-valuenow={width}
        aria-valuemin={column.minWidth}
        aria-valuemax={column.maxWidth}
        tabIndex={0}
        onPointerDown={(event) => onResizeStart(event, column)}
        onKeyDown={(event) => onResizeKey(event, column)}
        className="absolute top-0 -right-[3px] z-[2] h-full w-[7px] cursor-col-resize touch-none after:absolute after:top-1/4 after:right-[3px] after:h-1/2 after:w-px after:bg-transparent group-hover/th:after:bg-line-strong hover:after:w-0.5 hover:after:bg-primary focus-visible:after:w-0.5 focus-visible:after:bg-primary"
      />
    </th>
  );
}
