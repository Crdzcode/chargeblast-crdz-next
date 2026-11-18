import { describe, expect, it } from 'vitest';

import { resolveDateFilter } from '../lib/date-range';

const iso = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString());

// 2026-11-18 14:05 in São Paulo (UTC-3).
const NOW = Date.parse('2026-11-18T17:05:00.000Z');

describe('resolveDateFilter', () => {
  it('returns null when no filter is active', () => {
    expect(resolveDateFilter(null, NOW)).toBeNull();
  });

  it('resolves Today to the whole current day, inclusive', () => {
    const range = resolveDateFilter({ preset: 'today' }, NOW);

    expect(iso(range?.from ?? null)).toBe('2026-11-18T03:00:00.000Z');
    expect(iso(range?.to ?? null)).toBe('2026-11-19T02:59:59.999Z');
  });

  it('resolves 7 days as today plus the previous six days', () => {
    const range = resolveDateFilter({ preset: '7d' }, NOW);

    expect(iso(range?.from ?? null)).toBe('2026-11-12T03:00:00.000Z');
    expect(iso(range?.to ?? null)).toBe('2026-11-19T02:59:59.999Z');
  });

  it('resolves 30 days as today plus the previous twenty-nine days', () => {
    const range = resolveDateFilter({ preset: '30d' }, NOW);

    expect(iso(range?.from ?? null)).toBe('2026-10-20T03:00:00.000Z');
  });

  it('uses the account day late in the evening (UTC already on the next day)', () => {
    const lateEvening = Date.parse('2026-11-19T02:30:00.000Z'); // 23:30 on Nov 18 in São Paulo
    const range = resolveDateFilter({ preset: 'today' }, lateEvening);

    expect(iso(range?.from ?? null)).toBe('2026-11-18T03:00:00.000Z');
  });

  it('resolves custom ranges with inclusive calendar days and open ends', () => {
    expect(
      resolveDateFilter({ preset: 'custom', from: '2026-11-01', to: '2026-11-03' }, NOW),
    ).toEqual({
      from: Date.parse('2026-11-01T03:00:00.000Z'),
      to: Date.parse('2026-11-04T02:59:59.999Z'),
    });
    expect(resolveDateFilter({ preset: 'custom', from: '2026-11-01', to: null }, NOW)).toEqual({
      from: Date.parse('2026-11-01T03:00:00.000Z'),
      to: null,
    });
    expect(resolveDateFilter({ preset: 'custom', from: null, to: null }, NOW)).toBeNull();
  });
});
