import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { reorderColumns, type ColumnConfig, type ColumnId } from '../../model/columns';

/** Mouse drags start after 4px so a click still sorts. Space starts a keyboard drag. */
export function useColumnDragSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

/**
 * The column list after a drag between two of the `shown` columns, or null
 * when nothing moved. Columns that aren't shown keep their relative order.
 */
export function reorderAfterDrag(
  columns: readonly ColumnConfig[],
  shown: readonly ColumnConfig[],
  { active, over }: DragEndEvent,
): readonly ColumnConfig[] | null {
  if (!over || active.id === over.id) {
    return null;
  }

  const ids = shown.map((column) => column.id);
  const from = ids.indexOf(active.id as ColumnId);
  const to = ids.indexOf(over.id as ColumnId);

  return reorderColumns(columns, arrayMove(ids, from, to));
}
