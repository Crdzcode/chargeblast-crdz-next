import { formatCalendarDate, parseCalendarDate } from '@/lib/time-zone';

import {
  DATE_PRESETS,
  DEFAULT_PAYMENTS_QUERY,
  PAGE_SIZES,
  SORT_FIELDS,
  STATUS_VIEWS,
  type DateFilter,
  type PageSize,
  type PaymentsQuery,
  type SortField,
  type StatusView,
} from '../model/query';
import {
  CARD_BRANDS,
  CURRENCIES,
  PAYMENT_METHOD_TYPES,
  PAYMENT_STATUSES,
} from '../model/transaction';

/**
 * Shareable URL format: view, q, datePreset, dateFrom, dateTo, status,
 * method, currency, brand, minAmount, maxAmount, sort, direction, page and
 * pageSize. Defaults are omitted to keep links short.
 */
export type SearchParamsInput =
  URLSearchParams | Readonly<Record<string, string | readonly string[] | undefined>>;

function reader(input: SearchParamsInput): (key: string) => string | null {
  if (input instanceof URLSearchParams) {
    return (key) => input.get(key);
  }

  return (key) => {
    const value = input[key];

    return typeof value === 'string' ? value : (value?.[0] ?? null);
  };
}

function nonEmpty(value: string | null): string | null {
  const trimmed = value?.trim() ?? '';

  return trimmed === '' ? null : trimmed;
}

function parseList<T extends string>(value: string | null, allowed: readonly T[]): readonly T[] {
  const raw = nonEmpty(value);

  if (raw === null) {
    return [];
  }

  const requested = new Set(raw.split(',').map((entry) => entry.trim()));

  // Canonical option order, duplicates and unknown values dropped.
  return allowed.filter((option) => requested.has(option));
}

function parseNonNegativeInteger(value: string | null): number | null {
  const raw = nonEmpty(value);

  if (raw === null || !/^\d+$/.test(raw)) {
    return null;
  }

  const parsed = Number(raw);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseOneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.find((option) => option === value) ?? null;
}

function parseDateFilter(read: (key: string) => string | null): DateFilter | null {
  const preset = read('datePreset');

  if (preset === 'custom') {
    const from = parseCalendarDate(read('dateFrom'));
    const to = parseCalendarDate(read('dateTo'));

    if (from === null && to === null) {
      return null;
    }

    return {
      preset: 'custom',
      from: from === null ? null : formatCalendarDate(from),
      to: to === null ? null : formatCalendarDate(to),
    };
  }

  const known = parseOneOf(preset, DATE_PRESETS);

  return known === null ? null : { preset: known };
}

/** Parses URL parameters into a complete query; invalid values fall back to defaults. */
export function parsePaymentsQuery(input: SearchParamsInput): PaymentsQuery {
  const read = reader(input);
  const defaults = DEFAULT_PAYMENTS_QUERY;
  let amountMinMinor = parseNonNegativeInteger(read('minAmount'));
  let amountMaxMinor = parseNonNegativeInteger(read('maxAmount'));

  if (amountMinMinor !== null && amountMaxMinor !== null && amountMinMinor > amountMaxMinor) {
    [amountMinMinor, amountMaxMinor] = [amountMaxMinor, amountMinMinor];
  }

  const pageSize = parseNonNegativeInteger(read('pageSize'));
  const page = parseNonNegativeInteger(read('page'));

  return {
    view: parseOneOf<StatusView>(read('view'), STATUS_VIEWS) ?? defaults.view,
    search: nonEmpty(read('q')) ?? '',
    date: parseDateFilter(read),
    statuses: parseList(read('status'), PAYMENT_STATUSES),
    methods: parseList(read('method'), PAYMENT_METHOD_TYPES),
    currencies: parseList(read('currency'), CURRENCIES),
    brands: parseList(read('brand'), CARD_BRANDS),
    amountMinMinor,
    amountMaxMinor,
    sortBy: parseOneOf<SortField>(read('sort'), SORT_FIELDS) ?? defaults.sortBy,
    sortDirection:
      read('direction') === 'asc' || read('direction') === 'desc'
        ? (read('direction') as 'asc' | 'desc')
        : defaults.sortDirection,
    page: page !== null && page >= 1 ? page : defaults.page,
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize ?? -1)
      ? (pageSize as PageSize)
      : defaults.pageSize,
  };
}

/** Serializes a query into stable, minimal URL parameters. */
export function serializePaymentsQuery(query: PaymentsQuery): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = DEFAULT_PAYMENTS_QUERY;

  if (query.view !== defaults.view) params.set('view', query.view);
  if (query.search.trim() !== '') params.set('q', query.search.trim());

  if (query.date !== null) {
    params.set('datePreset', query.date.preset);

    if (query.date.preset === 'custom') {
      if (query.date.from !== null) params.set('dateFrom', query.date.from);
      if (query.date.to !== null) params.set('dateTo', query.date.to);
    }
  }

  if (query.statuses.length > 0) params.set('status', query.statuses.join(','));
  if (query.methods.length > 0) params.set('method', query.methods.join(','));
  if (query.currencies.length > 0) params.set('currency', query.currencies.join(','));
  if (query.brands.length > 0) params.set('brand', query.brands.join(','));
  if (query.amountMinMinor !== null) params.set('minAmount', String(query.amountMinMinor));
  if (query.amountMaxMinor !== null) params.set('maxAmount', String(query.amountMaxMinor));
  if (query.sortBy !== defaults.sortBy) params.set('sort', query.sortBy);
  if (query.sortDirection !== defaults.sortDirection) params.set('direction', query.sortDirection);
  if (query.page !== defaults.page) params.set('page', String(query.page));
  if (query.pageSize !== defaults.pageSize) params.set('pageSize', String(query.pageSize));

  return params;
}

export function toQueryString(query: PaymentsQuery): string {
  const serialized = serializePaymentsQuery(query).toString();

  return serialized === '' ? '' : `?${serialized}`;
}
