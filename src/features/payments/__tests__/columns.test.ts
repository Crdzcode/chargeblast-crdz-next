import { describe, expect, it } from 'vitest';

import {
  DEFAULT_COLUMNS,
  mergeColumnPreferences,
  moveColumn,
  reorderColumns,
  setColumnVisibility,
  setColumnWidth,
  visibleColumns,
} from '../model/columns';

describe('columns model', () => {
  it('starts in the Stripe column order with the six required columns', () => {
    expect(visibleColumns(DEFAULT_COLUMNS).map((column) => column.id)).toEqual([
      'amount',
      'status',
      'paymentMethod',
      'description',
      'customer',
      'created',
      'refundedDate',
      'declineReason',
      'paymentId',
    ]);
    expect(
      DEFAULT_COLUMNS.filter((column) => column.required)
        .map((column) => column.id)
        .sort(),
    ).toEqual(['amount', 'created', 'customer', 'paymentId', 'paymentMethod', 'status']);
  });

  it('merges stored preferences safely', () => {
    const merged = mergeColumnPreferences([
      { id: 'paymentId', visible: false, order: 0, width: 9999 },
      { id: 'description', visible: false },
      { id: 'unknown', visible: true },
      { id: 'customer', width: 'wide' },
    ]);
    const byId = new Map(merged.map((column) => [column.id, column]));

    expect(byId.get('paymentId')).toMatchObject({ visible: true, width: 320 });
    expect(byId.get('description')?.visible).toBe(false);
    expect(byId.get('customer')?.width).toBe(257);
    expect(merged.map((column) => column.order)).toEqual(merged.map((_, index) => index));
  });

  it('reorders, moves, hides and resizes columns', () => {
    const reordered = reorderColumns(DEFAULT_COLUMNS, ['created', 'amount']);
    expect(
      visibleColumns(reordered)
        .slice(0, 3)
        .map((column) => column.id),
    ).toEqual(['created', 'amount', 'status']);

    const moved = moveColumn(DEFAULT_COLUMNS, 'status', -1);
    expect(visibleColumns(moved)[0]?.id).toBe('status');

    expect(
      setColumnVisibility(DEFAULT_COLUMNS, 'customer', false).find((c) => c.id === 'customer')
        ?.visible,
    ).toBe(true);
    expect(
      setColumnVisibility(DEFAULT_COLUMNS, 'description', false).find((c) => c.id === 'description')
        ?.visible,
    ).toBe(false);
    expect(
      setColumnWidth(DEFAULT_COLUMNS, 'amount', 10).find((c) => c.id === 'amount')?.width,
    ).toBe(100);
  });
});
