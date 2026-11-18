'use client';

import { createContext, use, useMemo, type ReactNode } from 'react';

import type { Transaction } from '../model/transaction';
import { getTransactions } from './payments-repository';

interface PaymentsData {
  /** Server request time; every relative computation uses it, never Date.now(). */
  readonly referenceNow: number;
  readonly transactions: readonly Transaction[];
}

const PaymentsDataContext = createContext<PaymentsData | null>(null);

/**
 * Shares the daily dataset snapshot with client components. Only the
 * reference instant crosses the server/client boundary; both sides rebuild
 * the identical dataset from it, so the RSC payload stays tiny and the
 * hydrated markup matches the server markup.
 */
export function PaymentsDataProvider({
  referenceNow,
  children,
}: {
  readonly referenceNow: number;
  readonly children: ReactNode;
}) {
  const value = useMemo(
    () => ({ referenceNow, transactions: getTransactions(referenceNow) }),
    [referenceNow],
  );

  return <PaymentsDataContext value={value}>{children}</PaymentsDataContext>;
}

export function usePaymentsData(): PaymentsData {
  const value = use(PaymentsDataContext);

  if (value === null) {
    throw new Error('usePaymentsData must be used inside <PaymentsDataProvider>.');
  }

  return value;
}
