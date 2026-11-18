'use client';

import { DndContext, closestCenter, type DragEndEvent, type Modifier } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useId } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/cn';

import { STATUS_LABELS } from '../lib/presentation';
import { visibleColumns, type ColumnConfig } from '../model/columns';
import { DEFAULT_PAYMENTS_QUERY, type SortDirection, type SortField } from '../model/query';
import { isSelectablePayment, type Transaction } from '../model/transaction';
import { RowActions } from './row-actions';
import { CellContent } from './table/cell-content';
import { reorderAfterDrag, useColumnDragSensors } from './table/column-drag';
import { SortableHeader } from './table/sortable-header';
import { useColumnResize } from './table/use-column-resize';

const SELECTION_WIDTH = 36;
const ACTIONS_WIDTH = 44;

/** Header drags only move sideways. */
const horizontalOnly: Modifier = ({ transform }) => ({ ...transform, y: 0 });

/** State of the select-all box for the rows on this page. */
function pageSelectionState(selected: number, selectable: number): boolean | 'indeterminate' {
  if (selectable > 0 && selected === selectable) return true;
  return selected > 0 ? 'indeterminate' : false;
}

/** Clicks on these inside a row should not open the payment. */
const INTERACTIVE_SELECTOR = 'a, button, input, label, [role="checkbox"], [role="menuitem"]';

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

/** Headers, cells, widths, order and sorting all come from the column model in model/columns.ts. */
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
  const { widthOf, startResize, resizeWithKeyboard } = useColumnResize(columns, onColumnsChange);
  const shown = visibleColumns(columns);
  const tableWidth =
    SELECTION_WIDTH + ACTIONS_WIDTH + shown.reduce((sum, column) => sum + widthOf(column), 0);
  const isDefaultSort =
    sortBy === DEFAULT_PAYMENTS_QUERY.sortBy &&
    sortDirection === DEFAULT_PAYMENTS_QUERY.sortDirection;

  const selectable = rows.filter(isSelectablePayment);
  const selectedOnPage = selectable.filter((row) => selectedIds.has(row.id)).length;
  const pageState = pageSelectionState(selectedOnPage, selectable.length);

  const sensors = useColumnDragSensors();

  const handleDragEnd = (event: DragEndEvent) => {
    const reordered = reorderAfterDrag(columns, shown, event);
    if (reordered) onColumnsChange(reordered);
  };

  const toggleSort = (field: SortField) => {
    onSortChange(field, sortBy === field && sortDirection === 'desc' ? 'asc' : 'desc');
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
                    disabled={selectable.length === 0}
                    onCheckedChange={(checked) => onTogglePage(checked === true)}
                  />
                </th>
                {shown.map((column) => (
                  <SortableHeader
                    key={column.id}
                    column={column}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    isDefaultSort={isDefaultSort}
                    onToggleSort={toggleSort}
                    onResizeStart={startResize}
                    onResizeKey={resizeWithKeyboard}
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
              const canSelect = isSelectablePayment(row);

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
                      aria-label={
                        canSelect
                          ? `Select payment ${row.id}`
                          : `${STATUS_LABELS[row.status]} payment ${row.id} cannot be selected`
                      }
                      checked={selected}
                      disabled={!canSelect}
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
