import { describe, expect, it } from 'vitest';

import { buildCsvFilename, buildPaymentsCsv, escapeCsvValue } from '../lib/csv';
import {
  formatAmount,
  formatFullDateTime,
  formatRelativeTime,
  formatShortDateTime,
} from '../lib/format';
import { describePaymentMethod, shortenPaymentId } from '../lib/presentation';
import {
  findSavedFilterByName,
  parseSavedFilters,
  savedFilterToQuery,
  serializeSavedFilters,
  toSavedParams,
  upsertSavedFilter,
  type SavedFilter,
} from '../lib/saved-filters';
import { buildPaymentTimeline } from '../lib/timeline';
import {
  DEFAULT_COLUMNS,
  mergeColumnPreferences,
  moveColumn,
  reorderColumns,
  setColumnVisibility,
  setColumnWidth,
  visibleColumns,
} from '../model/columns';
import { DEFAULT_PAYMENTS_QUERY } from '../model/query';
import { makeTransaction } from './fixtures';

describe('formatting', () => {
  it('formats amounts with their currency symbol', () => {
    expect(formatAmount(2198, 'USD')).toBe('$21.98');
    expect(formatAmount(9999, 'BRL')).toBe('R$ 99.99');
    expect(formatAmount(1999, 'EUR')).toBe('€19.99');
    expect(formatAmount(1599, 'GBP')).toBe('£15.99');
    expect(formatAmount(1234567, 'USD')).toBe('$12,345.67');
  });

  it('formats dates in the account time zone, not the process zone', () => {
    // The test process runs in Asia/Tokyo (see vitest.config.mts).
    expect(formatShortDateTime('2026-08-16T20:03:00.000Z')).toBe('Aug 16, 5:03 PM');
    expect(formatFullDateTime('2026-08-16T20:03:09.000Z')).toBe('Aug 16, 2026, 5:03:09 PM GMT-3');
    expect(formatShortDateTime('not-a-date')).toBe('—');
  });

  it('formats relative time against an injected clock', () => {
    const now = Date.parse('2026-11-18T15:00:00.000Z');

    expect(formatRelativeTime('2026-11-18T14:59:30.000Z', now)).toBe('just now');
    expect(formatRelativeTime('2026-11-18T12:00:00.000Z', now)).toBe('3 hours ago');
    expect(formatRelativeTime('2026-11-17T15:00:00.000Z', now)).toBe('yesterday');
    expect(formatRelativeTime('2026-11-04T15:00:00.000Z', now)).toBe('2 weeks ago');
  });

  it('abbreviates payment ids but keeps short ids intact', () => {
    expect(shortenPaymentId('pi_3QxYz8LkdIwHu7ix0bA1cD2E')).toBe('pi_3QxYz…cD2E');
    expect(shortenPaymentId('pi_short')).toBe('pi_short');
  });

  it('describes every payment method kind', () => {
    expect(describePaymentMethod(makeTransaction().paymentMethod)).toBe('Visa ending in 4242');
    expect(
      describePaymentMethod({ type: 'wallet', wallet: 'link', brand: 'mastercard', last4: '0900' }),
    ).toBe('Link with Mastercard ending in 0900');
    expect(
      describePaymentMethod({
        type: 'ach',
        bankName: 'Chase',
        last4: '1821',
        accountType: 'savings',
      }),
    ).toBe('Chase savings (ACH) ending in 1821');
  });
});

describe('columns model', () => {
  it('starts with the reference order and the six required columns visible', () => {
    expect(visibleColumns(DEFAULT_COLUMNS).map((column) => column.id)).toEqual([
      'amount',
      'status',
      'paymentMethod',
      'description',
      'customer',
      'paymentId',
      'created',
      'refundedDate',
      'declineReason',
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

describe('CSV export', () => {
  const columns = visibleColumns(DEFAULT_COLUMNS).filter((column) =>
    ['paymentId', 'amount', 'customer', 'declineReason'].includes(column.id),
  );

  it('uses the visible column order, full values and RFC 4180 formatting', () => {
    const csv = buildPaymentsCsv(
      [
        makeTransaction({ id: 'pi_3QxYz8LkdIwHu7ix0bA1cD2E' }),
        makeTransaction({ status: 'failed', declineReason: 'do_not_honor', amountMinor: 123456 }),
      ],
      columns,
    );

    expect(csv.startsWith('﻿Amount,Customer,Payment ID,Decline reason\r\n')).toBe(true);
    expect(csv).toContain('$21.98 USD,ava.king@example.com,pi_3QxYz8LkdIwHu7ix0bA1cD2E,\r\n');
    expect(csv).toContain('"$1,234.56 USD"');
    expect(csv.endsWith('Do not honor\r\n')).toBe(true);
  });

  it('escapes quotes and neutralizes spreadsheet formulas', () => {
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvValue('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(escapeCsvValue('plain')).toBe('plain');
  });

  it('builds descriptive filenames', () => {
    const date = new Date(2026, 10, 18, 9, 5);

    expect(buildCsvFilename(date, 'view')).toBe('payments-2026-11-18-0905.csv');
    expect(buildCsvFilename(date, 'selected')).toBe('payments-selected-2026-11-18-0905.csv');
  });
});

describe('saved filters', () => {
  const filter: SavedFilter = {
    id: 'f1',
    name: 'Failed this week',
    params: toSavedParams({
      ...DEFAULT_PAYMENTS_QUERY,
      view: 'failed',
      date: { preset: '7d' },
      page: 4,
    }),
    createdAt: '2026-11-18T00:00:00.000Z',
    updatedAt: '2026-11-18T00:00:00.000Z',
  };

  it('stores the query without the page and restores it through the URL parser', () => {
    expect(filter.params).toBe('view=failed&datePreset=7d');
    expect(savedFilterToQuery(filter)).toEqual({
      ...DEFAULT_PAYMENTS_QUERY,
      view: 'failed',
      date: { preset: '7d' },
    });
  });

  it('round-trips storage and ignores invalid data', () => {
    expect(parseSavedFilters(serializeSavedFilters([filter]))).toEqual([filter]);
    expect(parseSavedFilters('{oops')).toEqual([]);
    expect(parseSavedFilters(JSON.stringify({ version: 0, items: [filter] }))).toEqual([]);
    expect(parseSavedFilters(JSON.stringify({ version: 1, items: [{ id: 1 }, filter] }))).toEqual([
      filter,
    ]);
  });

  it('finds names case-insensitively and upserts by id', () => {
    expect(findSavedFilterByName([filter], '  failed THIS week ')).toBe(filter);

    const renamed = { ...filter, name: 'A first' };
    expect(upsertSavedFilter([filter], renamed)).toEqual([renamed]);
  });
});

describe('payment timeline', () => {
  it('describes a refunded payment from newest to oldest', () => {
    const events = buildPaymentTimeline(
      makeTransaction({ status: 'refunded', refundedAt: '2026-11-19T10:00:00.000Z' }),
    );

    expect(events.map((event) => event.title)).toEqual([
      'Payment refunded',
      'Payment succeeded',
      'Payment started',
    ]);
  });

  it('includes the decline reason for failed payments and authorization for uncaptured ones', () => {
    const failed = buildPaymentTimeline(
      makeTransaction({ status: 'failed', declineReason: 'expired_card' }),
    );
    const uncaptured = buildPaymentTimeline(
      makeTransaction({ status: 'pending', captured: false }),
    );

    expect(failed[0]?.description).toContain('Expired card');
    expect(uncaptured[0]?.title).toBe('Payment authorized');
  });
});
