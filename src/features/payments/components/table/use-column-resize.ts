'use client';

import { useState, type KeyboardEvent, type PointerEvent } from 'react';

import {
  clampColumnWidth,
  setColumnWidth,
  type ColumnConfig,
  type ColumnId,
} from '../../model/columns';

const RESIZE_STEP = 8;
const RESIZE_STEP_LARGE = 32;

/**
 * Column resizing with the pointer (a draft width while dragging, one
 * preference write on release) or the arrow keys (Shift for larger steps).
 */
export function useColumnResize(
  columns: readonly ColumnConfig[],
  onColumnsChange: (columns: readonly ColumnConfig[]) => void,
) {
  const [draftWidths, setDraftWidths] = useState<Partial<Record<ColumnId, number>>>({});
  const widthOf = (column: ColumnConfig) => draftWidths[column.id] ?? column.width;

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

  const resizeWithKeyboard = (event: KeyboardEvent<HTMLSpanElement>, column: ColumnConfig) => {
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

  return { widthOf, startResize, resizeWithKeyboard };
}
