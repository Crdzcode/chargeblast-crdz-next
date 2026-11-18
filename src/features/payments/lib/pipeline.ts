import { APP_TIME_ZONE } from '@/lib/time-zone';

import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  matchesStatusView,
  type PaymentsQuery,
  type SortDirection,
  type SortField,
} from '../model/query';
import type { Transaction } from '../model/transaction';
import { resolveDateFilter } from './date-range';
import { STATUS_LABELS } from './presentation';

export interface Pagination {
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
  /** 1-based index of the first and last row on the page (0 when empty). */
  readonly firstItem: number;
  readonly lastItem: number;
}

export interface PaymentsResult {
  /** Every matching row in display order (used by "Export current view"). */
  readonly rows: readonly Transaction[];
  /** The rows of the current page. */
  readonly pageRows: readonly Transaction[];
  readonly pagination: Pagination;
}

export interface PipelineContext {
  /** Reference instant used to resolve relative date presets. */
  readonly now: number;
  readonly timeZone?: string;
}

/** Case-insensitive match on payment ID, customer email or last 4 digits. */
export function matchesSearch(transaction: Transaction, search: string): boolean {
  const term = search.trim().toLowerCase();

  if (term === '') {
    return true;
  }

  return (
    transaction.id.toLowerCase().includes(term) ||
    transaction.customer.email.toLowerCase().includes(term) ||
    transaction.paymentMethod.last4.includes(term)
  );
}

export function filterTransactions(
  transactions: readonly Transaction[],
  query: PaymentsQuery,
  context: PipelineContext,
): readonly Transaction[] {
  const range = resolveDateFilter(query.date, context.now, context.timeZone ?? APP_TIME_ZONE);

  return transactions.filter((transaction) => {
    if (!matchesStatusView(transaction, query.view)) {
      return false;
    }

    if (!matchesSearch(transaction, query.search)) {
      return false;
    }

    if (range !== null) {
      const createdAt = Date.parse(transaction.createdAt);

      if (
        (range.from !== null && createdAt < range.from) ||
        (range.to !== null && createdAt > range.to)
      ) {
        return false;
      }
    }

    if (query.statuses.length > 0 && !query.statuses.includes(transaction.status)) {
      return false;
    }

    if (query.methods.length > 0 && !query.methods.includes(transaction.paymentMethod.type)) {
      return false;
    }

    if (query.currencies.length > 0 && !query.currencies.includes(transaction.currency)) {
      return false;
    }

    if (query.brands.length > 0) {
      const method = transaction.paymentMethod;

      if (method.type === 'ach' || !query.brands.includes(method.brand)) {
        return false;
      }
    }

    if (query.amountMinMinor !== null && transaction.amountMinor < query.amountMinMinor) {
      return false;
    }

    if (query.amountMaxMinor !== null && transaction.amountMinor > query.amountMaxMinor) {
      return false;
    }

    return true;
  });
}

const COMPARATORS: Record<SortField, (a: Transaction, b: Transaction) => number> = {
  createdAt: (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  // Nominal minor units: no FX conversion is invented for mixed currencies.
  amount: (a, b) => a.amountMinor - b.amountMinor,
  // Alphabetical by the visible label (Failed, Pending, Refunded, Succeeded).
  status: (a, b) => STATUS_LABELS[a.status].localeCompare(STATUS_LABELS[b.status]),
};

/**
 * Stable sort that never mutates its input. Ties fall back to newest first
 * and then the id, so the order is deterministic in both directions.
 */
export function sortTransactions(
  transactions: readonly Transaction[],
  sortBy: SortField,
  direction: SortDirection,
): readonly Transaction[] {
  const factor = direction === 'asc' ? 1 : -1;
  const compare = COMPARATORS[sortBy];

  return [...transactions].sort(
    (a, b) => factor * compare(a, b) || COMPARATORS.createdAt(b, a) || a.id.localeCompare(b.id),
  );
}

export function paginate<T>(
  rows: readonly T[],
  page: number,
  pageSize: number,
): { readonly items: readonly T[]; readonly pagination: Pagination } {
  const safePageSize = (PAGE_SIZES as readonly number[]).includes(pageSize)
    ? pageSize
    : DEFAULT_PAGE_SIZE;
  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / safePageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(Math.trunc(page) || 1, 1), totalPages);
  const start = (safePage - 1) * safePageSize;
  const items = rows.slice(start, start + safePageSize);

  return {
    items,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalItems,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
      firstItem: totalItems === 0 ? 0 : start + 1,
      lastItem: start + items.length,
    },
  };
}

/**
 * The single query pipeline used everywhere: search and filters first,
 * sorting over the whole filtered result, pagination last.
 */
export function runPaymentsQuery(
  transactions: readonly Transaction[],
  query: PaymentsQuery,
  context: PipelineContext,
): PaymentsResult {
  const filtered = filterTransactions(transactions, query, context);
  const rows = sortTransactions(filtered, query.sortBy, query.sortDirection);
  const { items, pagination } = paginate(rows, query.page, query.pageSize);

  return { rows, pageRows: items, pagination };
}
