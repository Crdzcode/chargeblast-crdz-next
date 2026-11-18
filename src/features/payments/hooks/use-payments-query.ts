'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

import { parsePaymentsQuery, toQueryString } from '../lib/query-url';
import type { PaymentsQuery } from '../model/query';

export const PAYMENTS_PATH = '/transactions/payments';
const LIST_URL_KEY = 'payments:last-list-url';

export type HistoryMode = 'push' | 'replace';

/** Last list URL (with filters) so the details page can link back to it. */
export function readLastListUrl(): string {
  try {
    const stored = window.sessionStorage.getItem(LIST_URL_KEY);

    return stored?.startsWith(PAYMENTS_PATH) ? stored : PAYMENTS_PATH;
  } catch {
    return PAYMENTS_PATH;
  }
}

function rememberListUrl(url: string): void {
  try {
    window.sessionStorage.setItem(LIST_URL_KEY, url);
  } catch {
    // Session storage unavailable: the back link falls back to the plain list.
  }
}

/**
 * The URL is the single source of truth for the payments query. Reading
 * goes through the validated parser; writing uses the native History API,
 * which Next.js syncs with useSearchParams without a server round trip.
 */
export function usePaymentsQuery() {
  const searchParams = useSearchParams();
  const query = useMemo(
    () => parsePaymentsQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  useEffect(() => {
    rememberListUrl(`${PAYMENTS_PATH}${window.location.search}`);
  }, [searchParams]);

  const setQuery = useCallback((next: PaymentsQuery, history: HistoryMode = 'push') => {
    const url = `${PAYMENTS_PATH}${toQueryString(next)}`;

    if (url === `${window.location.pathname}${window.location.search}`) {
      return;
    }

    if (history === 'replace') {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }
  }, []);

  /** Applies a filter change and returns to the first page. */
  const updateFilters = useCallback(
    (patch: Partial<PaymentsQuery>, history: HistoryMode = 'push') =>
      setQuery({ ...query, ...patch, page: 1 }, history),
    [query, setQuery],
  );

  return { query, setQuery, updateFilters };
}
