import type { SortField } from './query';

export type ColumnId =
  | 'amount'
  | 'status'
  | 'paymentMethod'
  | 'description'
  | 'customer'
  | 'paymentId'
  | 'created'
  | 'refundedDate'
  | 'declineReason';

/**
 * One data column. The header, cell, order, visibility, width, Edit columns and
 * the CSV all read from it. The checkbox and the row menu aren't columns.
 */
export interface ColumnConfig {
  readonly id: ColumnId;
  readonly label: string;
  readonly visible: boolean;
  readonly order: number;
  readonly width: number;
  readonly minWidth: number;
  readonly maxWidth: number;
  /** Columns the brief asks for. They can be moved but not hidden. */
  readonly required: boolean;
  readonly sortField: SortField | null;
  readonly align: 'left' | 'right';
  /**
   * No visible header text, like Stripe's status column. The label is still
   * there for screen readers and shows on hover, on focus or while the column
   * is sorted.
   */
  readonly quietHeader: boolean;
}

type ColumnDefinition = Omit<ColumnConfig, 'order'>;

/**
 * Order and widths follow the Stripe screenshot: Amount, status, Payment
 * method, Description, Customer, Date, Refunded date, Decline reason. Payment
 * ID isn't on that screen, so it goes last and the table scrolls sideways to
 * reach it.
 */
const DEFINITIONS: readonly ColumnDefinition[] = [
  {
    id: 'amount',
    label: 'Amount',
    visible: true,
    width: 114,
    minWidth: 100,
    maxWidth: 240,
    required: true,
    sortField: 'amount',
    align: 'right',
    quietHeader: false,
  },
  {
    id: 'status',
    label: 'Status',
    visible: true,
    width: 116,
    minWidth: 96,
    maxWidth: 180,
    required: true,
    sortField: 'status',
    align: 'left',
    quietHeader: true,
  },
  {
    id: 'paymentMethod',
    label: 'Payment method',
    visible: true,
    width: 140,
    minWidth: 128,
    maxWidth: 240,
    required: true,
    sortField: null,
    align: 'left',
    quietHeader: false,
  },
  {
    id: 'description',
    label: 'Description',
    visible: true,
    width: 150,
    minWidth: 110,
    maxWidth: 320,
    required: false,
    sortField: null,
    align: 'left',
    quietHeader: false,
  },
  {
    id: 'customer',
    label: 'Customer',
    visible: true,
    width: 257,
    minWidth: 150,
    maxWidth: 420,
    required: true,
    sortField: null,
    align: 'left',
    quietHeader: false,
  },
  {
    id: 'created',
    label: 'Date',
    visible: true,
    width: 131,
    minWidth: 120,
    maxWidth: 220,
    required: true,
    sortField: 'createdAt',
    align: 'left',
    quietHeader: false,
  },
  {
    id: 'refundedDate',
    label: 'Refunded date',
    visible: true,
    width: 116,
    minWidth: 100,
    maxWidth: 220,
    required: false,
    sortField: null,
    align: 'left',
    quietHeader: false,
  },
  {
    id: 'declineReason',
    label: 'Decline reason',
    visible: true,
    width: 160,
    minWidth: 120,
    maxWidth: 300,
    required: false,
    sortField: null,
    align: 'left',
    quietHeader: false,
  },
  {
    id: 'paymentId',
    label: 'Payment ID',
    visible: true,
    width: 150,
    minWidth: 140,
    maxWidth: 320,
    required: true,
    sortField: null,
    align: 'left',
    quietHeader: false,
  },
];

export const DEFAULT_COLUMNS: readonly ColumnConfig[] = DEFINITIONS.map((definition, order) => ({
  ...definition,
  order,
}));

export function clampColumnWidth(column: ColumnConfig, width: number): number {
  return Math.min(Math.max(Math.round(width), column.minWidth), column.maxWidth);
}

export function sortColumns(columns: readonly ColumnConfig[]): readonly ColumnConfig[] {
  return [...columns].sort((a, b) => a.order - b.order);
}

export function visibleColumns(columns: readonly ColumnConfig[]): readonly ColumnConfig[] {
  return sortColumns(columns).filter((column) => column.visible);
}

export interface StoredColumnPreference {
  readonly id: string;
  readonly visible?: unknown;
  readonly order?: unknown;
  readonly width?: unknown;
}

/**
 * Merges stored preferences onto the defaults: unknown ids are ignored, new
 * columns keep their defaults, widths are clamped, required columns stay
 * visible and the order is normalized to 0..n-1.
 */
export function mergeColumnPreferences(
  stored: readonly StoredColumnPreference[],
): readonly ColumnConfig[] {
  const byId = new Map(stored.map((entry) => [entry.id, entry]));

  const merged = DEFAULT_COLUMNS.map((column) => {
    const entry = byId.get(column.id);

    if (!entry) {
      return { column, userOrdered: false };
    }

    const width =
      typeof entry.width === 'number' && Number.isFinite(entry.width)
        ? clampColumnWidth(column, entry.width)
        : column.width;
    const userOrdered = typeof entry.order === 'number' && Number.isFinite(entry.order);
    const order = userOrdered ? (entry.order as number) : column.order;
    const visible =
      column.required || (typeof entry.visible === 'boolean' ? entry.visible : column.visible);

    return { column: { ...column, width, order, visible }, userOrdered };
  });

  // When two columns claim the same position, the saved one wins.
  return merged
    .sort(
      (a, b) => a.column.order - b.column.order || Number(b.userOrdered) - Number(a.userOrdered),
    )
    .map(({ column }, index) => ({ ...column, order: index }));
}

/** Applies a full id ordering; ids missing from it keep their relative order at the end. */
export function reorderColumns(
  columns: readonly ColumnConfig[],
  orderedIds: readonly ColumnId[],
): readonly ColumnConfig[] {
  const requested = orderedIds.filter((id, index) => orderedIds.indexOf(id) === index);
  const remaining = sortColumns(columns)
    .map((column) => column.id)
    .filter((id) => !requested.includes(id));
  const finalOrder = [...requested, ...remaining];

  return columns.map((column) => ({ ...column, order: finalOrder.indexOf(column.id) }));
}

/** Moves one column by `delta` positions within the full ordered list. */
export function moveColumn(
  columns: readonly ColumnConfig[],
  id: ColumnId,
  delta: number,
): readonly ColumnConfig[] {
  const ids = sortColumns(columns).map((column) => column.id);
  const from = ids.indexOf(id);
  const to = Math.min(Math.max(from + delta, 0), ids.length - 1);

  if (from === -1 || from === to) {
    return columns;
  }

  ids.splice(from, 1);
  ids.splice(to, 0, id);

  return reorderColumns(columns, ids);
}

export function setColumnVisibility(
  columns: readonly ColumnConfig[],
  id: ColumnId,
  visible: boolean,
): readonly ColumnConfig[] {
  return columns.map((column) =>
    column.id === id ? { ...column, visible: column.required || visible } : column,
  );
}

export function setColumnWidth(
  columns: readonly ColumnConfig[],
  id: ColumnId,
  width: number,
): readonly ColumnConfig[] {
  return columns.map((column) =>
    column.id === id ? { ...column, width: clampColumnWidth(column, width) } : column,
  );
}
