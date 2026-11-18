/*
 * Time zone helpers on top of Intl, no date library.
 *
 * Like Stripe, the dashboard shows every date in the account's time zone
 * rather than the machine's. Server and browser therefore format dates and
 * resolve ranges the same way, and hydration matches.
 */

export const APP_TIME_ZONE = 'America/Sao_Paulo';

/**
 * For UI copy; change it together with APP_TIME_ZONE. Brazil dropped daylight
 * saving in 2019, so the offset is fixed.
 */
export const APP_TIME_ZONE_LABEL = 'GMT-3';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** A calendar day in a given zone; month is 1-based. */
export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

interface ZonedDateTime extends CalendarDate {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatters.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    partsFormatters.set(timeZone, formatter);
  }

  return formatter;
}

/** Wall-clock fields of an instant as seen in `timeZone`. */
export function getZonedDateTime(instant: number, timeZone: string = APP_TIME_ZONE): ZonedDateTime {
  const values: Record<string, number> = {};

  for (const part of getPartsFormatter(timeZone).formatToParts(instant)) {
    if (part.type !== 'literal') {
      values[part.type] = Number(part.value);
    }
  }

  return {
    year: values['year'] ?? 1970,
    month: values['month'] ?? 1,
    day: values['day'] ?? 1,
    hour: values['hour'] ?? 0,
    minute: values['minute'] ?? 0,
    second: values['second'] ?? 0,
  };
}

/** Offset (ms) between the zone's wall clock and UTC at a given instant. */
export function getTimeZoneOffsetMs(instant: number, timeZone: string = APP_TIME_ZONE): number {
  const zoned = getZonedDateTime(instant, timeZone);
  const wallClockAsUtc = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second,
  );
  const instantWithoutMs = instant - (((instant % 1000) + 1000) % 1000);

  return wallClockAsUtc - instantWithoutMs;
}

/**
 * Converts a wall-clock time in `timeZone` to a UTC instant. The second pass
 * corrects the offset around DST transitions.
 */
export function zonedDateTimeToInstant(
  date: CalendarDate & { hour?: number; minute?: number; second?: number; millisecond?: number },
  timeZone: string = APP_TIME_ZONE,
): number {
  const utcGuess = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    date.hour ?? 0,
    date.minute ?? 0,
    date.second ?? 0,
    date.millisecond ?? 0,
  );
  const firstOffset = getTimeZoneOffsetMs(utcGuess, timeZone);
  const candidate = utcGuess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(candidate, timeZone);

  return secondOffset === firstOffset ? candidate : utcGuess - secondOffset;
}

export function toCalendarDate(instant: number, timeZone: string = APP_TIME_ZONE): CalendarDate {
  const { year, month, day } = getZonedDateTime(instant, timeZone);

  return { year, month, day };
}

/** Calendar arithmetic, independent of any time zone. */
export function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** First millisecond of a calendar day in `timeZone`. */
export function startOfZonedDay(date: CalendarDate, timeZone: string = APP_TIME_ZONE): number {
  return zonedDateTimeToInstant(date, timeZone);
}

/** Last millisecond of a calendar day in `timeZone` (inclusive boundary). */
export function endOfZonedDay(date: CalendarDate, timeZone: string = APP_TIME_ZONE): number {
  return startOfZonedDay(addCalendarDays(date, 1), timeZone) - 1;
}

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

/** Serializes a calendar date as `YYYY-MM-DD`. */
export function formatCalendarDate(date: CalendarDate): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

/**
 * Parses `YYYY-MM-DD` (any trailing time part is ignored, so full ISO
 * timestamps are accepted too). Impossible dates such as 2026-02-31 return null.
 */
export function parseCalendarDate(value: string | null | undefined): CalendarDate | null {
  if (!value) {
    return null;
  }

  const match = CALENDAR_DATE_PATTERN.exec(value.trim());

  if (!match) {
    return null;
  }

  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const check = new Date(Date.UTC(date.year, date.month - 1, date.day));

  if (
    check.getUTCFullYear() !== date.year ||
    check.getUTCMonth() + 1 !== date.month ||
    check.getUTCDate() !== date.day
  ) {
    return null;
  }

  return date;
}
