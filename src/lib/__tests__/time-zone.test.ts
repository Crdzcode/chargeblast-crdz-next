import { describe, expect, it } from 'vitest';

import {
  addCalendarDays,
  endOfZonedDay,
  getTimeZoneOffsetMs,
  parseCalendarDate,
  startOfZonedDay,
  toCalendarDate,
} from '../time-zone';

describe('time-zone helpers', () => {
  it('resolves São Paulo midnight to 03:00 UTC (UTC-3, no DST)', () => {
    const start = startOfZonedDay({ year: 2026, month: 11, day: 18 }, 'America/Sao_Paulo');

    expect(new Date(start).toISOString()).toBe('2026-11-18T03:00:00.000Z');
    expect(
      new Date(
        endOfZonedDay({ year: 2026, month: 11, day: 18 }, 'America/Sao_Paulo'),
      ).toISOString(),
    ).toBe('2026-11-19T02:59:59.999Z');
  });

  it('uses the zone calendar day, not the UTC day', () => {
    // 01:30 UTC on Nov 19 is still Nov 18 in São Paulo.
    expect(toCalendarDate(Date.parse('2026-11-19T01:30:00Z'), 'America/Sao_Paulo')).toEqual({
      year: 2026,
      month: 11,
      day: 18,
    });
  });

  it('handles DST transitions (23-hour and 25-hour days)', () => {
    const springForward = { year: 2026, month: 3, day: 8 };
    const fallBack = { year: 2026, month: 11, day: 1 };
    const zone = 'America/New_York';
    const hours = (date: typeof springForward) =>
      (endOfZonedDay(date, zone) + 1 - startOfZonedDay(date, zone)) / 3_600_000;

    expect(hours(springForward)).toBe(23);
    expect(hours(fallBack)).toBe(25);
    expect(getTimeZoneOffsetMs(Date.parse('2026-07-01T12:00:00Z'), zone)).toBe(-4 * 3_600_000);
  });

  it('adds calendar days across month and year boundaries', () => {
    expect(addCalendarDays({ year: 2026, month: 1, day: 1 }, -1)).toEqual({
      year: 2025,
      month: 12,
      day: 31,
    });
    expect(addCalendarDays({ year: 2026, month: 2, day: 28 }, 1)).toEqual({
      year: 2026,
      month: 3,
      day: 1,
    });
  });

  it('parses only real calendar dates', () => {
    expect(parseCalendarDate('2026-11-18')).toEqual({ year: 2026, month: 11, day: 18 });
    expect(parseCalendarDate('2026-11-18T03:00:00.000Z')).toEqual({
      year: 2026,
      month: 11,
      day: 18,
    });
    expect(parseCalendarDate('2026-02-31')).toBeNull();
    expect(parseCalendarDate('18/11/2026')).toBeNull();
    expect(parseCalendarDate('')).toBeNull();
    expect(parseCalendarDate(null)).toBeNull();
  });
});
