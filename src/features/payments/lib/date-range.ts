import {
  APP_TIME_ZONE,
  addCalendarDays,
  endOfZonedDay,
  parseCalendarDate,
  startOfZonedDay,
  toCalendarDate,
} from '@/lib/time-zone';

import type { DateFilter, DatePreset } from '../model/query';

export interface InstantRange {
  /** Inclusive bounds in epoch ms; null leaves that side open. */
  readonly from: number | null;
  readonly to: number | null;
}

/** Number of calendar days before today included by each preset. */
const PRESET_DAYS_BACK: Record<DatePreset, number> = {
  today: 0,
  '7d': 6,
  '30d': 29,
};

export const DATE_PRESET_LABELS: Record<DatePreset | 'custom', string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  custom: 'Custom',
};

/**
 * Resolves a date filter into inclusive instants using calendar days in the
 * account time zone:
 * - Today: 00:00:00.000 → 23:59:59.999 of the current day.
 * - 7 days: today plus the previous six days; 30 days: plus twenty-nine.
 * - Custom: start of `from` → end of `to`; either side may be open.
 *
 * `now` is injected so server, client and tests resolve identically.
 */
export function resolveDateFilter(
  filter: DateFilter | null,
  now: number,
  timeZone: string = APP_TIME_ZONE,
): InstantRange | null {
  if (filter === null) {
    return null;
  }

  if (filter.preset === 'custom') {
    const from = parseCalendarDate(filter.from);
    const to = parseCalendarDate(filter.to);

    if (from === null && to === null) {
      return null;
    }

    return {
      from: from === null ? null : startOfZonedDay(from, timeZone),
      to: to === null ? null : endOfZonedDay(to, timeZone),
    };
  }

  const today = toCalendarDate(now, timeZone);

  return {
    from: startOfZonedDay(addCalendarDays(today, -PRESET_DAYS_BACK[filter.preset]), timeZone),
    to: endOfZonedDay(today, timeZone),
  };
}
