'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { useId, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/cn';

import { DECLINE_REASON_LABELS } from '../lib/presentation';
import {
  clampColumnWidth,
  reorderColumns,
  setColumnWidth,
  visibleColumns,
  type ColumnConfig,
  type ColumnId,
} from '../model/columns';
import type { SortDirection, SortField } from '../model/query';
import type { Transaction } from '../model/transaction';
import {
  AmountCell,
  DateCell,
  EmptyValue,
  PaymentIdCell,
  PaymentMethodCell,
  StatusBadge,
} from './cells';
import { RowActions } from './row-actions';

const SELECTION_WIDTH = 36;
const ACTIONS_WIDTH = 44;
const RESIZE_STEP = 8;
const RESIZE_STEP_LARGE = 32;

/** Keeps header drags on the horizontal axis. */
const horizontalOnly: Modifier = ({ transform }) => ({ ...transform, y: 0 });

/** Ignore row clicks that come from an interactive child. */
const INTERACTIVE_SELECTOR =
  'a, button, input, label, [role="checkbox"], [role="menuitem"], [data-row-ignore]';

export interface PaymentsTableProps {
  readonly rows: readonly Transaction[];
  readonly columns: readonly ColumnConfig[];
  readonly sortBy: SortField;
  readonly sortDirection: SortDirection;
  readonly selectedIds: ReadonlySet<string>;
  readonly onSortChange: (sortBy: SortField, sortDirection: SortDirection) => void;
  readonly onToggleRow: (id: string, selected: boolean) => void;
  readonly onTogglePage: (selected: boolean) => void;
  readonly onColumnsChange: (columns: readonly ColumnConfig[]) => void;
  readonly onOpenPayment: (id: string) => void;
}

/**
 * Semantic payments table driven by the column model: header labels, cells,
 * widths, order, sorting, drag-to-reorder and resizing all read the same
 * configuration. Resizing keeps a draft width while dragging and commits a
 * single preference write on release.
 */
export function PaymentsTable({
  rows,
  columns,
  sortBy,
  sortDirection,
  selectedIds,
  onSortChange,
  onToggleRow,
  onTogglePage,
  onColumnsChange,
  onOpenPayment,
}: PaymentsTableProps) {
  const dndId = useId();
  const [draftWidths, setDraftWidths] = useState<Partial<Record<ColumnId, number>>>({});
  const shown = visibleColumns(columns);
  const widthOf = (column: ColumnConfig) => draftWidths[column.id] ?? column.width;
  const tableWidth =
    SELECTION_WIDTH + ACTIONS_WIDTH + shown.reduce((sum, column) => sum + widthOf(column), 0);

  const selectedOnPage = rows.filter((row) => selectedIds.has(row.id)).length;
  const pageState: boolean | 'indeterminate' =
    rows.length > 0 && selectedOnPage === rows.length
      ? true
      : selectedOnPage > 0
        ? 'indeterminate'
        : false;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    const ids = shown.map((column) => column.id);
    const reordered = arrayMove(
      ids,
      ids.indexOf(active.id as ColumnId),
      ids.indexOf(over.id as ColumnId),
    );
    // Hidden columns keep their relative place after the visible ones.
    onColumnsChange(reorderColumns(columns, reordered));
  };

  const toggleSort = (field: SortField) => {
    onSortChange(field, sortBy === field && sortDirection === 'desc' ? 'asc' : 'desc');
  };

  const commitWidth = (column: ColumnConfig, width: number) => {
    if (width !== column.width) {
      onColumnsChange(setColumnWidth(columns, column.id, width));
    }
  };

  const startResize = (event: PointerEvent<HTMLSpanElement>, column: ColumnConfig) => {
    event.preventDefault();
    event.stopPropagation();

    const handle = event.currentTarget;
    const startX = event.clientX;
    const startWidth = widthOf(column);
    let latest = startWidth;

    handle.setPointerCapture(event.pointerId);

    const onMove = (move: globalThis.PointerEvent) => {
      latest = clampColumnWidth(column, startWidth + move.clientX - startX);
      setDraftWidths((draft) => ({ ...draft, [column.id]: latest }));
    };

    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      setDraftWidths((draft) => {
        const rest = { ...draft };
        delete rest[column.id];

        return rest;
      });
      commitWidth(column, latest);
    };

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  };

  const onResizeKey = (event: KeyboardEvent<HTMLSpanElement>, column: ColumnConfig) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    event.preventDefault();
    const step = event.shiftKey ? RESIZE_STEP_LARGE : RESIZE_STEP;
    commitWidth(
      column,
      clampColumnWidth(column, column.width + (event.key === 'ArrowRight' ? step : -step)),
    );
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[horizontalOnly]}
      onDragEnd={handleDragEnd}
    >
      <div className="relative scrollbar-subtle overflow-x-auto overscroll-x-contain">
        <table
          className="table-fixed border-separate border-spacing-0 text-[14px] leading-5"
          style={{ width: tableWidth, minWidth: '100%' }}
        >
          <caption className="sr-only">
            Payments. Column headers with a sort button can be sorted; drag handles reorder columns
            and separators resize them with the arrow keys.
          </caption>
          <colgroup>
            <col style={{ width: SELECTION_WIDTH }} />
            {shown.map((column) => (
              <col key={column.id} style={{ width: widthOf(column) }} />
            ))}
            <col />
          </colgroup>
          <thead>
            <SortableContext
              items={shown.map((column) => column.id)}
              strategy={horizontalListSortingStrategy}
            >
              <tr>
                <th
                  scope="col"
                  className="h-9 border-y border-y-line-strong border-b-line bg-canvas pl-1 text-left"
                >
                  <Checkbox
                    aria-label="Select all payments on this page"
                    checked={pageState}
                    disabled={rows.length === 0}
                    onCheckedChange={(checked) => onTogglePage(checked === true)}
                  />
                </th>
                {shown.map((column) => (
                  <SortableHeader
                    key={column.id}
                    column={column}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onToggleSort={toggleSort}
                    onResizeStart={startResize}
                    onResizeKey={onResizeKey}
                    width={widthOf(column)}
                  />
                ))}
                <th
                  scope="col"
                  className="sticky right-0 z-[1] h-9 border-y border-y-line-strong border-b-line bg-canvas"
                  style={{ width: ACTIONS_WIDTH }}
                >
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </SortableContext>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = selectedIds.has(row.id);

              return (
                <tr
                  key={row.id}
                  aria-selected={selected}
                  className={cn(
                    'group/row cursor-pointer transition-colors duration-75',
                    selected ? 'bg-primary-subtle' : 'hover:bg-surface',
                  )}
                  onClick={(event) => {
                    if (!(event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) {
                      onOpenPayment(row.id);
                    }
                  }}
                >
                  <td className="h-9 border-b border-line pl-1">
                    <Checkbox
                      aria-label={`Select payment ${row.id}`}
                      checked={selected}
                      onCheckedChange={(checked) => onToggleRow(row.id, checked === true)}
                    />
                  </td>
                  {shown.map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        'h-9 overflow-hidden border-b border-line px-2 whitespace-nowrap',
                        column.align === 'right' && 'text-right',
                      )}
                    >
                      <CellContent column={column.id} transaction={row} />
                    </td>
                  ))}
                  <td
                    className={cn(
                      'sticky right-0 h-9 border-b border-line text-center shadow-[-8px_0_8px_-8px_rgb(0_0_0/0.08)]',
                      selected ? 'bg-primary-subtle' : 'bg-canvas group-hover/row:bg-surface',
                    )}
                  >
                    <RowActions transaction={row} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DndContext>
  );
}

function SortableHeader({
  column,
  width,
  sortBy,
  sortDirection,
  onToggleSort,
  onResizeStart,
  onResizeKey,
}: {
  readonly column: ColumnConfig;
  readonly width: number;
  readonly sortBy: SortField;
  readonly sortDirection: SortDirection;
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

  return (
    <th
      ref={setNodeRef}
      scope="col"
      // Announce just the label; the handles inside have their own names.
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
          <span className="truncate">{column.label}</span>
        ) : (
          <button
            type="button"
            onClick={() => column.sortField && onToggleSort(column.sortField)}
            className="relative inline-flex max-w-full min-w-0 items-center rounded-sm hover:text-primary-text"
          >
            <span className="truncate">{column.label}</span>
            {/* Out of the flow so the label keeps the full width and its edge
                stays aligned with the values (left of right-aligned labels). */}
            <SortIcon
              className={cn(
                'absolute top-1/2 size-3 -translate-y-1/2 transition-opacity',
                column.align === 'right' ? 'right-full mr-1' : 'left-full ml-1',
                active ? 'opacity-100' : 'opacity-0 group-hover/th:opacity-40',
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

function CellContent({ column, transaction }: { column: ColumnId; transaction: Transaction }) {
  switch (column) {
    case 'amount':
      return <AmountCell amountMinor={transaction.amountMinor} currency={transaction.currency} />;
    case 'status':
      return <StatusBadge status={transaction.status} />;
    case 'paymentMethod':
      return <PaymentMethodCell method={transaction.paymentMethod} />;
    case 'description':
      return <span className="block truncate text-fg">{transaction.description}</span>;
    case 'customer':
      return (
        <span className="block truncate text-fg" title={transaction.customer.email}>
          {transaction.customer.email}
        </span>
      );
    case 'paymentId':
      return <PaymentIdCell id={transaction.id} />;
    case 'created':
      return <DateCell iso={transaction.createdAt} />;
    case 'refundedDate':
      return transaction.refundedAt ? <DateCell iso={transaction.refundedAt} /> : <EmptyValue />;
    case 'declineReason':
      return transaction.declineReason ? (
        <span
          className="block truncate text-fg"
          title={DECLINE_REASON_LABELS[transaction.declineReason]}
        >
          {DECLINE_REASON_LABELS[transaction.declineReason]}
        </span>
      ) : (
        <EmptyValue />
      );
  }
}
