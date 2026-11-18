import { APP_TIME_ZONE } from '@/lib/time-zone';

import type { Currency } from '../model/transaction';

/** Minor-unit exponent per currency (all supported currencies use cents). */
const CURRENCY_EXPONENT: Record<Currency, number> = { USD: 2, BRL: 2, EUR: 2, GBP: 2 };

/**
 * Stripe shows each currency's symbol but one number style across the
 * dashboard, so every amount uses en-US separators: "$21.98", "R$ 99.99",
 * "€19.99", "£15.99".
 */
const currencyFormatters = new Map<Currency, Intl.NumberFormat>();

function getCurrencyFormatter(currency: Currency): Intl.NumberFormat {
  let formatter = currencyFormatters.get(currency);

  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: CURRENCY_EXPONENT[currency],
      maximumFractionDigits: CURRENCY_EXPONENT[currency],
    });
    currencyFormatters.set(currency, formatter);
  }

  return formatter;
}

export function toMajorUnits(amountMinor: number, currency: Currency): number {
  return amountMinor / 10 ** CURRENCY_EXPONENT[currency];
}

/** e.g. formatAmount(2198, 'USD') → "$21.98"; formatAmount(9999, 'BRL') → "R$ 99.99". */
export function formatAmount(amountMinor: number, currency: Currency): string {
  const formatted = getCurrencyFormatter(currency).format(toMajorUnits(amountMinor, currency));

  // Stripe puts a space after R$.
  return currency === 'BRL' ? formatted.replace(/^R\$\s?/, 'R$ ') : formatted;
}

const SHORT_DATE = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const FULL_DATE = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  timeZoneName: 'short',
});

const DAY_ONLY = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function safeDate(iso: string): Date | null {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Table format in the account time zone, e.g. "Aug 16, 5:03 PM". */
export function formatShortDateTime(iso: string): string {
  const date = safeDate(iso);

  return date ? SHORT_DATE.format(date) : '—';
}

/** Tooltip/details format, e.g. "Aug 16, 2026, 5:03:12 PM GMT-3". */
export function formatFullDateTime(iso: string): string {
  const date = safeDate(iso);

  return date ? FULL_DATE.format(date) : '—';
}

/** Formats a `YYYY-MM-DD` calendar day, e.g. "Nov 18, 2026". */
export function formatCalendarDay(value: string): string {
  const date = safeDate(`${value}T00:00:00.000Z`);

  return date ? DAY_ONLY.format(date) : value;
}

const RELATIVE = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

const RELATIVE_UNITS: readonly { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
];

/** e.g. "3 hours ago", "yesterday", "2 weeks ago"; `now` is injected for tests. */
export function formatRelativeTime(iso: string, now: number): string {
  const timestamp = Date.parse(iso);

  if (Number.isNaN(timestamp)) {
    return '—';
  }

  const elapsed = timestamp - now;

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (Math.abs(elapsed) >= ms) {
      return RELATIVE.format(Math.trunc(elapsed / ms), unit);
    }
  }

  return 'just now';
}

const COUNT = new Intl.NumberFormat('en-US');

export function formatCount(value: number): string {
  return COUNT.format(value);
}
