import { describe, expect, it } from 'vitest';

import { paginate, runPaymentsQuery, sortTransactions } from '../lib/pipeline';
import { DEFAULT_PAYMENTS_QUERY, type PaymentsQuery } from '../model/query';
import { makeTransaction } from './fixtures';

const NOW = Date.parse('2026-11-18T17:00:00.000Z');

const rows = [
  makeTransaction({ id: 'pi_3ONE', amountMinor: 1000, createdAt: '2026-11-18T16:00:00.000Z' }),
  makeTransaction({
    id: 'pi_3TWO',
    amountMinor: 500,
    currency: 'BRL',
    status: 'failed',
    declineReason: 'do_not_honor',
    createdAt: '2026-11-17T12:00:00.000Z',
    customer: { id: 'cus_2', name: 'Leo Thomas', email: 'Leo.Thomas@example.net' },
    paymentMethod: { type: 'wallet', wallet: 'apple_pay', brand: 'mastercard', last4: '0900' },
  }),
  makeTransaction({
    id: 'pi_3THREE',
    amountMinor: 1000,
    status: 'pending',
    captured: true,
    createdAt: '2026-11-01T12:00:00.000Z',
    paymentMethod: { type: 'ach', bankName: 'Chase', last4: '1821', accountType: 'checking' },
  }),
  makeTransaction({
    id: 'pi_3FOUR',
    amountMinor: 9999,
    status: 'pending',
    captured: false,
    createdAt: '2026-10-01T12:00:00.000Z',
  }),
  makeTransaction({
    id: 'pi_3FIVE',
    amountMinor: 1500,
    status: 'refunded',
    refundedAt: '2026-11-10T12:00:00.000Z',
    createdAt: '2026-11-09T12:00:00.000Z',
  }),
  makeTransaction({
    id: 'pi_3SIX',
    amountMinor: 2500,
    disputedAt: '2026-11-15T12:00:00.000Z',
    createdAt: '2026-11-11T12:00:00.000Z',
  }),
];

const run = (patch: Partial<PaymentsQuery>) =>
  runPaymentsQuery(rows, { ...DEFAULT_PAYMENTS_QUERY, ...patch }, { now: NOW });
const ids = (patch: Partial<PaymentsQuery>) => run(patch).rows.map((row) => row.id);

describe('runPaymentsQuery', () => {
  it('searches payment ID, email and last4 case-insensitively', () => {
    expect(ids({ search: 'pi_3two' })).toEqual(['pi_3TWO']);
    expect(ids({ search: '  leo.thomas@EXAMPLE ' })).toEqual(['pi_3TWO']);
    expect(ids({ search: '1821' })).toEqual(['pi_3THREE']);
    expect(ids({ search: 'nothing-matches' })).toEqual([]);
  });

  it('filters by multi-select status, method, currency and brand', () => {
    expect(ids({ statuses: ['pending', 'failed'] }).sort()).toEqual([
      'pi_3FOUR',
      'pi_3THREE',
      'pi_3TWO',
    ]);
    expect(ids({ methods: ['ach', 'wallet'] }).sort()).toEqual(['pi_3THREE', 'pi_3TWO']);
    expect(ids({ currencies: ['BRL'] })).toEqual(['pi_3TWO']);
    // ACH has no card brand and never matches a brand filter.
    expect(ids({ brands: ['mastercard'] })).toEqual(['pi_3TWO']);
  });

  it('applies status views and combines them with other filters', () => {
    expect(ids({ view: 'uncaptured' })).toEqual(['pi_3FOUR']);
    expect(ids({ view: 'disputed' })).toEqual(['pi_3SIX']);
    expect(ids({ view: 'refunded' })).toEqual(['pi_3FIVE']);
    expect(ids({ view: 'failed', currencies: ['USD'] })).toEqual([]);
  });

  it('applies inclusive amount bounds nominally', () => {
    expect(ids({ amountMinMinor: 1000, amountMaxMinor: 1500 }).sort()).toEqual([
      'pi_3FIVE',
      'pi_3ONE',
      'pi_3THREE',
    ]);
    expect(ids({ amountMinMinor: 9999 })).toEqual(['pi_3FOUR']);
  });

  it('applies date presets relative to the injected clock', () => {
    expect(ids({ date: { preset: 'today' } })).toEqual(['pi_3ONE']);
    expect(ids({ date: { preset: '7d' } })).toEqual(['pi_3ONE', 'pi_3TWO']);
    expect(ids({ date: { preset: '30d' } })).toHaveLength(5);
    expect(ids({ date: { preset: 'custom', from: '2026-11-01', to: '2026-11-01' } })).toEqual([
      'pi_3THREE',
    ]);
  });

  it('sorts by date, amount and status in both directions with deterministic ties', () => {
    expect(ids({ sortBy: 'createdAt', sortDirection: 'asc' })[0]).toBe('pi_3FOUR');
    expect(ids({ sortBy: 'amount', sortDirection: 'desc' })).toEqual([
      'pi_3FOUR',
      'pi_3SIX',
      'pi_3FIVE',
      'pi_3ONE', // tie at 1000: newest first
      'pi_3THREE',
      'pi_3TWO',
    ]);
    expect(ids({ sortBy: 'status', sortDirection: 'asc' })[0]).toBe('pi_3TWO'); // Failed
  });

  it('does not mutate the input when sorting', () => {
    const copy = [...rows];

    sortTransactions(rows, 'amount', 'asc');
    expect(rows).toEqual(copy);
  });
});

describe('paginate', () => {
  const values = Array.from({ length: 120 }, (_, index) => index);

  it('supports 25, 50 and 100 rows per page', () => {
    expect(paginate(values, 1, 25).items).toHaveLength(25);
    expect(paginate(values, 3, 50).items).toHaveLength(20);
    expect(paginate(values, 2, 100).pagination).toMatchObject({
      page: 2,
      totalPages: 2,
      firstItem: 101,
      lastItem: 120,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it('clamps out-of-range pages and unsupported sizes', () => {
    expect(paginate(values, 99, 25).pagination.page).toBe(5);
    expect(paginate(values, 0, 25).pagination.page).toBe(1);
    expect(paginate(values, 1, 10).pagination.pageSize).toBe(25);
    expect(paginate([], 3, 25).pagination).toMatchObject({
      page: 1,
      totalPages: 0,
      firstItem: 0,
      lastItem: 0,
    });
  });
});
