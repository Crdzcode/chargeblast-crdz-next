import type {
  CardBrand,
  Currency,
  PaymentMethodType,
  PaymentStatus,
  Transaction,
} from './transaction';

/**
 * The status cards above the filters. A card narrows the result together with
 * the Status chip instead of replacing it.
 */
export const STATUS_VIEWS = [
  'all',
  'succeeded',
  'refunded',
  'disputed',
  'failed',
  'uncaptured',
] as const;
export type StatusView = (typeof STATUS_VIEWS)[number];

export const STATUS_VIEW_LABELS: Record<StatusView, string> = {
  all: 'All',
  succeeded: 'Succeeded',
  refunded: 'Refunded',
  disputed: 'Disputed',
  failed: 'Failed',
  uncaptured: 'Uncaptured',
};

export function matchesStatusView(transaction: Transaction, view: StatusView): boolean {
  switch (view) {
    case 'all':
      return true;
    case 'succeeded':
      return transaction.status === 'succeeded';
    case 'refunded':
      return transaction.status === 'refunded';
    case 'failed':
      // A payment blocked by fraud rules is a failed attempt too.
      return transaction.status === 'failed' || transaction.status === 'blocked';
    case 'disputed':
      return transaction.disputedAt !== null;
    case 'uncaptured':
      return transaction.status === 'pending' && !transaction.captured;
  }
}

export const SORT_FIELDS = ['createdAt', 'amount', 'status'] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortDirection = 'asc' | 'desc';

export const PAGE_SIZES = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 25;

export const DATE_PRESETS = ['today', '7d', '30d'] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

/**
 * Presets stay relative ("last 7 days"), so a shared link still works tomorrow.
 * Custom ranges are calendar days (`YYYY-MM-DD`) in the account time zone, both
 * ends included.
 */
export type DateFilter =
  | { readonly preset: DatePreset }
  | { readonly preset: 'custom'; readonly from: string | null; readonly to: string | null };

export interface PaymentsQuery {
  readonly view: StatusView;
  /** Text search across payment ID, customer email and last 4 digits. */
  readonly search: string;
  readonly date: DateFilter | null;
  readonly statuses: readonly PaymentStatus[];
  readonly methods: readonly PaymentMethodType[];
  readonly currencies: readonly Currency[];
  readonly brands: readonly CardBrand[];
  /**
   * Inclusive bounds in minor units, compared across currencies without
   * conversion. Combine with the Currency filter to look at one currency.
   */
  readonly amountMinMinor: number | null;
  readonly amountMaxMinor: number | null;
  readonly sortBy: SortField;
  readonly sortDirection: SortDirection;
  readonly page: number;
  readonly pageSize: PageSize;
}

export const DEFAULT_PAYMENTS_QUERY: PaymentsQuery = {
  view: 'all',
  search: '',
  date: null,
  statuses: [],
  methods: [],
  currencies: [],
  brands: [],
  amountMinMinor: null,
  amountMaxMinor: null,
  sortBy: 'createdAt',
  sortDirection: 'desc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

/** True when any filter (not sort or pagination) narrows the result. */
export function hasActiveFilters(query: PaymentsQuery): boolean {
  return (
    query.view !== 'all' ||
    query.search.trim() !== '' ||
    query.date !== null ||
    query.statuses.length > 0 ||
    query.methods.length > 0 ||
    query.currencies.length > 0 ||
    query.brands.length > 0 ||
    query.amountMinMinor !== null ||
    query.amountMaxMinor !== null
  );
}

/** Resets every filter while keeping sort and page size. */
export function clearFilters(query: PaymentsQuery): PaymentsQuery {
  return {
    ...DEFAULT_PAYMENTS_QUERY,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    pageSize: query.pageSize,
  };
}
