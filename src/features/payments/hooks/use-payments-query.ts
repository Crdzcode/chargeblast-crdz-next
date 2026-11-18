'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

import { parsePaymentsQuery, toQueryString } from '../lib/query-url';
import type { PaymentsQuery } from '../model/query';
import { PAYMENTS_PATH } from '../routes';

const LIST_URL_KEY = 'payments:last-list-url';

export type HistoryMode = 'push' | 'replace';

/**
 * The list URL the user last saw, so the details page can link back to it.
 * Kept in sessionStorage (per tab), unlike the localStorage helpers in
 * lib/browser-storage.ts.
 */
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
    // Without session storage the back link just goes to the unfiltered list.
  }
}

export function readPaymentsQueryFromLocation(): PaymentsQuery {
  return parsePaymentsQuery(new URLSearchParams(window.location.search));
}

/**
 * Writes the query to the URL with the History API. Next.js picks the change
 * up in useSearchParams without a server round trip.
 */
export function writePaymentsQuery(next: PaymentsQuery, history: HistoryMode = 'push'): void {
  const url = `${PAYMENTS_PATH}${toQueryString(next)}`;

  if (url === `${window.location.pathname}${window.location.search}`) {
    return;
  }

  if (history === 'replace') {
    window.history.replaceState(null, '', url);
  } else {
    window.history.pushState(null, '', url);
  }
}

/** The payments query lives in the URL; this reads it and writes it back. */
export function usePaymentsQuery() {
  const searchParams = useSearchParams();
  const query = useMemo(
    () => parsePaymentsQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  useEffect(() => {
    rememberListUrl(`${PAYMENTS_PATH}${window.location.search}`);
  }, [searchParams]);

  /** Applies a filter change and goes back to the first page. */
  const updateFilters = useCallback(
    (patch: Partial<PaymentsQuery>, history: HistoryMode = 'push') =>
      writePaymentsQuery({ ...query, ...patch, page: 1 }, history),
    [query],
  );

  return { query, setQuery: writePaymentsQuery, updateFilters };
}
