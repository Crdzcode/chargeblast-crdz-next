'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, GripVertical, Settings } from 'lucide-react';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/cn';

import {
  moveColumn,
  setColumnVisibility,
  sortColumns,
  type ColumnConfig,
} from '../../model/columns';
import { reorderAfterDrag, useColumnDragSensors } from '../table/column-drag';

/**
 * Show, hide and reorder columns. Drag the handle, or use the up and down
 * buttons (or Space and the arrow keys on the handle). Required columns can
 * move but can't be hidden.
 */
export function EditColumns({
  columns,
  onChange,
  onReset,
}: {
  readonly columns: readonly ColumnConfig[];
  readonly onChange: (columns: readonly ColumnConfig[]) => void;
  readonly onReset: () => void;
}) {
  const dndId = useId();
  const ordered = sortColumns(columns);
  const sensors = useColumnDragSensors();

  const handleDragEnd = (event: DragEndEvent) => {
    const reordered = reorderAfterDrag(columns, ordered, event);
    if (reordered) onChange(reordered);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>
          <Settings className="size-3.5" aria-hidden />
          Edit columns
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px]">
        <div className="flex items-center justify-between border-b border-line px-4 pt-3 pb-2.5">
          <p className="text-[14px] font-semibold">Edit columns</p>
          <button
            type="button"
            onClick={onReset}
            className="text-[13px] font-semibold text-primary-text hover:underline"
          >
            Reset
          </button>
        </div>
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ordered.map((column) => column.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col p-2" aria-label="Columns">
              {ordered.map((column, index) => (
                <ColumnRow
                  key={column.id}
                  column={column}
                  first={index === 0}
                  last={index === ordered.length - 1}
                  onToggle={(visible) => onChange(setColumnVisibility(columns, column.id, visible))}
                  onMove={(delta) => onChange(moveColumn(columns, column.id, delta))}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </PopoverContent>
    </Popover>
  );
}

function ColumnRow({
  column,
  first,
  last,
  onToggle,
  onMove,
}: {
  readonly column: ColumnConfig;
  readonly first: boolean;
  readonly last: boolean;
  readonly onToggle: (visible: boolean) => void;
  readonly onMove: (delta: number) => void;
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
  const checkboxId = useId();

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'flex h-8 items-center gap-2 rounded-control bg-canvas pr-1 pl-0.5 hover:bg-surface',
        isDragging && 'relative z-10 shadow-popover',
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Reorder ${column.label}`}
        className="inline-flex h-6 w-4 cursor-grab items-center justify-center rounded-sm text-fg-disabled hover:text-fg-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" aria-hidden />
      </button>
      <Checkbox
        id={checkboxId}
        checked={column.visible}
        disabled={column.required}
        onCheckedChange={(checked) => onToggle(checked === true)}
        className="disabled:opacity-60"
      />
      <label htmlFor={checkboxId} className="min-w-0 flex-1 truncate text-[14px]">
        {column.label}
        {column.required ? (
          <span className="ml-1.5 text-[12px] text-fg-muted">Required</span>
        ) : null}
      </label>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        disabled={first}
        aria-label={`Move ${column.label} up`}
        onClick={() => onMove(-1)}
      >
        <ChevronUp className="size-3.5" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        disabled={last}
        aria-label={`Move ${column.label} down`}
        onClick={() => onMove(1)}
      >
        <ChevronDown className="size-3.5" aria-hidden />
      </Button>
    </li>
  );
}
