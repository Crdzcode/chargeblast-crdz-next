import { describe, expect, it } from 'vitest';

import { parsePaymentsQuery, serializePaymentsQuery, toQueryString } from '../lib/query-url';
import { DEFAULT_PAYMENTS_QUERY, type PaymentsQuery } from '../model/query';

describe('payments query URL', () => {
  it('omits defaults', () => {
    expect(toQueryString(DEFAULT_PAYMENTS_QUERY)).toBe('');
  });

  it('round-trips every supported field', () => {
    const query: PaymentsQuery = {
      view: 'failed',
      search: 'ava@example.com',
      date: { preset: 'custom', from: '2026-11-01', to: '2026-11-15' },
      statuses: ['succeeded', 'refunded'],
      methods: ['card', 'wallet'],
      currencies: ['USD', 'GBP'],
      brands: ['visa'],
      amountMinMinor: 1000,
      amountMaxMinor: 5000,
      sortBy: 'amount',
      sortDirection: 'asc',
      page: 3,
      pageSize: 100,
    };

    expect(parsePaymentsQuery(serializePaymentsQuery(query))).toEqual(query);
  });

  it('keeps presets relative instead of freezing their dates', () => {
    const params = serializePaymentsQuery({ ...DEFAULT_PAYMENTS_QUERY, date: { preset: '7d' } });

    expect(params.toString()).toBe('datePreset=7d');
  });

  it('falls back to defaults for invalid values instead of failing', () => {
    const query = parsePaymentsQuery(
      new URLSearchParams(
        'view=bogus&status=failed,unknown,failed&method=crypto&pageSize=10&page=-2&sort=name&direction=up&minAmount=abc&datePreset=custom&dateFrom=2026-02-31',
      ),
    );

    expect(query).toEqual({ ...DEFAULT_PAYMENTS_QUERY, statuses: ['failed'] });
  });

  it('accepts full ISO timestamps as custom boundaries', () => {
    const query = parsePaymentsQuery({
      datePreset: 'custom',
      dateFrom: '2026-07-01T00:00:00.000Z',
      dateTo: '2026-07-15T23:59:59.999Z',
    });

    expect(query.date).toEqual({ preset: 'custom', from: '2026-07-01', to: '2026-07-15' });
  });

  it('swaps an inverted amount range and reads Next.js search param records', () => {
    const query = parsePaymentsQuery({
      minAmount: '900',
      maxAmount: '100',
      status: ['pending', 'failed'],
    });

    expect(query.amountMinMinor).toBe(100);
    expect(query.amountMaxMinor).toBe(900);
    expect(query.statuses).toEqual(['pending']);
  });
});
