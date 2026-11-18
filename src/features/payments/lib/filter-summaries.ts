import { DATE_PRESET_LABELS } from './date-range';
import { formatAmount, formatCalendarDay } from './format';
import type { DateFilter } from '../model/query';
import type { Currency } from '../model/transaction';

/** "Failed", "Failed +2" or null when nothing is selected. */
export function summarizeList<T extends string>(
  values: readonly T[],
  labels: Readonly<Record<T, string>>,
): string | null {
  const [first] = values;

  if (first === undefined) {
    return null;
  }

  return values.length > 1 ? `${labels[first]} +${values.length - 1}` : labels[first];
}

export function summarizeDate(filter: DateFilter | null): string | null {
  if (filter === null) {
    return null;
  }

  if (filter.preset !== 'custom') {
    return DATE_PRESET_LABELS[filter.preset];
  }

  if (filter.from && filter.to) {
    return filter.from === filter.to
      ? formatCalendarDay(filter.from)
      : `${formatCalendarDay(filter.from)} – ${formatCalendarDay(filter.to)}`;
  }

  if (filter.from) {
    return `On or after ${formatCalendarDay(filter.from)}`;
  }

  return filter.to ? `On or before ${formatCalendarDay(filter.to)}` : null;
}

/**
 * Amount summary with inclusive bounds. The currency symbol is shown only
 * when exactly one currency is filtered; otherwise values are plain numbers
 * because the comparison is nominal across currencies.
 */
export function summarizeAmount(
  min: number | null,
  max: number | null,
  currencies: readonly Currency[],
): string | null {
  const [only] = currencies.length === 1 ? currencies : [];
  const format = (minor: number) => (only ? formatAmount(minor, only) : (minor / 100).toFixed(2));

  if (min !== null && max !== null) {
    return min === max ? `= ${format(min)}` : `${format(min)} – ${format(max)}`;
  }

  if (min !== null) {
    return `≥ ${format(min)}`;
  }

  return max !== null ? `≤ ${format(max)}` : null;
}
